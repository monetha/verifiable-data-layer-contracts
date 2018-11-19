pragma solidity ^0.4.24;

import "./ownership/ClaimableProxy.sol";
import "./IPassportLogic.sol";
import "./storage/AddressStorageLogic.sol";
import "./storage/UintStorageLogic.sol";
import "./storage/IntStorageLogic.sol";
import "./storage/BoolStorageLogic.sol";
import "./storage/StringStorageLogic.sol";
import "./storage/BytesStorageLogic.sol";
import "./storage/TxDataStorageLogic.sol";
import "./storage/IPFSStorageLogic.sol";

contract PassportLogic
is IPassportLogic
, ClaimableProxy
, AddressStorageLogic
, UintStorageLogic
, IntStorageLogic
, BoolStorageLogic
, StringStorageLogic
, BytesStorageLogic
, TxDataStorageLogic
, IPFSStorageLogic
{}