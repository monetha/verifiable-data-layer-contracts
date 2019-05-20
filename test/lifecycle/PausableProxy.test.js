const {assertRevert} = require('../helpers/assertRevert');
const PausableProxyMock = artifacts.require('PausableProxyMock');

contract('PausableProxy', function (accounts) {
    beforeEach(async function () {
        this.pausable = await PausableProxyMock.new({ from: accounts[0] });
    });

    it('can call methods marked with whenNotPaused after creation', async function () {
        await this.pausable.callableWhenNotPaused();
    });

    it('can not call methods marked with whenPaused after creation', async function () {
        await assertRevert(this.pausable.callableWhenPaused());
    });

    it('can call methods marked with whenPaused after pause', async function () {
        await this.pausable.pause();

        await this.pausable.callableWhenPaused();
    });

    it('can not call methods marked with whenNotPaused after pause', async function () {
        await this.pausable.pause();

        await assertRevert(this.pausable.callableWhenNotPaused());
    });

    it('can call methods marked with whenNotPaused after un-pause', async function () {
        await this.pausable.pause();
        await this.pausable.unpause();

        await this.pausable.callableWhenNotPaused();
    });

    it('can not call methods marked with whenPaused after un-pause', async function () {
        await this.pausable.pause();
        await this.pausable.unpause();

        await assertRevert(this.pausable.callableWhenPaused());
    });
});
