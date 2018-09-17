pragma solidity ^0.4.24;

contract IntStorage {
    struct IntValue {
        bool initialized;
        int value;
    }

    event IntUpdated(address indexed factProvider, bytes32 indexed key);
    event IntDeleted(address indexed factProvider, bytes32 indexed key);

    mapping(address => mapping(bytes32 => IntValue)) private intStorage;

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setInt(bytes32 _key, int _value) external {
        _setInt(_key, _value);
    }

    /// @param _key The key for the record
    function deleteInt(bytes32 _key) external {
        _deleteInt(_key);
    }

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getInt(address _factProvider, bytes32 _key) external view returns (bool success, int value) {
        return _getInt(_factProvider, _key);
    }

    function _setInt(bytes32 _key, int _value) internal {
        intStorage[msg.sender][_key] = IntValue({
            initialized : true,
            value : _value
            });
        emit IntUpdated(msg.sender, _key);
    }

    function _deleteInt(bytes32 _key) internal {
        delete intStorage[msg.sender][_key];
        emit IntDeleted(msg.sender, _key);
    }

    function _getInt(address _factProvider, bytes32 _key) internal view returns (bool success, int value) {
        IntValue storage initValue = intStorage[_factProvider][_key];
        return (initValue.initialized, initValue.value);
    }
}