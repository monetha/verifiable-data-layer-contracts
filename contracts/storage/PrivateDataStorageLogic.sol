pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Storage.sol";

contract PrivateDataStorageLogic is Storage {
    using SafeMath for uint256;

    event PrivateDataHashesUpdated(address indexed factProvider, bytes32 indexed key);
    event PrivateDataHashesDeleted(address indexed factProvider, bytes32 indexed key);

    event PrivateDataExchangeProposed(uint256 indexed exchangeIdx, address indexed dataRequester, address indexed passportOwner);
    event PrivateDataExchangeAccepted(uint256 indexed exchangeIdx, address indexed dataRequester, address indexed passportOwner);
    event PrivateDataExchangeClosed(uint256 indexed exchangeIdx);
    event PrivateDataExchangeDisputed(uint256 indexed exchangeIdx, bool indexed successful, address indexed cheater);

    uint256 constant public privateDataExchangeProposeTimeout = 1 days;
    uint256 constant public privateDataExchangeAcceptTimeout = 1 days;

    /// @param _key The key for the record
    /// @param _dataIPFSHash The IPFS hash of encrypted private data
    /// @param _dataKeyHash The hash of symmetric key that was used to encrypt the data
    function setPrivateDataHashes(bytes32 _key, string _dataIPFSHash, bytes32 _dataKeyHash) external {
        _setPrivateDataHashes(_key, _dataIPFSHash, _dataKeyHash);
    }

    /// @param _key The key for the record
    function deletePrivateDataHashes(bytes32 _key) external {
        _deletePrivateDataHashes(_key);
    }

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getPrivateDataHashes(address _factProvider, bytes32 _key) external view returns (bool success, string dataIPFSHash, bytes32 dataKeyHash) {
        return _getPrivateDataHashes(_factProvider, _key);
    }

    /**
     * @dev returns the number of private data exchanges created.
     */
    function getPrivateDataExchangesCount() public constant returns (uint256 count) {
        return privateDataExchanges.length;
    }

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    /// @param _encryptedExchangeKey The encrypted exchange session key (only passport owner can decrypt it)
    /// @param _exchangeKeyHash The hash of exchange session key
    function proposePrivateDataExchange(
        address _factProvider,
        bytes32 _key,
        bytes _encryptedExchangeKey,
        bytes32 _exchangeKeyHash
    ) external payable {
        (bool success, string memory dataIPFSHash, bytes32 dataKeyHash) = _getPrivateDataHashes(_factProvider, _key);
        require(success, "private data must exist");

        address passportOwner = _getOwner();
        bytes32 encryptedDataKey;
        PrivateDataExchange memory exchange = PrivateDataExchange({
            dataRequester : msg.sender,
            dataRequesterValue : msg.value,
            passportOwner : passportOwner,
            passportOwnerValue : 0,
            factProvider : _factProvider,
            key : _key,
            dataIPFSHash : dataIPFSHash,
            dataKeyHash : dataKeyHash,
            encryptedExchangeKey : _encryptedExchangeKey,
            exchangeKeyHash : _exchangeKeyHash,
            encryptedDataKey : encryptedDataKey,
            state : PrivateDataExchangeState.Proposed,
            stateExpired : _nowSeconds() + privateDataExchangeProposeTimeout
            });
        privateDataExchanges.push(exchange);

        _incOpenPrivateDataExchangesCount();

        uint256 exchangeIdx = privateDataExchanges.length - 1;
        emit PrivateDataExchangeProposed(exchangeIdx, msg.sender, passportOwner);
    }

    /// @param _exchangeIdx The private data exchange index
    /// @param _encryptedDataKey The data symmetric key XORed with the exchange key
    function acceptPrivateDataExchange(uint256 _exchangeIdx, bytes32 _encryptedDataKey) external payable {
        require(_exchangeIdx < privateDataExchanges.length, "invalid exchange index");
        PrivateDataExchange storage exchange = privateDataExchanges[_exchangeIdx];
        require(msg.sender == exchange.passportOwner, "only passport owner allowed");
        require(PrivateDataExchangeState.Proposed == exchange.state, "exchange must be in proposed state");
        require(msg.value >= exchange.dataRequesterValue, "need to stake at least data requester amount");
        require(_nowSeconds() < exchange.stateExpired, "exchange state expired");

        exchange.passportOwnerValue = msg.value;
        exchange.encryptedDataKey = _encryptedDataKey;
        exchange.state = PrivateDataExchangeState.Accepted;
        exchange.stateExpired = _nowSeconds() + privateDataExchangeAcceptTimeout;

        emit PrivateDataExchangeAccepted(_exchangeIdx, exchange.dataRequester, msg.sender);
    }

    /// @param _exchangeIdx The private data exchange index
    function finishPrivateDataExchange(uint256 _exchangeIdx) external {
        require(_exchangeIdx < privateDataExchanges.length, "invalid exchange index");
        PrivateDataExchange storage exchange = privateDataExchanges[_exchangeIdx];
        require(PrivateDataExchangeState.Accepted == exchange.state, "exchange must be in accepted state");
        require(_nowSeconds() > exchange.stateExpired || msg.sender == exchange.dataRequester, "exchange must be either expired or be finished by the data requester");

        exchange.state = PrivateDataExchangeState.Closed;

        // transfer all exchange staked money to passport owner
        uint256 val = exchange.dataRequesterValue.add(exchange.passportOwnerValue);
        require(exchange.passportOwner.send(val));

        _decOpenPrivateDataExchangesCount();

        emit PrivateDataExchangeClosed(_exchangeIdx);
    }

    /// @param _exchangeIdx The private data exchange index
    function timeoutPrivateDataExchange(uint256 _exchangeIdx) external {
        require(_exchangeIdx < privateDataExchanges.length, "invalid exchange index");
        PrivateDataExchange storage exchange = privateDataExchanges[_exchangeIdx];
        require(PrivateDataExchangeState.Proposed == exchange.state, "exchange must be in proposed state");
        require(msg.sender == exchange.dataRequester, "only data requester allowed");
        require(_nowSeconds() > exchange.stateExpired, "exchange must be expired");

        exchange.state = PrivateDataExchangeState.Closed;

        // return staked amount to data requester
        require(exchange.dataRequester.send(exchange.dataRequesterValue));

        _decOpenPrivateDataExchangesCount();

        emit PrivateDataExchangeClosed(_exchangeIdx);
    }

    /// @param _exchangeIdx The private data exchange index
    /// @param _exchangeKey The unencrypted exchange session key
    function disputePrivateDataExchange(uint256 _exchangeIdx, bytes32 _exchangeKey) external {
        require(_exchangeIdx < privateDataExchanges.length, "invalid exchange index");
        PrivateDataExchange storage exchange = privateDataExchanges[_exchangeIdx];
        require(PrivateDataExchangeState.Accepted == exchange.state, "exchange must be in accepted state");
        require(msg.sender == exchange.dataRequester, "only data requester allowed");
        require(_nowSeconds() < exchange.stateExpired, "exchange must not be expired");
        require(keccak256(abi.encodePacked(_exchangeKey)) == exchange.exchangeKeyHash, "exchange key hash must match");

        bytes32 dataKey = _exchangeKey ^ exchange.encryptedDataKey;
        // data symmetric key is XORed with exchange key
        bool validDataKey = keccak256(abi.encodePacked(dataKey)) == exchange.dataKeyHash;

        exchange.state = PrivateDataExchangeState.Closed;

        uint256 val = exchange.dataRequesterValue.add(exchange.passportOwnerValue);

        address cheater;
        if (validDataKey) {// the data key was valid -> data requester cheated
            require(exchange.passportOwner.send(val));
            cheater = exchange.dataRequester;
        } else {// the data key is invalid -> passport owner cheated
            require(exchange.dataRequester.send(val));
            cheater = exchange.passportOwner;
        }

        _decOpenPrivateDataExchangesCount();

        emit PrivateDataExchangeClosed(_exchangeIdx);
        emit PrivateDataExchangeDisputed(_exchangeIdx, !validDataKey, cheater);
    }

    function _incOpenPrivateDataExchangesCount() internal {
        if (++openPrivateDataExchangesCount == 1) {
            // don't allow passport owner to transfer ownership and destroy passport when there are open exchanges
            _setPaused(true);
        }
    }

    function _decOpenPrivateDataExchangesCount() internal {
        if (--openPrivateDataExchangesCount == 0) {
            // allow passport owner to transfer ownership and destroy passport when all exchanges are closed
            _setPaused(false);
        }
    }

    function _setPrivateDataHashes(bytes32 _key, string _dataIPFSHash, bytes32 _dataKeyHash) allowedFactProvider internal {
        privateDataStorage[msg.sender][_key] = PrivateDataValue({
            initialized : true,
            value : PrivateData({
                dataIPFSHash : _dataIPFSHash,
                dataKeyHash : _dataKeyHash
                })
            });
        emit PrivateDataHashesUpdated(msg.sender, _key);
    }

    function _deletePrivateDataHashes(bytes32 _key) allowedFactProvider internal {
        delete privateDataStorage[msg.sender][_key];
        emit PrivateDataHashesDeleted(msg.sender, _key);
    }

    function _getPrivateDataHashes(address _factProvider, bytes32 _key) internal view returns (bool success, string dataIPFSHash, bytes32 dataKeyHash) {
        PrivateDataValue storage initValue = privateDataStorage[_factProvider][_key];
        return (initValue.initialized, initValue.value.dataIPFSHash, initValue.value.dataKeyHash);
    }

    function _nowSeconds() private view returns(uint256) {
        uint256 t = now;

        // In Quorum blockchain timestamp is in nanoseconds, not seconds:
        // https://github.com/jpmorganchase/quorum/issues/713
        // https://github.com/jpmorganchase/quorum/issues/190
        if (t > 150000000000000000) {
            t /= 1000000000;
        }

        return t;
    }
}