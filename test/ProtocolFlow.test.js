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

    beforeEach(async function () {
        const monethaOwner = accounts[0];
        passportOwner = accounts[1];
        newOwner = accounts[2];
        factProvider = accounts[3];

        const passportLogic = await PassportLogic.new({ from: monethaOwner });
        const passportLogicRegistry = await PassportLogicRegistry.new("0.1", passportLogic.address, { from: monethaOwner });
        const passportFactory = await PassportFactory.new(passportLogicRegistry.address, { from: monethaOwner });

        const createPassportTx = await passportFactory.createPassport({ from: passportOwner });
        passport = Passport.at(createPassportTx.logs[0].args.passport);
        passportAsLogic = PassportLogic.at(passport.address);
        await passport.claimOwnership({ from: passportOwner });
    });

    it('should have the correct owner', async function () {
        const owner = await passport.owner();
        assert.equal(owner, passportOwner);

        const ownerL = await passportAsLogic.owner();
        assert.equal(ownerL, passportOwner);
    });

    it('should have the new owner after transfer', async function () {
        await passport.transferOwnership(newOwner, { from: passportOwner });
        await passport.claimOwnership({ from: newOwner });

        const owner = await passport.owner();
        assert.equal(owner, newOwner);

        const ownerL = await passportAsLogic.owner();
        assert.equal(ownerL, newOwner);
    });

    it('should correctly store string of fact provider', async function () {
        const key = "0x1234";
        const str = "this is tes only message";

        await passportAsLogic.setString(key, str, { from: factProvider });

        const getStringRes = await passportAsLogic.getString(factProvider, key);
        assert.isTrue(getStringRes[0]);
        assert.equal(getStringRes[1], str);
    });
});