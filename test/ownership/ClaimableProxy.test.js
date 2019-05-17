const { assertRevert } = require('../helpers/assertRevert');

const ClaimableProxy = artifacts.require('ClaimableProxyMock');

contract('ClaimableProxy', function (accounts) {
  let claimable;

  beforeEach(async function () {
    claimable = await ClaimableProxy.new();
  });

  it('should have an owner', async function () {
    const owner = await claimable.owner();
    assert.isTrue(owner !== 0);
  });

  it('changes pendingOwner after transfer', async function () {
    const newOwner = accounts[1];
    await claimable.transferOwnership(newOwner);
    const pendingOwner = await claimable.pendingOwner();

    assert.isTrue(pendingOwner === newOwner);
  });

  it('should prevent transferOwnership when paused', async function () {
    await claimable.pause();

    const newOwner = accounts[1];
    await assertRevert(claimable.transferOwnership(newOwner));
  });

  it('should prevent to claimOwnership from no pendingOwner', async function () {
    await assertRevert(claimable.claimOwnership({ from: accounts[2] }));
  });

  it('should prevent non-owners from transfering', async function () {
    const other = accounts[2];
    const owner = await claimable.owner.call();

    assert.isTrue(owner !== other);
    await assertRevert(claimable.transferOwnership(other, { from: other }));
  });

  describe('after initiating a transfer', function () {
    let newOwner;

    beforeEach(async function () {
      newOwner = accounts[1];
      await claimable.transferOwnership(newOwner);
    });

    it('changes allow pending owner to claim ownership', async function () {
      await claimable.claimOwnership({ from: newOwner });
      const owner = await claimable.owner();

      assert.isTrue(owner === newOwner);
    });

    it('should prevent claimOwnership when paused', async function () {
      await claimable.pause();

      await assertRevert(claimable.claimOwnership({ from: newOwner }));
    });
  });
});
