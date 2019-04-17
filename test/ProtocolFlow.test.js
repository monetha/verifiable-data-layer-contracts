const {expectThrow} = require('./helpers/expectThrow');
const {EVMRevert} = require('./helpers/EVMRevert');
const expectEvent = require('./helpers/expectEvent');

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

    beforeEach(async function () {
        const monethaOwner = accounts[0];
        passportOwner = accounts[1];
        newOwner = accounts[2];
        factProvider = accounts[3];
        factProvider2 = accounts[4];

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
        const keyHash = '0x736f6d6520686173680000000000000000000000000000000000000000000000';

        let tx = passportAsLogic.setPrivateData(key, dataIPFSHash, keyHash, {from: factProvider});
        await expectEvent.inTransaction(tx,"PrivateDataUpdated", {factProvider: factProvider, key: key});

        const [success, getDataIPFSHash, getDataKeyHash] = await passportAsLogic.getPrivateData(factProvider, key);
        assert.isTrue(success);
        assert.equal(dataIPFSHash, getDataIPFSHash);
        assert.equal(keyHash, getDataKeyHash);
    });

    it('should allow fact provider to delete private data', async function () {
        const key = '0x1234567890123456789000000000000000000000000000000000000000000000';
        const dataIPFSHash = "Qmblahblahblah";
        const keyHash = '0x736f6d6520686173680000000000000000000000000000000000000000000000';

        let tx = passportAsLogic.setPrivateData(key, dataIPFSHash, keyHash, {from: factProvider});
        await expectEvent.inTransaction(tx,"PrivateDataUpdated", {factProvider: factProvider, key: key});

        const [success, getDataIPFSHash, getDataKeyHash] = await passportAsLogic.getPrivateData(factProvider, key);
        assert.isTrue(success);
        assert.equal(dataIPFSHash, getDataIPFSHash);
        assert.equal(keyHash, getDataKeyHash);

        let tx2 = passportAsLogic.deletePrivateData(key, {from: factProvider});
        await expectEvent.inTransaction(tx2,"PrivateDataDeleted", {factProvider: factProvider, key: key});

        const [success2] = await passportAsLogic.getPrivateData(factProvider, key);
        assert.isFalse(success2);
    });
});