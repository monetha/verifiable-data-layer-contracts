pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoTokens.sol";
import "./IPassportLogicRegistry.sol";

/**
 * @title PassportImplRegistry
 * @dev This contract works as a registry of passport implementations, it holds the implementations for the registered versions.
 */
contract PassportLogicRegistry is IPassportLogicRegistry, Ownable, HasNoEther, HasNoTokens {
    // current passport version/implementation
    string internal currentPassportLogicVersion;
    address internal currentPassportLogic;

    // Mapping of versions to passport implementations
    mapping(string => address) internal passportLogicImplementations;

    /**
     * @dev The PassportImplRegistry constructor sets the current passport version and implementation.
     */
    constructor (string _version, address _implementation) public {
        _addPassportLogic(_version, _implementation);
        _setCurrentPassportLogic(_version);
    }

    /**
     * @dev Registers a new passport version with its logic implementation address
     * @param _version representing the version name of the new passport logic implementation to be registered
     * @param _implementation representing the address of the new passport logic implementation to be registered
     */
    function addPassportLogic(string _version, address _implementation) public onlyOwner {
        _addPassportLogic(_version, _implementation);
    }

    /**
     * @dev Tells the address of the passport logic implementation for a given version
     * @param _version to query the implementation of
     * @return address of the passport logic implementation registered for the given version
     */
    function getPassportLogic(string _version) external view returns (address) {
        return passportLogicImplementations[_version];
    }

    /**
     * @dev Sets a new passport logic implementation as current one
     * @param _version representing the version name of the passport logic implementation to be set as current one
     */
    function setCurrentPassportLogic(string _version) public onlyOwner {
        _setCurrentPassportLogic(_version);
    }

    /**
     * @dev Tells the version of the current passport logic implementation
     * @return version of the current passport logic implementation
     */
    function getCurrentPassportLogicVersion() external view returns (string) {
        return currentPassportLogicVersion;
    }

    /**
     * @dev Tells the address of the current passport logic implementation
     * @return address of the current passport logic implementation
     */
    function getCurrentPassportLogic() external view returns (address) {
        return currentPassportLogic;
    }

    function _addPassportLogic(string _version, address _implementation) internal {
        require(_implementation != 0x0, "Cannot set implementation to a zero address");
        require(passportLogicImplementations[_version] == 0x0, "Cannot replace existing version implementation");

        passportLogicImplementations[_version] = _implementation;
        emit PassportLogicAdded(_version, _implementation);
    }

    function _setCurrentPassportLogic(string _version) internal {
        require(passportLogicImplementations[_version] != 0x0, "Cannot set non-existing passport logic as current implementation");

        currentPassportLogicVersion = _version;
        currentPassportLogic = passportLogicImplementations[_version];
        emit CurrentPassportLogicSet(currentPassportLogicVersion, currentPassportLogic);
    }
}