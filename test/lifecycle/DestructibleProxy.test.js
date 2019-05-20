const DestructibleProxyMock = artifacts.require('DestructibleProxyMock');
const {ethGetBalance} = require('../helpers/web3');
const {assertRevert} = require('../helpers/assertRevert');

contract('DestructibleProxy', function (accounts) {
    beforeEach(async function () {
        this.destructible = await DestructibleProxyMock.new({from: accounts[0]});
        await web3.eth.sendTransaction({
            from: accounts[0],
            to: this.destructible.address,
            value: web3.toWei('10', 'ether'),
        });

        this.owner = await this.destructible.owner();
    });

    it('should send balance to owner after destruction', async function () {
        const initBalance = await ethGetBalance(this.owner);
        await this.destructible.destroy({from: this.owner});
        const newBalance = await ethGetBalance(this.owner);
        assert.isTrue(newBalance > initBalance);
    });

    it('should send balance to recepient after destruction', async function () {
        const initBalance = await ethGetBalance(accounts[1]);
        await this.destructible.destroyAndSend(accounts[1], {from: this.owner});
        const newBalance = await ethGetBalance(accounts[1]);
        assert.isTrue(newBalance.greaterThan(initBalance));
    });

    it('destroy should fail when paused', async function () {
        await this.destructible.pause();
        await assertRevert(this.destructible.destroy({from: this.owner}));
    });

    it('destroyAndSend should fail when paused', async function () {
        await this.destructible.pause();
        await assertRevert(this.destructible.destroyAndSend(accounts[1], {from: this.owner}));
    });
});
