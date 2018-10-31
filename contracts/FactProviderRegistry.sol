pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoTokens.sol";

/**
 * @title FactProviderRegistry
 * @dev This contract works as a registry of fact providers.
 */
contract FactProviderRegistry is Ownable, HasNoEther, HasNoTokens {
    /**
     * @dev This event will be emitted every time a new fact provider is registered
     */
    event FactProviderAdded(address indexed factProvider);

    /**
     * @dev This event will be emitted every time the info of a fact provider is updated
     */
    event FactProviderUpdated(address indexed factProvider);

    /**
     * @dev This event will be emitted every time the fact provider is removed from the registry
     */
    event FactProviderDeleted(address indexed factProvider);

    struct FactProviderInfo {
        bool initialized;
        string name;
    }

    mapping(address => FactProviderInfo) public factProviders;

    /**
     * @dev Registers or updates a fact provider.
     * @param _factProvider representing the address of fact provider
     * @param _factProviderName representing the name of fact provider
     */
    function setFactProviderInfo(
        address _factProvider,
        string _factProviderName
    ) external onlyOwner {
        bool initializedFactProvider;
        initializedFactProvider = factProviders[_factProvider].initialized;

        factProviders[_factProvider] = FactProviderInfo({
            initialized : true,
            name : _factProviderName
            });

        if (initializedFactProvider) {
            emit FactProviderUpdated(_factProvider);
        } else {
            emit FactProviderAdded(_factProvider);
        }
    }

    /**
     * @dev Removes a fact provider from the registry.
     * @param _factProvider representing the address of fact provider
     */
    function deleteFactProviderInfo(address _factProvider) external onlyOwner {
        if (factProviders[_factProvider].initialized) {
            delete factProviders[_factProvider];

            emit FactProviderDeleted(_factProvider);
        }
    }
}