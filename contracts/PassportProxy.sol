pragma solidity ^0.4.24;

import "./ownership/ClaimableProxy.sol";
import "./lifecycle/DestructibleProxy.sol";
import "./IPassportImplRegistry.sol";
import "./upgradeability/Proxy.sol";

/**
 * @title PassportProxy
 */
contract PassportProxy is Proxy, ClaimableProxy, DestructibleProxy {

    event PassportImplRegistryChanged(
        address indexed previousRegistry,
        address indexed newRegistry
    );

    /**
     * @dev Storage slot with the address of the current registry of the passport implementations.
     * This is the keccak-256 hash of "org.monetha.passport.proxy.registry", and is
     * validated in the constructor.
     */
    bytes32 private constant REGISTRY_SLOT = 0xa04bab69e45aeb4c94a78ba5bc1be67ef28977c4fdf815a30b829a794eb67a4a;

    /**
     * @dev Contract constructor.
     * @param _registry Address of the passport implementations registry.
     */
    constructor(IPassportImplRegistry _registry) public {
        assert(REGISTRY_SLOT == keccak256("org.monetha.passport.proxy.registry"));

        _setRegistry(_registry);
    }

    /**
     * @dev Changes the passport implementations registry.
     * @param _registry Address of the new passport implementations registry.
     */
    function changePassportImplRegistry(IPassportImplRegistry _registry) public onlyOwner {
        emit PassportImplRegistryChanged(address(_getRegistry()), address(_registry));
        _setRegistry(_registry);
    }

    /**
     * @return the address of passport implementations registry.
     */
    function getPassportImplRegistry() public view returns (address) {
        return _getRegistry();
    }

    /**
     * @dev Returns the current passport implementation (used in Proxy fallback function to delegate call to passport implementation).
     * @return Address of the current passport implementation
     */
    function _implementation() internal view returns (address) {
        return _getRegistry().getCurrentPassportImplementation();
    }

    /**
     * @dev Returns the current passport implementations registry.
     * @return Address of the current implementation
     */
    function _getRegistry() internal view returns (IPassportImplRegistry reg) {
        bytes32 slot = REGISTRY_SLOT;
        assembly {
            reg := sload(slot)
        }
    }

    function _setRegistry(IPassportImplRegistry _registry) internal {
        require(address(_registry) != 0x0, "Cannot set registry to a zero address");

        bytes32 slot = REGISTRY_SLOT;
        assembly {
            sstore(slot, _registry)
        }
    }
}