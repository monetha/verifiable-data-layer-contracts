pragma solidity ^0.4.24;

import "./Storage.sol";

contract UintStorageLogic is Storage {
    event UintUpdated(address indexed factProvider, bytes32 indexed key);
    event UintDeleted(address indexed factProvider, bytes32 indexed key);

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setUint(bytes32 _key, uint _value) external {
        _setUint(_key, _value);
    }

    /// @param _key The key for the record
    function deleteUint(bytes32 _key) external {
        _deleteUint(_key);
    }

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getUint(address _factProvider, bytes32 _key) external view returns (bool success, uint value) {
        return _getUint(_factProvider, _key);
    }

    function _setUint(bytes32 _key, uint _value) internal {
        uintStorage[msg.sender][_key] = UintValue({
            initialized : true,
            value : _value
            });
        emit UintUpdated(msg.sender, _key);
    }

    function _deleteUint(bytes32 _key) internal {
        delete uintStorage[msg.sender][_key];
        emit UintDeleted(msg.sender, _key);
    }

    function _getUint(address _factProvider, bytes32 _key) internal view returns (bool success, uint value) {
        UintValue storage initValue = uintStorage[_factProvider][_key];
        return (initValue.initialized, initValue.value);
    }
}