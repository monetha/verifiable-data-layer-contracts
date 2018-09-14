pragma solidity ^0.4.24;

import "../lifecycle/DestructibleProxy.sol";

contract DestructibleProxyMock is DestructibleProxy {
    function() payable public {}
}