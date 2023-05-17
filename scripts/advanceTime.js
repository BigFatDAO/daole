// npx hardhat run --network localhost scripts/advanceTime.js
// This script advances the EVM time by 90 days, which is the duration of the whitelist.
const { ethers } = require("hardhat");

async function advanceTime() {
  await ethers.provider.send("evm_increaseTime", [90*24*60*60]);
  // check it works
  getCurrentBlockTime();
  // Mine a new block to make the timestamp change take effect
  await ethers.provider.send("evm_mine", []);
  // check it works
  getCurrentBlockTime();
}

async function getCurrentBlockTime() {
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);
  const timestamp = block.timestamp;
  console.log(`Current block time: ${new Date(timestamp * 1000).toLocaleString()}`);
}

advanceTime();