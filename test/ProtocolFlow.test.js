const {expectThrow} = require('./helpers/expectThrow');
const {EVMRevert} = require('./helpers/EVMRevert');
const expectEvent = require('./helpers/expectEvent');
const {txTimestamp} = require('./helpers/txTimestamp');
const {increaseTime, duration} = require("./helpers/increaseTime");
const {assertRevert} = require('./helpers/assertRevert');
const BigNumber = web3.BigNumber;

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
    let proposeTimeout;
    let acceptTimeout;

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
    const ExchangeState = {Closed: 0, Proposed: 1, Accepted: 2};

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

        proposeTimeout = await passportAsLogic.privateDataExchangeProposeTimeout();
        acceptTimeout = await passportAsLogic.privateDataExchangeAcceptTimeout();
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

    it('should allow to destroy passport', async function () {
        await passport.destroy({from: passportOwner});
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

    describe('private data', () => {

        describe('when fact provider provided private data', () => {
            const key = '0x1234567890123456789000000000000000000000000000000000000000000000';
            const dataIPFSHash = "Qmblahblahblah";
            // data key:      0x85e2cd9bf60f3b2e5d81608c47283d2d8527e9a4b4753f0e6f5e308510b2a6d8
            // data key hash: 0xbf65a1dee556a1db9c581a334f964d04b65a50a8dc881b93012a9cf53c2a6f3c
            const dataKeyHash = '0xbf65a1dee556a1db9c581a334f964d04b65a50a8dc881b93012a9cf53c2a6f3c';

            let setPrivateDataTx;

            beforeEach(async () => {
                setPrivateDataTx = await passportAsLogic.setPrivateDataHashes(key, dataIPFSHash, dataKeyHash, {from: factProvider});
            });


            describe('then', () => {
                it('should emit PrivateDataUpdated event', async () => {
                    await expectEvent.inTransaction(setPrivateDataTx, "PrivateDataHashesUpdated", {
                        factProvider: factProvider,
                        key: key
                    });
                });

                it('should allow to get private data', async () => {
                    const [success, getDataIPFSHash, getDataKeyHash] = await passportAsLogic.getPrivateDataHashes(factProvider, key);
                    assert.isTrue(success);
                    assert.equal(dataIPFSHash, getDataIPFSHash);
                    assert.equal(dataKeyHash, getDataKeyHash);
                });

                it('should allow fact provider to delete private data', async () => {
                    const tx = passportAsLogic.deletePrivateDataHashes(key, {from: factProvider});
                    await expectEvent.inTransaction(tx, "PrivateDataHashesDeleted", {factProvider: factProvider, key: key});

                    const [success] = await passportAsLogic.getPrivateDataHashes(factProvider, key);
                    assert.isFalse(success);
                });
            });

            describe('when data requester proposed private data exchange', () => {
                const encryptedExchangeKey = web3.toHex('it is encrypted proposedExchange key');
                const exchangeKey = '0x5c221e572354457236e2ae6fc1b3f0e868fd0456c7d5f5e1799c22a0e8548826'; // data requester keeps it in secret (uses only in dispute)
                const exchangeKeyHash = '0xa9528b0b967627d1c5c092548d9697988b161bbb868f58671d7cfbe98f708745';
                const dataRequesterStake = 10000000;

                let exchangeIdx;
                let passportBalanceBeforePropose;
                let proposePrivateDataExchangeTx;

                beforeEach(async () => {
                    exchangeIdx = await passportAsLogic.getPrivateDataExchangesCount();
                    passportBalanceBeforePropose = await web3.eth.getBalance(passportAsLogic.address);

                    proposePrivateDataExchangeTx = await passportAsLogic.proposePrivateDataExchange(factProvider, key, encryptedExchangeKey, exchangeKeyHash, {
                        from: dataRequester,
                        value: dataRequesterStake
                    });
                });

                describe('then', () => {
                    it('should not allow to destroy passport', async () => {
                        await assertRevert(passport.destroy({from: passportOwner}));
                    });

                    it('should emit PrivateDataExchangeProposed event', async () => {
                        await expectEvent.inTransaction(proposePrivateDataExchangeTx, "PrivateDataExchangeProposed", {
                            exchangeIdx: exchangeIdx,
                            dataRequester: dataRequester,
                            passportOwner: passportOwner
                        });
                    });

                    it('should increment total count of private data exchanges', async () => {
                        const exchangesCount = await passportAsLogic.getPrivateDataExchangesCount();
                        exchangesCount.should.be.bignumber.equal(exchangeIdx.add(1));
                    });

                    it('should increment passport contract balance', async () => {
                        const passportBalance = await web3.eth.getBalance(passportAsLogic.address);
                        passportBalance.should.be.bignumber.equal(passportBalanceBeforePropose.add(dataRequesterStake));
                    });

                    it('should correctly set exchange fields', async () => {
                        const proposeTxTimestamp = txTimestamp(proposePrivateDataExchangeTx);

                        const exch = await passportAsLogic.privateDataExchanges(exchangeIdx);
                        assert.equal(exch[ExchangeField.DataRequester], dataRequester);
                        exch[ExchangeField.DataRequesterValue].should.be.bignumber.equal(dataRequesterStake);
                        assert.equal(exch[ExchangeField.PassportOwner], passportOwner);
                        exch[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(0);
                        assert.equal(exch[ExchangeField.FactProvider], factProvider);
                        assert.equal(exch[ExchangeField.Key], key);
                        assert.equal(exch[ExchangeField.DataIPFSHash], dataIPFSHash);
                        assert.equal(exch[ExchangeField.DataKeyHash], dataKeyHash);
                        assert.equal(exch[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
                        assert.equal(exch[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
                        assert.equal(exch[ExchangeField.EncryptedDataKey], '0x0000000000000000000000000000000000000000000000000000000000000000');
                        assert.equal(exch[ExchangeField.State], ExchangeState.Proposed);
                        exch[ExchangeField.StateExpired].should.be.bignumber.equal(proposeTimeout.add(proposeTxTimestamp));
                    });
                });

                describe('when passport owner fairly accepted private data exchange', () => {
                    // encrypted data key = proposedExchange key XOR data key: 0xd9c0d3ccd55b7e5c6b63cee3869bcdc5eddaedf273a0caef16c21225f8e62efe
                    const encryptedDataKey = '0xd9c0d3ccd55b7e5c6b63cee3869bcdc5eddaedf273a0caef16c21225f8e62efe';
                    const passportOwnerStake = 20000000;

                    let passportBalanceBeforeAccept;
                    let acceptPrivateDataExchangeTx;

                    beforeEach(async () => {
                        passportBalanceBeforeAccept = await web3.eth.getBalance(passportAsLogic.address);
                        acceptPrivateDataExchangeTx = await passportAsLogic.acceptPrivateDataExchange(exchangeIdx, encryptedDataKey, {
                            from: passportOwner,
                            value: passportOwnerStake
                        });
                    });

                    describe('then', () => {
                        it('should emit PrivateDataExchangeAccepted event', async () => {
                            await expectEvent.inTransaction(acceptPrivateDataExchangeTx, "PrivateDataExchangeAccepted", {
                                exchangeIdx: exchangeIdx,
                                dataRequester: dataRequester,
                                passportOwner: passportOwner
                            });
                        });

                        it('should increment passport contract balance', async () => {
                            const passportBalance = await web3.eth.getBalance(passportAsLogic.address);
                            passportBalance.should.be.bignumber.equal(passportBalanceBeforeAccept.add(passportOwnerStake));
                        });

                        it('should correctly set exchange fields', async () => {
                            const acceptTxTimestamp = txTimestamp(acceptPrivateDataExchangeTx);

                            const exch = await passportAsLogic.privateDataExchanges(exchangeIdx);
                            assert.equal(exch[ExchangeField.DataRequester], dataRequester);
                            exch[ExchangeField.DataRequesterValue].should.be.bignumber.equal(dataRequesterStake);
                            assert.equal(exch[ExchangeField.PassportOwner], passportOwner);
                            exch[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(passportOwnerStake);
                            assert.equal(exch[ExchangeField.FactProvider], factProvider);
                            assert.equal(exch[ExchangeField.Key], key);
                            assert.equal(exch[ExchangeField.DataIPFSHash], dataIPFSHash);
                            assert.equal(exch[ExchangeField.DataKeyHash], dataKeyHash);
                            assert.equal(exch[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
                            assert.equal(exch[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
                            assert.equal(exch[ExchangeField.EncryptedDataKey], encryptedDataKey);
                            assert.equal(exch[ExchangeField.State], ExchangeState.Accepted);
                            exch[ExchangeField.StateExpired].should.be.bignumber.equal(acceptTimeout.add(acceptTxTimestamp));
                        });
                    });

                    describe('when data requester finished private data exchange', () => {

                        let passportBalanceBeforeFinish;
                        let passportOwnerBalanceBeforeFinish;
                        let finishPrivateDataExchangeTx;

                        beforeEach(async () => {
                            passportBalanceBeforeFinish = await web3.eth.getBalance(passportAsLogic.address);
                            passportOwnerBalanceBeforeFinish = await web3.eth.getBalance(passportOwner);
                            finishPrivateDataExchangeTx = await passportAsLogic.finishPrivateDataExchange(exchangeIdx, {from: dataRequester});
                        });

                        describe('then', () => {
                            it('should allow to destroy passport', async function () {
                                passport.destroy({from: passportOwner});
                            });

                            it('should emit PrivateDataExchangeClosed event', async () => {
                                await expectEvent.inTransaction(finishPrivateDataExchangeTx, "PrivateDataExchangeClosed", {
                                    exchangeIdx: exchangeIdx
                                });
                            });

                            it('should decrement passport contract balance', async () => {
                                const passportBalance = await web3.eth.getBalance(passportAsLogic.address);
                                passportBalance.should.be.bignumber.equal(passportBalanceBeforeFinish.sub(passportOwnerStake).sub(dataRequesterStake));
                            });

                            it('should transfer all staked amount to passport owner', async () => {
                                const passportOwnerBalance = await web3.eth.getBalance(passportOwner);
                                passportOwnerBalance.should.be.bignumber.equal(passportOwnerBalanceBeforeFinish.add(passportOwnerStake).add(dataRequesterStake))
                            });

                            it('should correctly set exchange fields', async () => {
                                const acceptTxTimestamp = txTimestamp(acceptPrivateDataExchangeTx);

                                const exch = await passportAsLogic.privateDataExchanges(exchangeIdx);
                                assert.equal(exch[ExchangeField.DataRequester], dataRequester);
                                exch[ExchangeField.DataRequesterValue].should.be.bignumber.equal(dataRequesterStake);
                                assert.equal(exch[ExchangeField.PassportOwner], passportOwner);
                                exch[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(passportOwnerStake);
                                assert.equal(exch[ExchangeField.FactProvider], factProvider);
                                assert.equal(exch[ExchangeField.Key], key);
                                assert.equal(exch[ExchangeField.DataIPFSHash], dataIPFSHash);
                                assert.equal(exch[ExchangeField.DataKeyHash], dataKeyHash);
                                assert.equal(exch[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
                                assert.equal(exch[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
                                assert.equal(exch[ExchangeField.EncryptedDataKey], encryptedDataKey);
                                assert.equal(exch[ExchangeField.State], ExchangeState.Closed);
                                exch[ExchangeField.StateExpired].should.be.bignumber.equal(acceptTimeout.add(acceptTxTimestamp));
                            });
                        });
                    });

                    describe('when data requester opens fraudulent dispute (tries to cheat)', () => {

                        let passportBalanceBeforeDispute;
                        let passportOwnerBalanceBeforeDispute;
                        let disputePrivateDataExchangeTx;

                        beforeEach(async () => {
                            passportBalanceBeforeDispute = await web3.eth.getBalance(passportAsLogic.address);
                            passportOwnerBalanceBeforeDispute = await web3.eth.getBalance(passportOwner);
                            disputePrivateDataExchangeTx = await passportAsLogic.disputePrivateDataExchange(exchangeIdx, exchangeKey, {from: dataRequester});
                        });

                        describe('then', () => {
                            it('should emit PrivateDataExchangeClosed event', async () => {
                                await expectEvent.inTransaction(disputePrivateDataExchangeTx, "PrivateDataExchangeClosed", {
                                    exchangeIdx: exchangeIdx
                                });
                            });

                            it('should emit PrivateDataExchangeDisputed event', async () => {
                                await expectEvent.inTransaction(disputePrivateDataExchangeTx, "PrivateDataExchangeDisputed", {
                                    exchangeIdx: exchangeIdx,
                                    successful: false,
                                    cheater: dataRequester
                                });
                            });

                            it('should decrement passport contract balance', async () => {
                                const passportBalance = await web3.eth.getBalance(passportAsLogic.address);
                                passportBalance.should.be.bignumber.equal(passportBalanceBeforeDispute.sub(passportOwnerStake).sub(dataRequesterStake));
                            });

                            it('should transfer all staked amount to passport owner', async () => {
                                const passportOwnerBalance = await web3.eth.getBalance(passportOwner);
                                passportOwnerBalance.should.be.bignumber.equal(passportOwnerBalanceBeforeDispute.add(passportOwnerStake).add(dataRequesterStake))
                            });

                            it('should correctly set exchange fields', async () => {
                                const acceptTxTimestamp = txTimestamp(acceptPrivateDataExchangeTx);

                                const exch = await passportAsLogic.privateDataExchanges(exchangeIdx);
                                assert.equal(exch[ExchangeField.DataRequester], dataRequester);
                                exch[ExchangeField.DataRequesterValue].should.be.bignumber.equal(dataRequesterStake);
                                assert.equal(exch[ExchangeField.PassportOwner], passportOwner);
                                exch[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(passportOwnerStake);
                                assert.equal(exch[ExchangeField.FactProvider], factProvider);
                                assert.equal(exch[ExchangeField.Key], key);
                                assert.equal(exch[ExchangeField.DataIPFSHash], dataIPFSHash);
                                assert.equal(exch[ExchangeField.DataKeyHash], dataKeyHash);
                                assert.equal(exch[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
                                assert.equal(exch[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
                                assert.equal(exch[ExchangeField.EncryptedDataKey], encryptedDataKey);
                                assert.equal(exch[ExchangeField.State], ExchangeState.Closed);
                                exch[ExchangeField.StateExpired].should.be.bignumber.equal(acceptTimeout.add(acceptTxTimestamp));
                            });
                        });
                    });

                    describe('when exchange acceptance/dispute timed out', () => {

                        beforeEach(async () => {
                            await increaseTime(acceptTimeout.add(1).toNumber());
                        });

                        describe('then', () => {
                            it('should not allow data requester to open dispute', async () => {
                                await expectThrow(passportAsLogic.disputePrivateDataExchange(exchangeIdx, exchangeKey, {
                                    from: dataRequester,
                                    gasPrice: 1
                                }), EVMRevert);
                            });
                        });

                        describe('when passport owner finished private data exchange', () => {

                            let passportBalanceBeforeFinish;
                            let passportOwnerBalanceBeforeFinish;
                            let finishPrivateDataExchangeTx;
                            let finishPrivateDataExchangeTxCost;

                            beforeEach(async () => {
                                passportBalanceBeforeFinish = await web3.eth.getBalance(passportAsLogic.address);
                                passportOwnerBalanceBeforeFinish = await web3.eth.getBalance(passportOwner);
                                finishPrivateDataExchangeTx = await passportAsLogic.finishPrivateDataExchange(exchangeIdx, {
                                    from: passportOwner,
                                    gasPrice: 1
                                });
                                finishPrivateDataExchangeTxCost = finishPrivateDataExchangeTx.receipt.gasUsed;
                            });

                            describe('then', () => {
                                it('should emit PrivateDataExchangeClosed event', async () => {
                                    await expectEvent.inTransaction(finishPrivateDataExchangeTx, "PrivateDataExchangeClosed", {
                                        exchangeIdx: exchangeIdx
                                    });
                                });

                                it('should decrement passport contract balance', async () => {
                                    const passportBalance = await web3.eth.getBalance(passportAsLogic.address);
                                    passportBalance.should.be.bignumber.equal(passportBalanceBeforeFinish.sub(passportOwnerStake).sub(dataRequesterStake));
                                });

                                it('should transfer all staked amount to passport owner', async () => {
                                    const passportOwnerBalance = await web3.eth.getBalance(passportOwner);
                                    passportOwnerBalance.should.be.bignumber.equal(
                                        passportOwnerBalanceBeforeFinish.add(passportOwnerStake).add(dataRequesterStake).sub(finishPrivateDataExchangeTxCost))
                                });

                                it('should correctly set exchange fields', async () => {
                                    const acceptTxTimestamp = txTimestamp(acceptPrivateDataExchangeTx);

                                    const exch = await passportAsLogic.privateDataExchanges(exchangeIdx);
                                    assert.equal(exch[ExchangeField.DataRequester], dataRequester);
                                    exch[ExchangeField.DataRequesterValue].should.be.bignumber.equal(dataRequesterStake);
                                    assert.equal(exch[ExchangeField.PassportOwner], passportOwner);
                                    exch[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(passportOwnerStake);
                                    assert.equal(exch[ExchangeField.FactProvider], factProvider);
                                    assert.equal(exch[ExchangeField.Key], key);
                                    assert.equal(exch[ExchangeField.DataIPFSHash], dataIPFSHash);
                                    assert.equal(exch[ExchangeField.DataKeyHash], dataKeyHash);
                                    assert.equal(exch[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
                                    assert.equal(exch[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
                                    assert.equal(exch[ExchangeField.EncryptedDataKey], encryptedDataKey);
                                    assert.equal(exch[ExchangeField.State], ExchangeState.Closed);
                                    exch[ExchangeField.StateExpired].should.be.bignumber.equal(acceptTimeout.add(acceptTxTimestamp));
                                });
                            });
                        });

                        describe('when data requester finished private data exchange', () => {

                            let passportBalanceBeforeFinish;
                            let passportOwnerBalanceBeforeFinish;
                            let finishPrivateDataExchangeTx;

                            beforeEach(async () => {
                                passportBalanceBeforeFinish = await web3.eth.getBalance(passportAsLogic.address);
                                passportOwnerBalanceBeforeFinish = await web3.eth.getBalance(passportOwner);
                                finishPrivateDataExchangeTx = await passportAsLogic.finishPrivateDataExchange(exchangeIdx, {from: dataRequester});
                            });

                            describe('then', () => {
                                it('should emit PrivateDataExchangeClosed event', async () => {
                                    await expectEvent.inTransaction(finishPrivateDataExchangeTx, "PrivateDataExchangeClosed", {
                                        exchangeIdx: exchangeIdx
                                    });
                                });

                                it('should decrement passport contract balance', async () => {
                                    const passportBalance = await web3.eth.getBalance(passportAsLogic.address);
                                    passportBalance.should.be.bignumber.equal(passportBalanceBeforeFinish.sub(passportOwnerStake).sub(dataRequesterStake));
                                });

                                it('should transfer all staked amount to passport owner', async () => {
                                    const passportOwnerBalance = await web3.eth.getBalance(passportOwner);
                                    passportOwnerBalance.should.be.bignumber.equal(passportOwnerBalanceBeforeFinish.add(passportOwnerStake).add(dataRequesterStake))
                                });

                                it('should correctly set exchange fields', async () => {
                                    const acceptTxTimestamp = txTimestamp(acceptPrivateDataExchangeTx);

                                    const exch = await passportAsLogic.privateDataExchanges(exchangeIdx);
                                    assert.equal(exch[ExchangeField.DataRequester], dataRequester);
                                    exch[ExchangeField.DataRequesterValue].should.be.bignumber.equal(dataRequesterStake);
                                    assert.equal(exch[ExchangeField.PassportOwner], passportOwner);
                                    exch[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(passportOwnerStake);
                                    assert.equal(exch[ExchangeField.FactProvider], factProvider);
                                    assert.equal(exch[ExchangeField.Key], key);
                                    assert.equal(exch[ExchangeField.DataIPFSHash], dataIPFSHash);
                                    assert.equal(exch[ExchangeField.DataKeyHash], dataKeyHash);
                                    assert.equal(exch[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
                                    assert.equal(exch[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
                                    assert.equal(exch[ExchangeField.EncryptedDataKey], encryptedDataKey);
                                    assert.equal(exch[ExchangeField.State], ExchangeState.Closed);
                                    exch[ExchangeField.StateExpired].should.be.bignumber.equal(acceptTimeout.add(acceptTxTimestamp));
                                });
                            });
                        });
                    });
                });

                describe('when passport owner accepted private data exchange but is trying to cheat', () => {
                    const encryptedDataKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
                    const passportOwnerStake = 20000000;

                    let passportBalanceBeforeAccept;
                    let acceptPrivateDataExchangeTx;

                    beforeEach(async () => {
                        passportBalanceBeforeAccept = await web3.eth.getBalance(passportAsLogic.address);
                        acceptPrivateDataExchangeTx = await passportAsLogic.acceptPrivateDataExchange(exchangeIdx, encryptedDataKey, {
                            from: passportOwner,
                            value: passportOwnerStake
                        });
                    });

                    describe('then', () => {
                        it('should emit PrivateDataExchangeAccepted event', async () => {
                            await expectEvent.inTransaction(acceptPrivateDataExchangeTx, "PrivateDataExchangeAccepted", {
                                exchangeIdx: exchangeIdx,
                                dataRequester: dataRequester,
                                passportOwner: passportOwner
                            });
                        });

                        it('should increment passport contract balance', async () => {
                            const passportBalance = await web3.eth.getBalance(passportAsLogic.address);
                            passportBalance.should.be.bignumber.equal(passportBalanceBeforeAccept.add(passportOwnerStake));
                        });

                        it('should correctly set exchange fields', async () => {
                            const acceptTxTimestamp = txTimestamp(acceptPrivateDataExchangeTx);

                            const exch = await passportAsLogic.privateDataExchanges(exchangeIdx);
                            assert.equal(exch[ExchangeField.DataRequester], dataRequester);
                            exch[ExchangeField.DataRequesterValue].should.be.bignumber.equal(dataRequesterStake);
                            assert.equal(exch[ExchangeField.PassportOwner], passportOwner);
                            exch[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(passportOwnerStake);
                            assert.equal(exch[ExchangeField.FactProvider], factProvider);
                            assert.equal(exch[ExchangeField.Key], key);
                            assert.equal(exch[ExchangeField.DataIPFSHash], dataIPFSHash);
                            assert.equal(exch[ExchangeField.DataKeyHash], dataKeyHash);
                            assert.equal(exch[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
                            assert.equal(exch[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
                            assert.equal(exch[ExchangeField.EncryptedDataKey], encryptedDataKey);
                            assert.equal(exch[ExchangeField.State], ExchangeState.Accepted);
                            exch[ExchangeField.StateExpired].should.be.bignumber.equal(acceptTimeout.add(acceptTxTimestamp));
                        });
                    });

                    describe('when data requester finished private data exchange', () => {

                        let passportBalanceBeforeFinish;
                        let passportOwnerBalanceBeforeFinish;
                        let finishPrivateDataExchangeTx;

                        beforeEach(async () => {
                            passportBalanceBeforeFinish = await web3.eth.getBalance(passportAsLogic.address);
                            passportOwnerBalanceBeforeFinish = await web3.eth.getBalance(passportOwner);
                            finishPrivateDataExchangeTx = await passportAsLogic.finishPrivateDataExchange(exchangeIdx, {from: dataRequester});
                        });

                        describe('then', () => {
                            it('should emit PrivateDataExchangeClosed event', async () => {
                                await expectEvent.inTransaction(finishPrivateDataExchangeTx, "PrivateDataExchangeClosed", {
                                    exchangeIdx: exchangeIdx
                                });
                            });

                            it('should decrement passport contract balance', async () => {
                                const passportBalance = await web3.eth.getBalance(passportAsLogic.address);
                                passportBalance.should.be.bignumber.equal(passportBalanceBeforeFinish.sub(passportOwnerStake).sub(dataRequesterStake));
                            });

                            it('should transfer all staked amount to passport owner', async () => {
                                const passportOwnerBalance = await web3.eth.getBalance(passportOwner);
                                passportOwnerBalance.should.be.bignumber.equal(passportOwnerBalanceBeforeFinish.add(passportOwnerStake).add(dataRequesterStake))
                            });

                            it('should correctly set exchange fields', async () => {
                                const acceptTxTimestamp = txTimestamp(acceptPrivateDataExchangeTx);

                                const exch = await passportAsLogic.privateDataExchanges(exchangeIdx);
                                assert.equal(exch[ExchangeField.DataRequester], dataRequester);
                                exch[ExchangeField.DataRequesterValue].should.be.bignumber.equal(dataRequesterStake);
                                assert.equal(exch[ExchangeField.PassportOwner], passportOwner);
                                exch[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(passportOwnerStake);
                                assert.equal(exch[ExchangeField.FactProvider], factProvider);
                                assert.equal(exch[ExchangeField.Key], key);
                                assert.equal(exch[ExchangeField.DataIPFSHash], dataIPFSHash);
                                assert.equal(exch[ExchangeField.DataKeyHash], dataKeyHash);
                                assert.equal(exch[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
                                assert.equal(exch[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
                                assert.equal(exch[ExchangeField.EncryptedDataKey], encryptedDataKey);
                                assert.equal(exch[ExchangeField.State], ExchangeState.Closed);
                                exch[ExchangeField.StateExpired].should.be.bignumber.equal(acceptTimeout.add(acceptTxTimestamp));
                            });
                        });
                    });

                    describe('when data requester opens fair dispute', () => {

                        let passportBalanceBeforeDispute;
                        let dataRequesterBalanceBeforeDispute;
                        let disputePrivateDataExchangeTx;
                        let disputePrivateDataExchangeTxCost;

                        beforeEach(async () => {
                            passportBalanceBeforeDispute = await web3.eth.getBalance(passportAsLogic.address);
                            dataRequesterBalanceBeforeDispute = await web3.eth.getBalance(dataRequester);
                            disputePrivateDataExchangeTx = await passportAsLogic.disputePrivateDataExchange(exchangeIdx, exchangeKey, {
                                from: dataRequester,
                                gasPrice: 1
                            });
                            disputePrivateDataExchangeTxCost = disputePrivateDataExchangeTx.receipt.gasUsed;
                        });

                        describe('then', () => {
                            it('should emit PrivateDataExchangeClosed event', async () => {
                                await expectEvent.inTransaction(disputePrivateDataExchangeTx, "PrivateDataExchangeClosed", {
                                    exchangeIdx: exchangeIdx
                                });
                            });

                            it('should emit PrivateDataExchangeDisputed event', async () => {
                                await expectEvent.inTransaction(disputePrivateDataExchangeTx, "PrivateDataExchangeDisputed", {
                                    exchangeIdx: exchangeIdx,
                                    successful: true,
                                    cheater: passportOwner
                                });
                            });

                            it('should decrement passport contract balance', async () => {
                                const passportBalance = await web3.eth.getBalance(passportAsLogic.address);
                                passportBalance.should.be.bignumber.equal(passportBalanceBeforeDispute.sub(passportOwnerStake).sub(dataRequesterStake));
                            });

                            it('should transfer all staked amount to data requester', async () => {
                                const dataRequesterBalance = await web3.eth.getBalance(dataRequester);
                                dataRequesterBalance.should.be.bignumber.equal(
                                    dataRequesterBalanceBeforeDispute.add(passportOwnerStake).add(dataRequesterStake).sub(disputePrivateDataExchangeTxCost));
                            });

                            it('should correctly set exchange fields', async () => {
                                const acceptTxTimestamp = txTimestamp(acceptPrivateDataExchangeTx);

                                const exch = await passportAsLogic.privateDataExchanges(exchangeIdx);
                                assert.equal(exch[ExchangeField.DataRequester], dataRequester);
                                exch[ExchangeField.DataRequesterValue].should.be.bignumber.equal(dataRequesterStake);
                                assert.equal(exch[ExchangeField.PassportOwner], passportOwner);
                                exch[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(passportOwnerStake);
                                assert.equal(exch[ExchangeField.FactProvider], factProvider);
                                assert.equal(exch[ExchangeField.Key], key);
                                assert.equal(exch[ExchangeField.DataIPFSHash], dataIPFSHash);
                                assert.equal(exch[ExchangeField.DataKeyHash], dataKeyHash);
                                assert.equal(exch[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
                                assert.equal(exch[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
                                assert.equal(exch[ExchangeField.EncryptedDataKey], encryptedDataKey);
                                assert.equal(exch[ExchangeField.State], ExchangeState.Closed);
                                exch[ExchangeField.StateExpired].should.be.bignumber.equal(acceptTimeout.add(acceptTxTimestamp));
                            });
                        });
                    });

                    describe('when exchange acceptance/dispute timed out', () => {

                        beforeEach(async () => {
                            await increaseTime(acceptTimeout.add(1).toNumber());
                        });

                        describe('then', () => {
                            it('should not allow data requester to open dispute', async () => {
                                await expectThrow(passportAsLogic.disputePrivateDataExchange(exchangeIdx, exchangeKey, {
                                    from: dataRequester,
                                    gasPrice: 1
                                }), EVMRevert);
                            });
                        });

                        describe('when passport owner finished private data exchange', () => {

                            let passportBalanceBeforeFinish;
                            let passportOwnerBalanceBeforeFinish;
                            let finishPrivateDataExchangeTx;
                            let finishPrivateDataExchangeTxCost;

                            beforeEach(async () => {
                                passportBalanceBeforeFinish = await web3.eth.getBalance(passportAsLogic.address);
                                passportOwnerBalanceBeforeFinish = await web3.eth.getBalance(passportOwner);
                                finishPrivateDataExchangeTx = await passportAsLogic.finishPrivateDataExchange(exchangeIdx, {
                                    from: passportOwner,
                                    gasPrice: 1
                                });
                                finishPrivateDataExchangeTxCost = finishPrivateDataExchangeTx.receipt.gasUsed;
                            });

                            describe('then', () => {
                                it('should emit PrivateDataExchangeClosed event', async () => {
                                    await expectEvent.inTransaction(finishPrivateDataExchangeTx, "PrivateDataExchangeClosed", {
                                        exchangeIdx: exchangeIdx
                                    });
                                });

                                it('should decrement passport contract balance', async () => {
                                    const passportBalance = await web3.eth.getBalance(passportAsLogic.address);
                                    passportBalance.should.be.bignumber.equal(passportBalanceBeforeFinish.sub(passportOwnerStake).sub(dataRequesterStake));
                                });

                                it('should transfer all staked amount to passport owner', async () => {
                                    const passportOwnerBalance = await web3.eth.getBalance(passportOwner);
                                    passportOwnerBalance.should.be.bignumber.equal(
                                        passportOwnerBalanceBeforeFinish.add(passportOwnerStake).add(dataRequesterStake).sub(finishPrivateDataExchangeTxCost))
                                });

                                it('should correctly set exchange fields', async () => {
                                    const acceptTxTimestamp = txTimestamp(acceptPrivateDataExchangeTx);

                                    const exch = await passportAsLogic.privateDataExchanges(exchangeIdx);
                                    assert.equal(exch[ExchangeField.DataRequester], dataRequester);
                                    exch[ExchangeField.DataRequesterValue].should.be.bignumber.equal(dataRequesterStake);
                                    assert.equal(exch[ExchangeField.PassportOwner], passportOwner);
                                    exch[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(passportOwnerStake);
                                    assert.equal(exch[ExchangeField.FactProvider], factProvider);
                                    assert.equal(exch[ExchangeField.Key], key);
                                    assert.equal(exch[ExchangeField.DataIPFSHash], dataIPFSHash);
                                    assert.equal(exch[ExchangeField.DataKeyHash], dataKeyHash);
                                    assert.equal(exch[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
                                    assert.equal(exch[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
                                    assert.equal(exch[ExchangeField.EncryptedDataKey], encryptedDataKey);
                                    assert.equal(exch[ExchangeField.State], ExchangeState.Closed);
                                    exch[ExchangeField.StateExpired].should.be.bignumber.equal(acceptTimeout.add(acceptTxTimestamp));
                                });
                            });
                        });

                        describe('when data requester finished private data exchange', () => {

                            let passportBalanceBeforeFinish;
                            let passportOwnerBalanceBeforeFinish;
                            let finishPrivateDataExchangeTx;

                            beforeEach(async () => {
                                passportBalanceBeforeFinish = await web3.eth.getBalance(passportAsLogic.address);
                                passportOwnerBalanceBeforeFinish = await web3.eth.getBalance(passportOwner);
                                finishPrivateDataExchangeTx = await passportAsLogic.finishPrivateDataExchange(exchangeIdx, {from: dataRequester});
                            });

                            describe('then', () => {
                                it('should emit PrivateDataExchangeClosed event', async () => {
                                    await expectEvent.inTransaction(finishPrivateDataExchangeTx, "PrivateDataExchangeClosed", {
                                        exchangeIdx: exchangeIdx
                                    });
                                });

                                it('should decrement passport contract balance', async () => {
                                    const passportBalance = await web3.eth.getBalance(passportAsLogic.address);
                                    passportBalance.should.be.bignumber.equal(passportBalanceBeforeFinish.sub(passportOwnerStake).sub(dataRequesterStake));
                                });

                                it('should transfer all staked amount to passport owner', async () => {
                                    const passportOwnerBalance = await web3.eth.getBalance(passportOwner);
                                    passportOwnerBalance.should.be.bignumber.equal(passportOwnerBalanceBeforeFinish.add(passportOwnerStake).add(dataRequesterStake))
                                });

                                it('should correctly set exchange fields', async () => {
                                    const acceptTxTimestamp = txTimestamp(acceptPrivateDataExchangeTx);

                                    const exch = await passportAsLogic.privateDataExchanges(exchangeIdx);
                                    assert.equal(exch[ExchangeField.DataRequester], dataRequester);
                                    exch[ExchangeField.DataRequesterValue].should.be.bignumber.equal(dataRequesterStake);
                                    assert.equal(exch[ExchangeField.PassportOwner], passportOwner);
                                    exch[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(passportOwnerStake);
                                    assert.equal(exch[ExchangeField.FactProvider], factProvider);
                                    assert.equal(exch[ExchangeField.Key], key);
                                    assert.equal(exch[ExchangeField.DataIPFSHash], dataIPFSHash);
                                    assert.equal(exch[ExchangeField.DataKeyHash], dataKeyHash);
                                    assert.equal(exch[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
                                    assert.equal(exch[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
                                    assert.equal(exch[ExchangeField.EncryptedDataKey], encryptedDataKey);
                                    assert.equal(exch[ExchangeField.State], ExchangeState.Closed);
                                    exch[ExchangeField.StateExpired].should.be.bignumber.equal(acceptTimeout.add(acceptTxTimestamp));
                                });
                            });
                        });
                    });
                });

                describe('when exchange proposition timed out', () => {

                    beforeEach(async () => {
                        await increaseTime(proposeTimeout.add(1).toNumber());
                    });

                    describe('then', () => {
                        it('should not allow passport owner to fairly accept exchange proposition', async () => {
                            // encrypted data key = proposedExchange key XOR data key: 0xd9c0d3ccd55b7e5c6b63cee3869bcdc5eddaedf273a0caef16c21225f8e62efe
                            const encryptedDataKey = '0xd9c0d3ccd55b7e5c6b63cee3869bcdc5eddaedf273a0caef16c21225f8e62efe';
                            const passportOwnerStake = 20000000;

                            await expectThrow(passportAsLogic.acceptPrivateDataExchange(exchangeIdx, encryptedDataKey, {
                                from: passportOwner,
                                value: passportOwnerStake
                            }), EVMRevert);
                        });
                    });

                    describe('when data requester closes exchange', () => {

                        let passportBalanceBeforeTimeout;
                        let dataRequesterBalanceBeforeTimeout;
                        let timeoutPrivateDataExchangeTx;
                        let timeoutPrivateDataExchangeTxCost;

                        beforeEach(async () => {
                            passportBalanceBeforeTimeout = await web3.eth.getBalance(passportAsLogic.address);
                            dataRequesterBalanceBeforeTimeout = await web3.eth.getBalance(dataRequester);
                            timeoutPrivateDataExchangeTx = await passportAsLogic.timeoutPrivateDataExchange(exchangeIdx, {
                                from: dataRequester,
                                gasPrice: 1
                            });
                            timeoutPrivateDataExchangeTxCost = timeoutPrivateDataExchangeTx.receipt.gasUsed;
                        });

                        describe('then', () => {
                            it('should emit PrivateDataExchangeClosed event', async () => {
                                await expectEvent.inTransaction(timeoutPrivateDataExchangeTx, "PrivateDataExchangeClosed", {
                                    exchangeIdx: exchangeIdx
                                });
                            });

                            it('should decrement passport contract balance', async () => {
                                const passportBalance = await web3.eth.getBalance(passportAsLogic.address);
                                passportBalance.should.be.bignumber.equal(passportBalanceBeforeTimeout.sub(dataRequesterStake));
                            });

                            it('should return staked amount to data requester', async () => {
                                const dataRequesterBalance = await web3.eth.getBalance(dataRequester);
                                dataRequesterBalance.should.be.bignumber.equal(
                                    dataRequesterBalanceBeforeTimeout.add(dataRequesterStake).sub(timeoutPrivateDataExchangeTxCost));
                            });

                            it('should correctly set exchange fields', async () => {
                                const proposeTxTimestamp = txTimestamp(proposePrivateDataExchangeTx);

                                const exch = await passportAsLogic.privateDataExchanges(exchangeIdx);
                                assert.equal(exch[ExchangeField.DataRequester], dataRequester);
                                exch[ExchangeField.DataRequesterValue].should.be.bignumber.equal(dataRequesterStake);
                                assert.equal(exch[ExchangeField.PassportOwner], passportOwner);
                                exch[ExchangeField.PassportOwnerValue].should.be.bignumber.equal(0);
                                assert.equal(exch[ExchangeField.FactProvider], factProvider);
                                assert.equal(exch[ExchangeField.Key], key);
                                assert.equal(exch[ExchangeField.DataIPFSHash], dataIPFSHash);
                                assert.equal(exch[ExchangeField.DataKeyHash], dataKeyHash);
                                assert.equal(exch[ExchangeField.EncryptedExchangeKey], encryptedExchangeKey);
                                assert.equal(exch[ExchangeField.ExchangeKeyHash], exchangeKeyHash);
                                assert.equal(exch[ExchangeField.EncryptedDataKey], '0x0000000000000000000000000000000000000000000000000000000000000000');
                                assert.equal(exch[ExchangeField.State], ExchangeState.Closed);
                                exch[ExchangeField.StateExpired].should.be.bignumber.equal(proposeTimeout.add(proposeTxTimestamp));
                            });
                        });
                    });
                });
            });
        });
    });
});