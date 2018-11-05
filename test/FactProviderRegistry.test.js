const {expectThrow} = require('./helpers/expectThrow');
const {EVMRevert} = require('./helpers/EVMRevert');
const expectEvent = require('./helpers/expectEvent');

const FactProviderRegistry = artifacts.require('FactProviderRegistry');

contract('FactProviderRegistry', function (accounts) {
    let factProviderRegistryOwner;
    let factProviderRegistry;

    beforeEach(async function () {
        factProviderRegistryOwner = accounts[0];
        factProviderRegistry = await FactProviderRegistry.new({from: factProviderRegistryOwner});
    });

    it('should register fact provider info by owner', async function () {
        const factProvider = accounts[1];
        const factProviderName = "Fact provider name";
        const factProviderPassportAddress = "0x0000000000000000000000000000000000000000";
        const factProviderWebsite = "https://www.monetha.io"

        const {logs} = await factProviderRegistry.setFactProviderInfo(factProvider, factProviderName, factProviderPassportAddress, factProviderWebsite, {from: factProviderRegistryOwner});

        expectEvent.inLogs(logs, 'FactProviderAdded', {
            factProvider: factProvider,
        });

        const info = await factProviderRegistry.factProviders(factProvider);
        assert.isTrue(info[0]);
        assert.equal(factProviderName, info[1]);
    });

    it('should update fact provider info by owner', async function () {
        const factProvider = accounts[1];
        const factProviderName = "Fact provider name";
        const factProviderName2 = "Fact provider name 2";

        const factProviderPassportAddress = "0x0000000000000000000000000000000000000001";
        const factProviderWebsite = "https://www.monetha.io"

        await factProviderRegistry.setFactProviderInfo(factProvider, factProviderName, factProviderPassportAddress, factProviderWebsite, {from: factProviderRegistryOwner});

        const info = await factProviderRegistry.factProviders(factProvider);
        assert.isTrue(info[0]);
        assert.equal(factProviderName, info[1]);

        const {logs} = await factProviderRegistry.setFactProviderInfo(factProvider, factProviderName2, factProviderPassportAddress, factProviderWebsite, {from: factProviderRegistryOwner});

        expectEvent.inLogs(logs, 'FactProviderUpdated', {
            factProvider: factProvider,
        });

        const info2 = await factProviderRegistry.factProviders(factProvider);
        assert.isTrue(info2[0]);
        assert.equal(factProviderName2, info2[1]);
    });

    it('should delete fact provider info by owner', async function () {
        const factProvider = accounts[1];
        const factProviderName = "Fact provider name";

        await factProviderRegistry.setFactProviderInfo(factProvider, factProviderName, {from: factProviderRegistryOwner});

        const info = await factProviderRegistry.factProviders(factProvider);
        assert.isTrue(info[0]);
        assert.equal(factProviderName, info[1]);

        const {logs} = await factProviderRegistry.deleteFactProviderInfo(factProvider, {from: factProviderRegistryOwner});
        expectEvent.inLogs(logs, 'FactProviderDeleted', {
            factProvider: factProvider,
        });

        const info2 = await factProviderRegistry.factProviders(factProvider);
        assert.isFalse(info2[0]);
    });

    it('should not allow others to set fact provider info', async function () {
        const factProvider = accounts[1];
        const factProviderName = "Fact provider name";
        const randomGuy = accounts[2];

        await expectThrow(factProviderRegistry.setFactProviderInfo(factProvider, factProviderName, {from: randomGuy}), EVMRevert);
    });

    it('should not allow others to delete fact provider info', async function () {
        const factProvider = accounts[1];
        const factProviderName = "Fact provider name";
        const randomGuy = accounts[2];

        await factProviderRegistry.setFactProviderInfo(factProvider, factProviderName, {from: factProviderRegistryOwner});

        const info = await factProviderRegistry.factProviders(factProvider);
        assert.isTrue(info[0]);
        assert.equal(factProviderName, info[1]);

        await expectThrow(factProviderRegistry.deleteFactProviderInfo(factProvider, {from: randomGuy}), EVMRevert);
    });
});