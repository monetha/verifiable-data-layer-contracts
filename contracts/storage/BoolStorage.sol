pragma solidity ^0.4.24;

contract BoolStorage {
    struct BoolValue {
        bool initialized;
        bool value;
    }

    event BoolUpdated(address indexed factProvider, bytes32 indexed key);
    event BoolDeleted(address indexed factProvider, bytes32 indexed key);

    mapping(address => mapping(bytes32 => BoolValue)) private boolStorage;

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setBool(bytes32 _key, bool _value) external {
        _setBool(_key, _value);
    }

    /// @param _key The key for the record
    function deleteBool(bytes32 _key) external {
        _deleteBool(_key);
    }

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getBool(address _factProvider, bytes32 _key) external view returns (bool success, bool value) {
        return _getBool(_factProvider, _key);
    }

    /// @param _key The key for the record
    function getBool(bytes32 _key) external view returns (bool success, bool value) {
        return _getBool(msg.sender, _key);
    }

    function _setBool(bytes32 _key, bool _value) internal {
        boolStorage[msg.sender][_key] = BoolValue({
            initialized : true,
            value : _value
            });
        emit BoolUpdated(msg.sender, _key);
    }

    function _deleteBool(bytes32 _key) internal {
        delete boolStorage[msg.sender][_key];
        emit BoolDeleted(msg.sender, _key);
    }

    function _getBool(address _factProvider, bytes32 _key) internal view returns (bool success, bool value) {
        BoolValue storage initValue = boolStorage[_factProvider][_key];
        return (initValue.initialized, initValue.value);
    }
}