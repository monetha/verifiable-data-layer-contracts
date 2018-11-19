pragma solidity ^0.4.24;

import "./Storage.sol";

contract IPFSStorageLogic is Storage {
    event IPFSHashUpdated(address indexed factProvider, bytes32 indexed key);
    event IPFSHashDeleted(address indexed factProvider, bytes32 indexed key);

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setIPFSHash(bytes32 _key, string _value) external {
        _setIPFSHash(_key, _value);
    }

    /// @param _key The key for the record
    function deleteIPFSHash(bytes32 _key) external {
        _deleteIPFSHash(_key);
    }

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getIPFSHash(address _factProvider, bytes32 _key) external view returns (bool success, string value) {
        return _getIPFSHash(_factProvider, _key);
    }

    function _setIPFSHash(bytes32 _key, string _value) allowedFactProvider internal {
        ipfsHashStorage[msg.sender][_key] = IPFSHashValue({
            initialized : true,
            value : _value
            });
        emit IPFSHashUpdated(msg.sender, _key);
    }

    function _deleteIPFSHash(bytes32 _key) allowedFactProvider internal {
        delete ipfsHashStorage[msg.sender][_key];
        emit IPFSHashDeleted(msg.sender, _key);
    }

    function _getIPFSHash(address _factProvider, bytes32 _key) internal view returns (bool success, string value) {
        IPFSHashValue storage initValue = ipfsHashStorage[_factProvider][_key];
        return (initValue.initialized, initValue.value);
    }
}