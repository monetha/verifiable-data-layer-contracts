pragma solidity ^0.4.24;

contract StringStorage {
    struct StringValue {
        bool initialized;
        string value;
    }

    event StringUpdated(address indexed factProvider, bytes32 indexed key);
    event StringDeleted(address indexed factProvider, bytes32 indexed key);

    mapping(address => mapping(bytes32 => StringValue)) private stringStorage;

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setString(bytes32 _key, string _value) external {
        _setString(_key, _value);
    }

    /// @param _key The key for the record
    function deleteString(bytes32 _key) external {
        _deleteString(_key);
    }

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getString(address _factProvider, bytes32 _key) external view returns (bool success, string value) {
        return _getString(_factProvider, _key);
    }

    /// @param _key The key for the record
    function getString(bytes32 _key) external view returns (bool success, string value) {
        return _getString(msg.sender, _key);
    }

    function _setString(bytes32 _key, string _value) internal {
        stringStorage[msg.sender][_key] = StringValue({
            initialized : true,
            value : _value
            });
        emit StringUpdated(msg.sender, _key);
    }

    function _deleteString(bytes32 _key) internal {
        delete stringStorage[msg.sender][_key];
        emit StringDeleted(msg.sender, _key);
    }

    function _getString(address _factProvider, bytes32 _key) internal view returns (bool success, string value) {
        StringValue storage initValue = stringStorage[_factProvider][_key];
        return (initValue.initialized, initValue.value);
    }
}