pragma solidity ^0.4.24;

import "./Storage.sol";

contract PrivateDataStorageLogic is Storage {
    event PrivateDataUpdated(address indexed factProvider, bytes32 indexed key);
    event PrivateDataDeleted(address indexed factProvider, bytes32 indexed key);

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
    function getPrivateData(address _factProvider, bytes32 _key) external view returns (bool success, string dataIPFSHash, bytes32 keyHash) {
        return _getPrivateData(_factProvider, _key);
    }

    function _setPrivateData(bytes32 _key, string _dataIPFSHash, bytes32 _keyHash) allowedFactProvider internal {
        privateDataStorage[msg.sender][_key] = PrivateDataValue({
            initialized : true,
            value : PrivateData({
                dataIPFSHash : _dataIPFSHash,
                keyHash : _keyHash
                })
            });
        emit PrivateDataUpdated(msg.sender, _key);
    }

    function _deletePrivateData(bytes32 _key) allowedFactProvider internal {
        delete privateDataStorage[msg.sender][_key];
        emit PrivateDataDeleted(msg.sender, _key);
    }

    function _getPrivateData(address _factProvider, bytes32 _key) internal view returns (bool success, string dataIPFSHash, bytes32 keyHash) {
        PrivateDataValue storage initValue = privateDataStorage[_factProvider][_key];
        return (initValue.initialized, initValue.value.dataIPFSHash, initValue.value.keyHash);
    }

}