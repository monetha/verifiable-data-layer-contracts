const { shouldBehaveLikeOwnable } = require('./Ownable.behaviour');

const OwnableProxy = artifacts.require('OwnableProxy');

contract('OwnableProxy', function (accounts) {
  beforeEach(async function () {
    this.ownable = await OwnableProxy.new();
  });

  shouldBehaveLikeOwnable(accounts);
});
