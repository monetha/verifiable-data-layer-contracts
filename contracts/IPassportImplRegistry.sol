pragma solidity ^0.4.24;

interface IPassportImplRegistry {
    /**
     * @dev This event will be emitted every time a new passport implementation is registered
     * @param version representing the version name of the registered passport implementation
     * @param implementation representing the address of the registered passport implementation
     */
    event PassportVersionAdded(string version, address implementation);

    /**
     * @dev This event will be emitted every time a new passport implementation is set as current one
     * @param version representing the version name of the current passport implementation
     * @param implementation representing the address of the current passport implementation
     */
    event CurrentPassportImplSet(string version, address implementation);

    /**
     * @dev Tells the address of the passport implementation for a given version
     * @param _version to query the implementation of
     * @return address of the passport implementation registered for the given version
     */
    function getPassportVersion(string _version) external view returns (address);

    /**
     * @dev Tells the version of the current passport implementation
     * @return version of the current passport implementation
     */
    function getCurrentPassportVersion() external view returns (string);

    /**
     * @dev Tells the address of the current passport implementation
     * @return address of the current passport implementation
     */
    function getCurrentPassportImplementation() external view returns (address);
}