pragma solidity ^0.4.24;

import "./storage/PassportStorage.sol";
import "./ownership/ClaimableProxy.sol";
import "./IPassport.sol";

contract Passport
is IPassport
, ClaimableProxy
, PassportStorage
{}