pragma solidity ^0.4.24;

contract BytesStorage {
    struct BytesValue {
        bool initialized;
        bytes value;
    }

    event BytesUpdated(address indexed factProvider, bytes32 indexed key);
    event BytesDeleted(address indexed factProvider, bytes32 indexed key);

    mapping(address => mapping(bytes32 => BytesValue)) private bytesStorage;

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setBytes(bytes32 _key, bytes _value) external {
        _setBytes(_key, _value);
    }

    /// @param _key The key for the record
    function deleteBytes(bytes32 _key) external {
        _deleteBytes(_key);
    }

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getBytes(address _factProvider, bytes32 _key) external view returns (bool success, bytes value) {
        return _getBytes(_factProvider, _key);
    }

    /// @param _key The key for the record
    function getBytes(bytes32 _key) external view returns (bool success, bytes value) {
        return _getBytes(msg.sender, _key);
    }

    function _setBytes(bytes32 _key, bytes _value) internal {
        bytesStorage[msg.sender][_key] = BytesValue({
            initialized : true,
            value : _value
            });
        emit BytesUpdated(msg.sender, _key);
    }

    function _deleteBytes(bytes32 _key) internal {
        delete bytesStorage[msg.sender][_key];
        emit BytesDeleted(msg.sender, _key);
    }

    function _getBytes(address _factProvider, bytes32 _key) internal view returns (bool success, bytes value) {
        BytesValue storage initValue = bytesStorage[_factProvider][_key];
        return (initValue.initialized, initValue.value);
    }
}