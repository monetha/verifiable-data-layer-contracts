pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoTokens.sol";
import "./Passport.sol";

/**
 * @title PassportFactory
 * @dev This contract works as a passport factory.
 */
contract PassportFactory is Ownable, HasNoEther, HasNoTokens {
    IPassportLogicRegistry private registry;

    /**
    * @dev This event will be emitted every time a new passport is created
    * @param passport representing the address of the passport created
    * @param owner representing the address of the passport owner
    */
    event PassportCreated(address indexed passport, address indexed owner);

    /**
    * @dev This event will be emitted every time a passport logic registry is changed
    * @param oldRegistry representing the address of the old passport logic registry
    * @param newRegistry representing the address of the new passport logic registry
    */
    event PassportLogicRegistryChanged(address indexed oldRegistry, address indexed newRegistry);

    constructor(IPassportLogicRegistry _registry) public {
        _setRegistry(_registry);
    }

    function setRegistry(IPassportLogicRegistry _registry) public onlyOwner {
        emit PassportLogicRegistryChanged(registry, _registry);
        _setRegistry(_registry);
    }

    function getRegistry() external view returns (address) {
        return registry;
    }

    /**
    * @dev Creates new passport. The method should be called by the owner of the created passport.
    * After the passport is created, the owner must call the claimOwnership() passport method to become a full owner.
    * @return address of the created passport
    */
    function createPassport() public returns (Passport) {
        Passport pass = new Passport(registry);
        pass.transferOwnership(msg.sender); // owner needs to call claimOwnership()
        emit PassportCreated(pass, msg.sender);
        return pass;
    }

    function _setRegistry(IPassportLogicRegistry _registry) internal {
        require(address(_registry) != 0x0);
        registry = _registry;
    }
}