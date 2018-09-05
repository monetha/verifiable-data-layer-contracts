pragma solidity ^0.4.24;

/**
 * @title OwnableProxy
 */
contract OwnableProxy {
    event OwnershipRenounced(address indexed previousOwner);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @dev Storage slot with the owner of the contract.
     * This is the keccak-256 hash of "org.monetha.proxy.owner", and is
     * validated in the constructor.
     */
    bytes32 private constant OWNER_SLOT = 0x3ca57e4b51fc2e18497b219410298879868edada7e6fe5132c8feceb0a080d22;

    /**
     * @dev The OwnableProxy constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor() public {
        assert(OWNER_SLOT == keccak256("org.monetha.proxy.owner"));

        _setOwner(msg.sender);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == _getOwner());
        _;
    }

    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * @notice Renouncing to ownership will leave the contract without an owner.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipRenounced(_getOwner());
        _setOwner(address(0));
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param _newOwner The address to transfer ownership to.
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        _transferOwnership(_newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param _newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address _newOwner) internal {
        require(_newOwner != address(0));
        emit OwnershipTransferred(_getOwner(), _newOwner);
        _setOwner(_newOwner);
    }

    /**
     * @return The owner address.
     */
    function getOwner() public view returns (address) {
        return _getOwner();
    }

    /**
     * @return The owner address.
     */
    function _getOwner() internal view returns (address own) {
        bytes32 slot = OWNER_SLOT;
        assembly {
            own := sload(slot)
        }
    }

    /**
     * @dev Sets the address of the proxy owner.
     * @param _newOwner Address of the new proxy owner.
     */
    function _setOwner(address _newOwner) internal {
        bytes32 slot = OWNER_SLOT;

        assembly {
            sstore(slot, _newOwner)
        }
    }
}