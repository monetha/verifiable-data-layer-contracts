pragma solidity ^0.4.24;

import "../ownership/OwnableProxy.sol";

contract OwnableProxyMock is OwnableProxy {
    function pause() public {
        _setPaused(true);
    }

    function unpause() public {
        _setPaused(false);
    }
}