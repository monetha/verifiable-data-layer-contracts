pragma solidity ^0.4.24;

import "../ownership/OwnableProxy.sol";

/**
 * @title Destructible
 * @dev Base contract that can be destroyed by owner. All funds in contract will be sent to the owner.
 */
contract DestructibleProxy is OwnableProxy {
    /**
     * @dev Transfers the current balance to the owner and terminates the contract.
     */
    function destroy() public onlyOwner {
        selfdestruct(_getOwner());
    }

    function destroyAndSend(address _recipient) public onlyOwner {
        selfdestruct(_recipient);
    }
}
