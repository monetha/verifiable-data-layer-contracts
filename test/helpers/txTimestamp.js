function txTimestamp(tx) {
    return web3.eth.getBlock(tx.receipt.blockNumber).timestamp;
}

module.exports = {
    txTimestamp,
};