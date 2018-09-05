pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoTokens.sol";
import "./IPassportImplRegistry.sol";

/**
 * @title PassportImplRegistry
 * @dev This contract works as a registry of passport implementations, it holds the implementations for the registered versions.
 */
contract PassportImplRegistry is IPassportImplRegistry, Ownable, HasNoEther, HasNoTokens {
    // current passport version/implementation
    string internal currentPassportVersion;
    address internal currentPassportImplementation;

    // Mapping of versions to passport implementations
    mapping(string => address) internal passportVersions;

    /**
     * @dev The PassportImplRegistry constructor sets the current passport version and implementation.
     */
    constructor (string _version, address _implementation) public {
        _addPassportVersion(_version, _implementation);
        _setCurrentPassportVersion(_version);
    }

    /**
     * @dev Registers a new passport version with its implementation address
     * @param _version representing the version name of the new passport implementation to be registered
     * @param _implementation representing the address of the new passport implementation to be registered
     */
    function addPassportVersion(string _version, address _implementation) public onlyOwner {
        _addPassportVersion(_version, _implementation);
    }

    /**
     * @dev Tells the address of the passport implementation for a given version
     * @param _version to query the implementation of
     * @return address of the passport implementation registered for the given version
     */
    function getPassportVersion(string _version) external view returns (address) {
        return passportVersions[_version];
    }

    /**
     * @dev Sets a new passport implementation as current one
     * @param _version representing the version name of the passport implementation to be set as current one
     */
    function setCurrentPassportVersion(string _version) public onlyOwner {
        _setCurrentPassportVersion(_version);
    }

    /**
     * @dev Tells the version of the current passport implementation
     * @return version of the current passport implementation
     */
    function getCurrentPassportVersion() external view returns (string) {
        return currentPassportVersion;
    }

    /**
     * @dev Tells the address of the current passport implementation
     * @return address of the current passport implementation
     */
    function getCurrentPassportImplementation() external view returns (address) {
        return currentPassportImplementation;
    }

    function _addPassportVersion(string _version, address _implementation) internal {
        require(_implementation != 0x0, "Cannot set implementation to a zero address");
        require(passportVersions[_version] == 0x0, "Cannot replace existing version implementation");

        passportVersions[_version] = _implementation;
        emit PassportVersionAdded(_version, _implementation);
    }

    function _setCurrentPassportVersion(string _version) internal {
        require(passportVersions[_version] != 0x0, "Cannot set non-existing passport version as current implementation");

        currentPassportVersion = _version;
        currentPassportImplementation = passportVersions[_version];
        emit CurrentPassportImplSet(currentPassportVersion, currentPassportImplementation);
    }
}