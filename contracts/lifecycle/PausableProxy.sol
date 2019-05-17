pragma solidity ^0.4.24;

import "../ownership/OwnableProxy.sol";

/**
 * @title PausableProxy
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
contract PausableProxy is OwnableProxy {
    /**
     * @dev Storage slot with the paused state of the contract.
     * This is the keccak-256 hash of "org.monetha.proxy.paused", and is
     * validated in the constructor.
     */
    bytes32 private constant PAUSED_OWNER_SLOT = 0x9e7945c55c116aa3404b99fe56db7af9613d3b899554a437c2616a4749a94d8a;

    /**
     * @dev The ClaimableProxy constructor validates PENDING_OWNER_SLOT constant.
     */
    constructor() public {
        assert(PAUSED_OWNER_SLOT == keccak256("org.monetha.proxy.paused"));
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!_getPaused(), "contract should not be paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_getPaused(), "contract should be paused");
        _;
    }

    /**
     * @return True when the contract is paused.
     */
    function _getPaused() internal view returns (bool paused) {
        bytes32 slot = PAUSED_OWNER_SLOT;
        assembly {
            paused := sload(slot)
        }
    }

    /**
     * @dev Sets the paused state.
     * @param _paused New paused state.
     */
    function _setPaused(bool _paused) internal {
        bytes32 slot = PAUSED_OWNER_SLOT;
        assembly {
            sstore(slot, _paused)
        }
    }
}