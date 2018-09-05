pragma solidity ^0.4.24;

interface IPassport {
    /**
     * @dev Returns the owner address of contract.
     */
    function getOwner() external view returns (address);

    /**** Storage Set Methods ***********/

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setAddress(bytes32 _key, address _value) external;

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setUint(bytes32 _key, uint _value) external;

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setInt(bytes32 _key, int _value) external;

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setBool(bytes32 _key, bool _value) external;

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setString(bytes32 _key, string _value) external;

    /// @param _key The key for the record
    /// @param _value The value for the record
    function setBytes(bytes32 _key, bytes _value) external;

    /**** Storage Delete Methods ***********/

    /// @param _key The key for the record
    function deleteAddress(bytes32 _key) external;

    /// @param _key The key for the record
    function deleteUint(bytes32 _key) external;

    /// @param _key The key for the record
    function deleteInt(bytes32 _key) external;

    /// @param _key The key for the record
    function deleteBool(bytes32 _key) external;

    /// @param _key The key for the record
    function deleteString(bytes32 _key) external;

    /// @param _key The key for the record
    function deleteBytes(bytes32 _key) external;

    /**** Storage Get Methods ***********/

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getAddress(address _factProvider, bytes32 _key) external view returns (bool success, address value);

    /// @param _key The key for the record
    function getAddress(bytes32 _key) external view returns (bool success, address value);

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getUint(address _factProvider, bytes32 _key) external view returns (bool success, uint value);

    /// @param _key The key for the record
    function getUint(bytes32 _key) external view returns (bool success, uint value);

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getInt(address _factProvider, bytes32 _key) external view returns (bool success, int value);

    /// @param _key The key for the record
    function getInt(bytes32 _key) external view returns (bool success, int value);

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getBool(address _factProvider, bytes32 _key) external view returns (bool success, bool value);

    /// @param _key The key for the record
    function getBool(bytes32 _key) external view returns (bool success, bool value);

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getString(address _factProvider, bytes32 _key) external view returns (bool success, string value);

    /// @param _key The key for the record
    function getString(bytes32 _key) external view returns (bool success, string value);

    /// @param _factProvider The fact provider
    /// @param _key The key for the record
    function getBytes(address _factProvider, bytes32 _key) external view returns (bool success, bytes value);

    /// @param _key The key for the record
    function getBytes(bytes32 _key) external view returns (bool success, bytes value);

}