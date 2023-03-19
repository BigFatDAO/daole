// Testing the contracts in isolation first, then testing the whole system

const { expect } = require('chai');
const { ethers } = require('hardhat');

const twoWeeks = 60*60*24*14
const oneMonth = 60*60*24*28
const hundredDays = 60*60*24*100
const sixMonths = 60*60*24*7*26
const clubMint = 1000000

//get signers, deploy existing contracts (WONE, UniswapV2Factory, UniswapV2Router02)
before(async function () {
    //wL = Whitelisted accounts, m = Members, p = public, not members
    [owner, wL1, wL2, wL3, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, p1, p2, p3] = await ethers.getSigners();

    //deploy WONE
    const WOne = await ethers.getContractFactory("WOne");
    wOne = await WOne.deploy();
    await wOne.deployed();

    //deploy UniswapFactory
    const UniswapFactory = await ethers.getContractFactory("UniswapFactory");
    uniswapFactory = await UniswapFactory.deploy();
    await uniswapFactory.deployed();

    //deploy UniswapRouter
    const UniswapRouter = await ethers.getContractFactory("UniswapRouter");
    uniswapRouter = await UniswapRouter.deploy(uniswapFactory.address, wOne.address);
    await uniswapRouter.deployed();
});

// 1. Deploy Whitelist.
describe("WhiteList Tests", function () {
    //deploy whitelist
    it("Should deploy the whitelist", async function () {
        const WhiteList = await ethers.getContractFactory("WhiteList");
        whiteList = await WhiteList.deploy(uniswapRouter.address, uniswapFactory.address, wOne.address);
        await whiteList.deployed();
        console.log("WhiteList deployed to:", whiteList.address);
    });

    it("Close time is 90 days from now, owner can delay", async function () {
        //check close time is 90 days from now
        console.log("Close time is ", (await whiteList.closeTime()).toNumber());
        console.log("Current time is ", (await ethers.provider.getBlock()).timestamp);
        console.log("difference is ", (await whiteList.closeTime()).toNumber() - (await ethers.provider.getBlock()).timestamp);
        console.log("90 days is ", 90*24*60*60);

        expect(await whiteList.closeTime()).to.equal((await ethers.provider.getBlock()).timestamp + 90*24*60*60);
        //check owner can delay
        await whiteList.delayCloseTime(20);
        expect(await whiteList.closeTime()).to.equal((await ethers.provider.getBlock()).timestamp + 110*24*60*60);
    });
});

//     1. People can buy in to start a club, 1000 ONE for a club loaded with 1M tokens.
//     2. Set refunds close time - this also allows people to call the createClub function
// 2. Deploy Leader:
//     1. Mint 4B to the Whitelist
//     2. Deploy Timelock
//     3. Deploy YieldFarm
//      1. add yieldfarm to whitelist
//      2. add clubfactory to whitelist
//      3. transfer farm ownership to whitelist
//     4. Mint dev tokens to be transferred to timelock
//     5. Mint dev DAO tokens to governance contract
// 3. Close Whitelist:
//     1. Transfer 1M ONE to ClubFactory for every club on the whitelist
//     2. Create LP, get LP address
//     3. Transfer to and initialize YieldFarm
//     4. Unlock the createClub function
// 4. Whitelisted people can create clubs
//     1. Create a club with 1M tokens


//In order for the leader contract to deploy, we must first deploy timelock and whitelist
//Deploy TimeLock:

//Test TimeLock
//setLeader can be called by owner
//setLeader can't be called by others
//can deposit - check the IERC20 is using the correct allowance function
//Stores balance correctly
//Sets release time correctly
//can't withdraw before release time
//Can withdraw after release time

//Deploy whiteList:

//Test whitelist:
//Check owner can add clubFactory
//Check non owner can't add clubFactory
//People can pay 100 ONE to join the whitelist
//People can't pay less than 100 ONE to join the whitelist
//People can refund until Leader is launched
//Can only join whitelist once
//Can't join whitelist after close date
//Whitelisted people can create clubs
//Non whitelisted people can't create clubs
//Creates an LP with the one and the tokens minted to it from the Leader

//Deploy Leader:

//Test Leader:
//Constructor:
//whitelist address has been added
//Voting contract has been created and timelock address has been added
//Club factory has been created and timelock and whitelist addresses have been added
//Performance contract has been created
//mints to the clubFactory: 1M for every club
//mints LP tokens to whitelist
    //Closes whitelist and creates LP
//mints to yield farm

//Transfer
//transfers can't be more than the balance
//transfers can't be less than 0
//transfers to non members are free
//transfers to members are charged 2%, which is burned
//performance is added to receiving member

//addToAllMembers
//can only be called by clubs or clubFactory
//correctly sets addedBy and club

//finishCreation
//can only be called by clubFactory
//correctly sets club[true] and adds the member to allMembers

//payClubs
//can only be called by clubs
//pays the clubs the correct amounts

//clubOfMember and getAddedBy work correctly
//isClub works correctly

//Test Performance