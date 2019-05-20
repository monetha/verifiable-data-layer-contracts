pragma solidity ^0.4.24;

import "../lifecycle/PausableProxy.sol";

contract PausableProxyMock is PausableProxy {
    int256 public count;

    function() payable public {}

    function pause() public {
        _setPaused(true);
    }

    function unpause() public {
        _setPaused(false);
    }

    function callableWhenNotPaused() public whenNotPaused {
        count++;
    }

    function callableWhenPaused() public whenPaused {
        count--;
    }
}