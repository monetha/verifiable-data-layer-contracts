pragma solidity ^0.4.24;

import "../ownership/ClaimableProxy.sol";

contract ClaimableProxyMock is ClaimableProxy {
    function pause() public {
        _setPaused(true);
    }

    function unpause() public {
        _setPaused(false);
    }
}