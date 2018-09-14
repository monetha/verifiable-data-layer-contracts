pragma solidity ^0.4.24;

import "./AddressStorage.sol";
import "./UintStorage.sol";
import "./IntStorage.sol";
import "./BoolStorage.sol";
import "./StringStorage.sol";
import "./BytesStorage.sol";
import "./TxDataStorage.sol";

contract PassportStorage
is AddressStorage
, UintStorage
, IntStorage
, BoolStorage
, StringStorage
, BytesStorage
, TxDataStorage
{}