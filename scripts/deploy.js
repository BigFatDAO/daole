//Launch events that will enable a trustless launch of the system.

//launch script for deploying the daosystem
// npx hardhat run --network localhost scripts/deploy.js

const hre = require("hardhat");
const path = require('path');

// 1. Deploy Whitelist.
//     1. People can buy in to start a club, 1000 ONE for a club loaded with 1M tokens.
async function deployWhitelist() {
    const [deployer] = await hre.ethers.getSigners();
    const WhiteList = await hre.ethers.getContractFactory("WhiteList");
    const whiteList = await WhiteList.deploy();
    await whiteList.deployed();
    console.log("WhiteList deployed to:", whiteList.address);

    //save to the frontend
    
}
//     2. Set refunds close time - this also allows people to call the createClub function
// 2. Deploy Leader:
//     1. Mint 4B to the Whitelist
//     2. Deploy Timelock
//     3. Deploy YieldFarm
//     4. Mint dev tokens to be transferred to timelock
//     5. Mint dev DAO tokens to governance contract
// 3. Close Whitelist:
//     1. Transfer 1M ONE to ClubFactory for every club on the whitelist
//     2. Create LP, get LP address
//     3. Transfer to and initialize YieldFarm
//     4. Unlock the createClub function
// 4. Whitelisted people can create clubs
//     1. Create a club with 1M tokens

async function main() {
    deployWhitelist();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
