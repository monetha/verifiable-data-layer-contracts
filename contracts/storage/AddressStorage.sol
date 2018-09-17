pragma solidity ^0.4.24;

contract AddressStorage {
    struct AddressValue {
        bool initialized;
        address value;
    }

    event AddressUpdated(address indexed factProvider, bytes32 indexed key);
    event AddressDeleted(address indexed factProvider, bytes32 indexed key);

    mapping(address => mapping(bytes32 => AddressValue)) private addressStorage;

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setAddress(bytes32 _key, address _value) external {
        _setAddress(_key, _value);
    }

    /// @param _key The key for the record
    function deleteAddress(bytes32 _key) external {
        _deleteAddress(_key);
    }

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getAddress(address _factProvider, bytes32 _key) external view returns (bool success, address value) {
        return _getAddress(_factProvider, _key);
    }

    function _setAddress(bytes32 _key, address _value) internal {
        addressStorage[msg.sender][_key] = AddressValue({
            initialized : true,
            value : _value
            });
        emit AddressUpdated(msg.sender, _key);
    }

    function _deleteAddress(bytes32 _key) internal {
        delete addressStorage[msg.sender][_key];
        emit AddressDeleted(msg.sender, _key);
    }

    function _getAddress(address _factProvider, bytes32 _key) internal view returns (bool success, address value) {
        AddressValue storage initValue = addressStorage[_factProvider][_key];
        return (initValue.initialized, initValue.value);
    }
}