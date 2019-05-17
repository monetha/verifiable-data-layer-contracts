const { shouldBehaveLikeOwnable } = require('./Ownable.behaviour');

const OwnableProxy = artifacts.require('OwnableProxyMock');

contract('OwnableProxy', function (accounts) {
  beforeEach(async function () {
    this.ownable = await OwnableProxy.new();
  });

  shouldBehaveLikeOwnable(accounts);
});
