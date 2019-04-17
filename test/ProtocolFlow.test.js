const {expectThrow} = require('./helpers/expectThrow');
const {EVMRevert} = require('./helpers/EVMRevert');
const expectEvent = require('./helpers/expectEvent');
const {txTimestamp} = require('./helpers/txTimestamp');

const Passport = artifacts.require('Passport');
const PassportLogic = artifacts.require('PassportLogic');
const PassportLogicRegistry = artifacts.require('PassportLogicRegistry');
const PassportFactory = artifacts.require('PassportFactory');

contract('Passport', function (accounts) {
    let passportOwner;
    let passport;
    let passportAsLogic;

    let newOwner;
    let factProvider;
    let factProvider2;

    let dataRequester;

    const ExchangeField = {
        DataRequester: 0,
        DataRequesterValue: 1,
        PassportOwner: 2,
        PassportOwnerValue: 3,
        FactProvider: 4,
        Key: 5,
        DataIPFSHash: 6,
        DataKeyHash: 7,
        EncryptedExchangeKey: 8,
        ExchangeKeyHash: 9,
        EncryptedDataKey: 10,
        State: 11,
        StateExpired: 12
    };
    const ExchangeState = {Closed : 0, Proposed: 1, Accepted: 2};
    const oneDayInseconds = 24 * 60 * 60;

    beforeEach(async function () {
        const monethaOwner = accounts[0];
        passportOwner = accounts[1];
        newOwner = accounts[2];
        factProvider = accounts[3];
        factProvider2 = accounts[4];
        dataRequester = accounts[5];

        const passportLogic = await PassportLogic.new({from: monethaOwner});
        const passportLogicRegistry = await PassportLogicRegistry.new("0.1", passportLogic.address, {from: monethaOwner});
        const passportFactory = await PassportFactory.new(passportLogicRegistry.address, {from: monethaOwner});

        const createPassportTx = await passportFactory.createPassport({from: passportOwner});
        passport = Passport.at(createPassportTx.logs[0].args.passport);
        passportAsLogic = PassportLogic.at(passport.address);
        await passport.claimOwnership({from: passportOwner});
    });

    it('should have the correct owner', async function () {
        const owner = await passport.owner();
        assert.equal(owner, passportOwner);

        const ownerL = await passportAsLogic.owner();
        assert.equal(ownerL, passportOwner);
    });

    it('should have the new owner after transfer', async function () {
        await passport.transferOwnership(newOwner, {from: passportOwner});
        await passport.claimOwnership({from: newOwner});

        const owner = await passport.owner();
        assert.equal(owner, newOwner);

        const ownerL = await passportAsLogic.owner();
        assert.equal(ownerL, newOwner);
    });

    it('should store string of fact provider', async function () {
        const key = web3.toHex('test');
        const str = "this is tes only message";

        await passportAsLogic.setString(key, str, {from: factProvider});

        const getStringRes = await passportAsLogic.getString(factProvider, key);
        assert.isTrue(getStringRes[0]);
        assert.equal(getStringRes[1], str);
    });

    it('should not overlap strings from different fact providers', async function () {
        const key = web3.toHex('test');
        const str1 = "this is tes only message 1";
        const str2 = "this is tes only message 2";

        await passportAsLogic.setString(key, str1, {from: factProvider});
        await passportAsLogic.setString(key, str2, {from: factProvider2});

        const getStringRes = await passportAsLogic.getString(factProvider, key);
        assert.isTrue(getStringRes[0]);
        assert.equal(getStringRes[1], str1);

        const getStringRes2 = await passportAsLogic.getString(factProvider2, key);
        assert.isTrue(getStringRes2[0]);
        assert.equal(getStringRes2[1], str2);
    });

    it('should allow fact provider to delete string', async function () {
        const key = web3.toHex('test');
        const str = "this is tes only message";

        await passportAsLogic.setString(key, str, {from: factProvider});

        const getStringRes = await passportAsLogic.getString(factProvider, key);
        assert.isTrue(getStringRes[0]);
        assert.equal(getStringRes[1], str);

        await passportAsLogic.deleteString(key, {from: factProvider});

        const getStringRes2 = await passportAsLogic.getString(factProvider, key);
        assert.isTrue(!getStringRes2[0]);
    });

    it('should prevent to store string of fact provider when whitelist only permission is enabled', async function () {
        const key = web3.toHex('test');
        const str = "this is tes only message";

        await passportAsLogic.setWhitelistOnlyPermission(true, {from: passportOwner});

        await expectThrow(passportAsLogic.setString(key, str, {from: factProvider}), EVMRevert);
    });

    it('should prevent to delete string of fact provider when whitelist only permission is enabled', async function () {
        const key = web3.toHex('test');

        await passportAsLogic.setWhitelistOnlyPermission(true, {from: passportOwner});

        await expectThrow(passportAsLogic.deleteString(key, {from: factProvider}), EVMRevert);
    });

    it('should allow to store string of fact provider when whitelist only permission is disabled', async function () {
        const key = web3.toHex('test');
        const str = "this is tes only message";

        // enable whitelist only permission and the disable it
        await passportAsLogic.setWhitelistOnlyPermission(true, {from: passportOwner});
        await passportAsLogic.setWhitelistOnlyPermission(false, {from: passportOwner});

        await passportAsLogic.setString(key, str, {from: factProvider});

        const getStringRes = await passportAsLogic.getString(factProvider, key);
        assert.isTrue(getStringRes[0]);
        assert.equal(getStringRes[1], str);
    });

    it('should allow to delete string of fact provider when whitelist only permission is disabled', async function () {
        const key = web3.toHex('test');
        const str = "this is tes only message";

        await passportAsLogic.setString(key, str, {from: factProvider});

        const getStringRes = await passportAsLogic.getString(factProvider, key);
        assert.isTrue(getStringRes[0]);
        assert.equal(getStringRes[1], str);

        // enable whitelist only permission and the disable it
        await passportAsLogic.setWhitelistOnlyPermission(true, {from: passportOwner});
        await passportAsLogic.setWhitelistOnlyPermission(false, {from: passportOwner});

        await passportAsLogic.deleteString(key, {from: factProvider});

        const getStringRes2 = await passportAsLogic.getString(factProvider, key);
        assert.isTrue(!getStringRes2[0]);
    });

    it('should allow to store string of fact provider when whitelist only permission is enabled and the fact provider is in the whitelist', async function () {
        const key = web3.toHex('test');
        const str = "this is tes only message";

        // enable whitelist only permission and add fact provider to the whitelist
        await passportAsLogic.addFactProviderToWhitelist(factProvider, {from: passportOwner});
        await passportAsLogic.setWhitelistOnlyPermission(true, {from: passportOwner});

        await passportAsLogic.setString(key, str, {from: factProvider});

        const getStringRes = await passportAsLogic.getString(factProvider, key);
        assert.isTrue(getStringRes[0]);
        assert.equal(getStringRes[1], str);
    });

    it('should allow to delete string of fact provider when whitelist only permission is enabled and the fact provider is in the whitelist', async function () {
        const key = web3.toHex('test');
        const str = "this is tes only message";

        // enable whitelist only permission and add fact provider to the whitelist
        await passportAsLogic.addFactProviderToWhitelist(factProvider, {from: passportOwner});
        await passportAsLogic.setWhitelistOnlyPermission(true, {from: passportOwner});

        await passportAsLogic.setString(key, str, {from: factProvider});

        const getStringRes = await passportAsLogic.getString(factProvider, key);
        assert.isTrue(getStringRes[0]);
        assert.equal(getStringRes[1], str);

        await passportAsLogic.deleteString(key, {from: factProvider});

        const getStringRes2 = await passportAsLogic.getString(factProvider, key);
        assert.isTrue(!getStringRes2[0]);
    });

    it('should prevent to store string of fact provider when whitelist only permission is enabled and the fact provider is removed from the whitelist', async function () {
        const key = web3.toHex('test');
        const str = "this is tes only message";

        // enable whitelist only permission and add fact provider to the whitelist and then remove
        await passportAsLogic.addFactProviderToWhitelist(factProvider, {from: passportOwner});
        await passportAsLogic.setWhitelistOnlyPermission(true, {from: passportOwner});
        await passportAsLogic.removeFactProviderFromWhitelist(factProvider, {from: passportOwner});

        await expectThrow(passportAsLogic.setString(key, str, {from: factProvider}), EVMRevert);
    });

    it('should prevent to delete string of fact provider when whitelist only permission is enabled and the fact provider is removed from the whitelist', async function () {
        const key = web3.toHex('test');

        // enable whitelist only permission and add fact provider to the whitelist and then remove
        await passportAsLogic.addFactProviderToWhitelist(factProvider, {from: passportOwner});
        await passportAsLogic.setWhitelistOnlyPermission(true, {from: passportOwner});
        await passportAsLogic.removeFactProviderFromWhitelist(factProvider, {from: passportOwner});

        await expectThrow(passportAsLogic.deleteString(key, {from: factProvider}), EVMRevert);
    });

    it('should allow to store and read private data', async() => {
        const key = '0x1234567890123456789000000000000000000000000000000000000000000000';
        const dataIPFSHash = "Qmblahblahblah";
        const dataKeyHash = '0xbf65a1dee556a1db9c581a334f964d04b65a50a8dc881b93012a9cf53c2a6f3c';

        let tx = passportAsLogic.setPrivateData(key, dataIPFSHash, dataKeyHash, {from: factProvider});
        await expectEvent.inTransaction(tx,"PrivateDataUpdated", {factProvider: factProvider, key: key});

        const [success, getDataIPFSHash, getDataKeyHash] = await passportAsLogic.getPrivateData(factProvider, key);
        assert.isTrue(success);
        assert.equal(dataIPFSHash, getDataIPFSHash);
        assert.equal(dataKeyHash, getDataKeyHash);
    });

    it('should allow fact provider to delete private data', async() => {
        const key = '0x1234567890123456789000000000000000000000000000000000000000000000';
        const dataIPFSHash = "Qmblahblahblah";
        const dataKeyHash = '0xbf65a1dee556a1db9c581a334f964d04b65a50a8dc881b93012a9cf53c2a6f3c';

        let tx = passportAsLogic.setPrivateData(key, dataIPFSHash, dataKeyHash, {from: factProvider});
        await expectEvent.inTransaction(tx,"PrivateDataUpdated", {factProvider: factProvider, key: key});

        const [success, getDataIPFSHash, getDataKeyHash] = await passportAsLogic.getPrivateData(factProvider, key);
        assert.isTrue(success);
        assert.equal(dataIPFSHash, getDataIPFSHash);
        assert.equal(dataKeyHash, getDataKeyHash);

        let tx2 = passportAsLogic.deletePrivateData(key, {from: factProvider});
        await expectEvent.inTransaction(tx2,"PrivateDataDeleted", {factProvider: factProvider, key: key});

        const [success2] = await passportAsLogic.getPrivateData(factProvider, key);
        assert.isFalse(success2);
    });

    it('should allow to propose private data exchange', async () => {
        const key = '0x1234567890123456789000000000000000000000000000000000000000000000';
        const dataIPFSHash = "Qmblahblahblah";
        const dataKeyHash = '0xbf65a1dee556a1db9c581a334f964d04b65a50a8dc881b93012a9cf53c2a6f3c';

        // exchange key:      0x5c221e572354457236e2ae6fc1b3f0e868fd0456c7d5f5e1799c22a0e8548826
        // exchange key hash: 0xa9528b0b967627d1c5c092548d9697988b161bbb868f58671d7cfbe98f708745
        //
        // data key:      0x85e2cd9bf60f3b2e5d81608c47283d2d8527e9a4b4753f0e6f5e308510b2a6d8
        // data key hash: 0xbf65a1dee556a1db9c581a334f964d04b65a50a8dc881b93012a9cf53c2a6f3c
        //
        // exchange key XOR data key: 0xd9c0d3ccd55b7e5c6b63cee3869bcdc5eddaedf273a0caef16c21225f8e62efe (encrypted data key)
        const encryptedExchangeKey = web3.toHex('it is encrypted exchange key');
        const exchangeKeyHash = '0xa9528b0b967627d1c5c092548d9697988b161bbb868f58671d7cfbe98f708745';
        const exchangeStake = 10000000;

        let tx = passportAsLogic.setPrivateData(key, dataIPFSHash, dataKeyHash, {from: factProvider});
        await expectEvent.inTransaction(tx, "PrivateDataUpdated", {factProvider: factProvider, key: key});

        const exchangesCount = await passportAsLogic.getPrivateDataExchangesCount();
        let passportBalance = await web3.eth.getBalance(passportAsLogic.address);

        let proposeTx = await passportAsLogic.proposePrivateDataExchange(factProvider, key, encryptedExchangeKey, exchangeKeyHash, {
            from: dataRequester,
            value: exchangeStake
        });
        await expectEvent.inTransaction(proposeTx, "PrivateDataExchangeProposed", {
            exchangeIdx: exchangesCount,
            dataRequester: dataRequester,
            passportOwner: passportOwner
        });
        const proposeTxTimestamp = txTimestamp(proposeTx);

        const exchangesCount2 = await passportAsLogic.getPrivateDataExchangesCount();
        exchangesCount2.should.be.bignumber.equal(exchangesCount.add(1));

        let passportBalance2 = await web3.eth.getBalance(passportAsLogic.address);
        passportBalance2.should.be.bignumber.equal(passportBalance.add(exchangeStake));

        const exchange = await passportAsLogic.privateDataExchanges(exchangesCount);
        assert.equal(exchange[ExchangeField.DataRequester], dataRequester);
        exchange[ExchangeField.DataRequesterValue].should.be.bignumber.equal(exchangeStake);
        assert.equal(exchange[ExchangeField.PassportOwner], passportOwner);
        exchange[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(0);
        assert.equal(exchange[ExchangeField.FactProvider], factProvider);
        assert.equal(exchange[ExchangeField.Key], key);
        assert.equal(exchange[ExchangeField.DataIPFSHash], dataIPFSHash);
        assert.equal(exchange[ExchangeField.DataKeyHash], dataKeyHash);
        assert.equal(exchange[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
        assert.equal(exchange[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
        assert.equal(exchange[ExchangeField.EncryptedDataKey], '0x0000000000000000000000000000000000000000000000000000000000000000');
        assert.equal(exchange[ExchangeField.State], ExchangeState.Proposed);
        exchange[ExchangeField.StateExpired].should.be.bignumber.equal(proposeTxTimestamp + oneDayInseconds);
    });
});