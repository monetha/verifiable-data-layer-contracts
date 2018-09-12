pragma solidity ^0.4.24;

interface IPassportLogicRegistry {
    /**
     * @dev This event will be emitted every time a new passport logic implementation is registered
     * @param version representing the version name of the registered passport logic implementation
     * @param implementation representing the address of the registered passport logic implementation
     */
    event PassportLogicAdded(string version, address implementation);

    /**
     * @dev This event will be emitted every time a new passport logic implementation is set as current one
     * @param version representing the version name of the current passport logic implementation
     * @param implementation representing the address of the current passport logic implementation
     */
    event CurrentPassportLogicSet(string version, address implementation);

    /**
     * @dev Tells the address of the passport logic implementation for a given version
     * @param _version to query the implementation of
     * @return address of the passport logic implementation registered for the given version
     */
    function getPassportLogic(string _version) external view returns (address);

    /**
     * @dev Tells the version of the current passport logic implementation
     * @return version of the current passport logic implementation
     */
    function getCurrentPassportLogicVersion() external view returns (string);

    /**
     * @dev Tells the address of the current passport logic implementation
     * @return address of the current passport logic implementation
     */
    function getCurrentPassportLogic() external view returns (address);
}