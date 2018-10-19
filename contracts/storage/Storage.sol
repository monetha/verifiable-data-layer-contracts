pragma solidity ^0.4.24;

import "../ownership/ClaimableProxy.sol";

// Storage contracts holds all state.
// Do not change the order of the fields, аdd new fields to the end of the contract!
contract Storage is ClaimableProxy
{
    struct AddressValue {
        bool initialized;
        address value;
    }

    mapping(address => mapping(bytes32 => AddressValue)) internal addressStorage;

    struct UintValue {
        bool initialized;
        uint value;
    }

    mapping(address => mapping(bytes32 => UintValue)) internal uintStorage;

    struct IntValue {
        bool initialized;
        int value;
    }

    mapping(address => mapping(bytes32 => IntValue)) internal intStorage;

    struct BoolValue {
        bool initialized;
        bool value;
    }

    mapping(address => mapping(bytes32 => BoolValue)) internal boolStorage;

    struct StringValue {
        bool initialized;
        string value;
    }

    mapping(address => mapping(bytes32 => StringValue)) internal stringStorage;

    struct BytesValue {
        bool initialized;
        bytes value;
    }

    mapping(address => mapping(bytes32 => BytesValue)) internal bytesStorage;

    struct BlockNumberValue {
        bool initialized;
        uint blockNumber;
    }

    mapping(address => mapping(bytes32 => BlockNumberValue)) internal txBytesStorage;

    bool private onlyFactProviderFromWhitelistAllowed;
    mapping(address => bool) private factProviderWhitelist;

    event WhitelistOnlyPermissionSet(bool indexed onlyWhitelist);
    event WhitelistFactProviderAdded(address indexed factProvider);
    event WhitelistFactProviderRemoved(address indexed factProvider);

    /**
     *  Restrict methods in such way, that they can be invoked only by allowed fact provider.
     */
    modifier allowedFactProvider() {
        require(!onlyFactProviderFromWhitelistAllowed || factProviderWhitelist[msg.sender] || msg.sender == _getOwner());
        _;
    }

    /**
     *  Returns true when a whitelist of fact providers is enabled.
     */
    function isWhitelistOnlyPermissionSet() external view returns (bool) {
        return onlyFactProviderFromWhitelistAllowed;
    }

    /**
     *  Enables or disables the use of a whitelist of fact providers.
     */
    function setWhitelistOnlyPermission(bool _onlyWhitelist) onlyOwner external {
        onlyFactProviderFromWhitelistAllowed = _onlyWhitelist;
        emit WhitelistOnlyPermissionSet(_onlyWhitelist);
    }

    /**
     *  Returns true if fact provider is added to the whitelist.
     */
    function isFactProviderInWhitelist(address _address) external view returns (bool) {
        return factProviderWhitelist[_address];
    }

    /**
     *  Allows owner to add fact provider to whitelist.
     */
    function addFactProviderToWhitelist(address _address) onlyOwner external {
        factProviderWhitelist[_address] = true;
        emit WhitelistFactProviderAdded(_address);
    }

    /**
     *  Allows owner to remove fact provider from whitelist.
     */
    function removeFactProviderFromWhitelist(address _address) onlyOwner external {
        delete factProviderWhitelist[_address];
        emit WhitelistFactProviderRemoved(_address);
    }
}