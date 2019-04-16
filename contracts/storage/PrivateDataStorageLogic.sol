pragma solidity ^0.4.24;

import "./Storage.sol";

contract PrivateDataStorageLogic is Storage {
    event PrivateDataUpdated(address indexed factProvider, bytes32 indexed key);
    event PrivateDataDeleted(address indexed factProvider, bytes32 indexed key);

    event PrivateDataExchangeProposed(uint256 indexed exchangeIdx, address indexed dataRequester, address indexed passportOwner);
    event PrivateDataExchangeAccepted(uint256 indexed exchangeIdx, address indexed dataRequester, address indexed passportOwner);

    uint256 constant proposedTimeout = 1 days;
    uint256 constant acceptedTimeout = 1 days;

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
        openPrivateDataExchangeCount = openPrivateDataExchangeCount + 1;

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