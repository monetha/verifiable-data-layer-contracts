pragma solidity ^0.4.24;

import "./storage/PassportStorage.sol";
import "./ownership/ClaimableProxy.sol";
import "./IPassportLogic.sol";

contract PassportLogic
is IPassportLogic
, ClaimableProxy
, PassportStorage
{}