pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Storage.sol";

contract PrivateDataStorageLogic is Storage {
    using SafeMath for uint256;

    event PrivateDataUpdated(address indexed factProvider, bytes32 indexed key);
    event PrivateDataDeleted(address indexed factProvider, bytes32 indexed key);

    event PrivateDataExchangeProposed(uint256 indexed exchangeIdx, address indexed dataRequester, address indexed passportOwner);
    event PrivateDataExchangeAccepted(uint256 indexed exchangeIdx, address indexed dataRequester, address indexed passportOwner);
    event PrivateDataExchangeClosed(uint256 indexed exchangeIdx);
    event PrivateDataExchangeDisputed(uint256 indexed exchangeIdx, bool indexed successful, address indexed cheater);

    uint256 constant private proposedTimeout = 1 days;
    uint256 constant private acceptedTimeout = 1 days;

    /// @param _key The key for the record
    /// @param _dataIPFSHash The IPFS hash of encrypted private data
    /// @param _keyHash The hash of symmetric key that was used to encrypt the data
    function setPrivateData(bytes32 _key, string _dataIPFSHash, bytes32 _keyHash) external {
        _setPrivateData(_key, _dataIPFSHash, _keyHash);
    }

    /// @param _key The key for the record
    function deletePrivateData(bytes32 _key) external {
        _deletePrivateData(_key);
    }

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getPrivateData(address _factProvider, bytes32 _key) external view returns (bool success, string dataIPFSHash, bytes32 dataKeyHash) {
        return _getPrivateData(_factProvider, _key);
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
        (bool success, string memory dataIPFSHash, bytes32 dataKeyHash) = _getPrivateData(_factProvider, _key);
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
            stateExpired : now + proposedTimeout
            });
        privateDataExchanges.push(exchange);

        _incOpenPrivateDataExchangeCount();

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
        require(now < exchange.stateExpired, "exchange state expired");

        exchange.passportOwnerValue = msg.value;
        exchange.encryptedDataKey = _encryptedDataKey;
        exchange.state = PrivateDataExchangeState.Accepted;
        exchange.stateExpired = now + acceptedTimeout;

        emit PrivateDataExchangeAccepted(_exchangeIdx, exchange.dataRequester, msg.sender);
    }

    /// @param _exchangeIdx The private data exchange index
    function finishPrivateDataExchange(uint256 _exchangeIdx) external {
        require(_exchangeIdx < privateDataExchanges.length, "invalid exchange index");
        PrivateDataExchange storage exchange = privateDataExchanges[_exchangeIdx];
        require(PrivateDataExchangeState.Accepted == exchange.state, "exchange must be in accepted state");
        require(now > exchange.stateExpired || msg.sender == exchange.dataRequester, "exchange must be either expired or be finished by the data requester");

        exchange.state = PrivateDataExchangeState.Closed;

        // transfer all exchange staked money to passport owner
        uint256 val = exchange.dataRequesterValue.add(exchange.passportOwnerValue);
        require(exchange.passportOwner.send(val));

        _decOpenPrivateDataExchangeCount();

        emit PrivateDataExchangeClosed(_exchangeIdx);
    }

    /// @param _exchangeIdx The private data exchange index
    function timeoutPrivateDataExchange(uint256 _exchangeIdx) external {
        require(_exchangeIdx < privateDataExchanges.length, "invalid exchange index");
        PrivateDataExchange storage exchange = privateDataExchanges[_exchangeIdx];
        require(PrivateDataExchangeState.Proposed == exchange.state, "exchange must be in proposed state");
        require(msg.sender == exchange.dataRequester, "only data requester allowed");
        require(now > exchange.stateExpired, "exchange must be expired");

        exchange.state = PrivateDataExchangeState.Closed;

        // return staked amount to data requester
        require(exchange.dataRequester.send(exchange.dataRequesterValue));

        _decOpenPrivateDataExchangeCount();

        emit PrivateDataExchangeClosed(_exchangeIdx);
    }

    /// @param _exchangeIdx The private data exchange index
    /// @param _exchangeKey The unencrypted exchange session key
    function disputePrivateDataExchange(uint256 _exchangeIdx, bytes32 _exchangeKey) external {
        require(_exchangeIdx < privateDataExchanges.length, "invalid exchange index");
        PrivateDataExchange storage exchange = privateDataExchanges[_exchangeIdx];
        require(PrivateDataExchangeState.Accepted == exchange.state, "exchange must be in accepted state");
        require(msg.sender == exchange.dataRequester, "only data requester allowed");
        require(now < exchange.stateExpired, "exchange must not be expired");
        require(keccak256(abi.encodePacked(_exchangeKey)) == exchange.exchangeKeyHash, "exchange key hash must match");

        bytes32 dataKey = _exchangeKey ^ exchange.encryptedDataKey; // data symmetric key is XORed with exchange key
        bool validDataKey = keccak256(abi.encodePacked(dataKey)) == exchange.dataKeyHash;

        exchange.state = PrivateDataExchangeState.Closed;

        uint256 val = exchange.dataRequesterValue.add(exchange.passportOwnerValue);

        address cheater;
        if (validDataKey) { // the data key was valid -> data requester cheated
            require(exchange.passportOwner.send(val));
            cheater = exchange.dataRequester;
        } else { // the data key is invalid -> passport owner cheated
            require(exchange.dataRequester.send(val));
            cheater = exchange.passportOwner;
        }

        _decOpenPrivateDataExchangeCount();

        emit PrivateDataExchangeClosed(_exchangeIdx);
        emit PrivateDataExchangeDisputed(_exchangeIdx, !validDataKey, cheater);
    }

    function _incOpenPrivateDataExchangeCount() internal { openPrivateDataExchangeCount = openPrivateDataExchangeCount + 1; }
    function _decOpenPrivateDataExchangeCount() internal { openPrivateDataExchangeCount = openPrivateDataExchangeCount - 1; }

    function _setPrivateData(bytes32 _key, string _dataIPFSHash, bytes32 _keyHash) allowedFactProvider internal {
        privateDataStorage[msg.sender][_key] = PrivateDataValue({
            initialized : true,
            value : PrivateData({
                dataIPFSHash : _dataIPFSHash,
                dataKeyHash : _keyHash
                })
            });
        emit PrivateDataUpdated(msg.sender, _key);
    }

    function _deletePrivateData(bytes32 _key) allowedFactProvider internal {
        delete privateDataStorage[msg.sender][_key];
        emit PrivateDataDeleted(msg.sender, _key);
    }

    function _getPrivateData(address _factProvider, bytes32 _key) internal view returns (bool success, string dataIPFSHash, bytes32 dataKeyHash) {
        PrivateDataValue storage initValue = privateDataStorage[_factProvider][_key];
        return (initValue.initialized, initValue.value.dataIPFSHash, initValue.value.dataKeyHash);
    }

}