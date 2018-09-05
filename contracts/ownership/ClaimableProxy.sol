pragma solidity ^0.4.24;

import "./OwnableProxy.sol";

/**
 * @title ClaimableProxy
 * @dev Extension for the OwnableProxy contract, where the ownership needs to be claimed.
 * This allows the new owner to accept the transfer.
 */
contract ClaimableProxy is OwnableProxy {
    /**
     * @dev Storage slot with the pending owner of the contract.
     * This is the keccak-256 hash of "org.monetha.proxy.pendingOwner", and is
     * validated in the constructor.
     */
    bytes32 private constant PENDING_OWNER_SLOT = 0xcfd0c6ea5352192d7d4c5d4e7a73c5da12c871730cb60ff57879cbe7b403bb52;

    /**
     * @dev The ClaimableProxy constructor validates PENDING_OWNER_SLOT constant.
     */
    constructor() public {
        assert(PENDING_OWNER_SLOT == keccak256("org.monetha.proxy.pendingOwner"));
    }

    /**
     * @dev Modifier throws if called by any account other than the pendingOwner.
     */
    modifier onlyPendingOwner() {
        require(msg.sender == _getPendingOwner());
        _;
    }

    /**
     * @dev Allows the current owner to set the pendingOwner address.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _setPendingOwner(newOwner);
    }

    /**
     * @dev Allows the pendingOwner address to finalize the transfer.
     */
    function claimOwnership() public onlyPendingOwner {
        emit OwnershipTransferred(_getOwner(), _getPendingOwner());
        _setOwner(_getPendingOwner());
        _setPendingOwner(address(0));
    }

    /**
     * @return The pending owner address.
     */
    function _getPendingOwner() internal view returns (address penOwn) {
        bytes32 slot = PENDING_OWNER_SLOT;
        assembly {
            penOwn := sload(slot)
        }
    }

    /**
     * @dev Sets the address of the pending owner.
     * @param _newPendingOwner Address of the new pending owner.
     */
    function _setPendingOwner(address _newPendingOwner) internal {
        bytes32 slot = PENDING_OWNER_SLOT;

        assembly {
            sstore(slot, _newPendingOwner)
        }
    }
}