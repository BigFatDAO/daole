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
describe("WhiteList Tests before close", function () {
    it("Should deploy the whitelist", async function () {
        const WhiteList = await ethers.getContractFactory("WhiteList");
        whiteList = await WhiteList.deploy(uniswapRouter.address, uniswapFactory.address, wOne.address);
        await whiteList.deployed();
        console.log("WhiteList deployed to:", whiteList.address);
    });

    it("constructor", async function () {
        expect(await whiteList.router()).to.equal(uniswapRouter.address);
        expect(await whiteList.factory()).to.equal(uniswapFactory.address);
        expect(await whiteList.wone()).to.equal(wOne.address);
        expect(await whiteList.owner()).to.equal(owner.address);
        expect(await whiteList.closeTime()).to.equal((await ethers.provider.getBlock()).timestamp + 90*24*60*60);
    });

    it("delayCloseTime", async function () {
        //owner delays
        const closeTime = (await whiteList.closeTime()).toNumber();
        await whiteList.delayCloseTime(10);
        expect(await whiteList.closeTime()).to.equal(closeTime + 10*24*60*60);
        //non owner can't delay
        await expect(whiteList.connect(m1).delayCloseTime(10)).to.be.revertedWith("not owner");
    });

    it("addToWhitelist", async function () {
        //can add with 1000 ONE
        await whiteList.connect(wL1).addToWhiteList(wL1.address, {value: ethers.utils.parseEther("1000")});
        expect(await whiteList.whiteList(wL1.address)).to.equal(true);
        //can't add with less than 1000 ONE
        await expect(whiteList.connect(wL2).addToWhiteList(wL2.address, {value: ethers.utils.parseEther("999")})).to.be.revertedWith("not enough ONE");
        //can't add twice
        await expect(whiteList.connect(wL1).addToWhiteList(wL1.address, {value: ethers.utils.parseEther("1000")})).to.be.revertedWith("already whitelisted");
        //add wL2 as well for later tests
        await whiteList.connect(wL2).addToWhiteList(wL2.address, {value: ethers.utils.parseEther("1000")});
    });

    it("refund", async function () {
        //can refund before close time
        const wL1Balance = await ethers.provider.getBalance(wL1.address);
        await whiteList.connect(wL1).refund();
        //wL1 balance should be almost 1000 ONE more, except gas
        expect(await ethers.provider.getBalance(wL1.address)).to.be.above(wL1Balance.add(ethers.utils.parseEther("999.9")));
    });
    //test addClubFactory and addYieldFarm after deploying the contracts
});

// 2. Deploy Timelock
describe("Deploy Timelock", function () {
    it("Should deploy the timelock", async function () {
        const TimeLock = await ethers.getContractFactory("TimeLock");
        timeLock = await TimeLock.deploy();
        await timeLock.deployed();
        console.log("TimeLock deployed to:", timeLock.address);
    });

    it("constructor", async function () {
        expect(await timeLock.owner()).to.equal(owner.address);
    });
});

// 3. Deploy Leader
describe("Deploy Leader", function () {
    it("Should deploy the leader", async function () {
        const Leader = await ethers.getContractFactory("Leader");
        //deploy leader with timelock, whitelist, and owner, mint 500M to owner (dev1)
        leader = await Leader.deploy(whiteList.address, timeLock.address, owner.address, ethers.utils.parseEther("500000000"));
        await leader.deployed();
        console.log("Leader deployed to:", leader.address);
        //log the gas cost
        console.log("Leader gas cost:", (await ethers.provider.getTransactionReceipt(leader.deployTransaction.hash)).gasUsed.toString());
        //log the contract size
        console.log("Leader contract size:", (await ethers.provider.getCode(leader.address)).length.toString());
    });

    it("constructor excl voting, clubfactory and performance", async function () {
        expect(await leader.whiteList()).to.equal(whiteList.address);
        expect(await leader.balanceOf(whiteList.address)).to.equal(ethers.utils.parseEther("4000000000"));
        expect(await leader.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1500000000"));
    });

    it("voting deployed correctly", async function () {
        const votingAddress = await leader.votingAddress();
        voting = await ethers.getContractAt("Voting", votingAddress);
        expect (await voting.leader()).to.equal(leader.address);
        expect (await voting.timeLock()).to.equal(timeLock.address);
    });

    it("clubfactory deployed correctly", async function () {
        const clubFactoryAddress = await leader.clubFactoryAddress();
        clubFactory = await ethers.getContractAt("ClubFactory",clubFactoryAddress);
        expect (await clubFactory.leader()).to.equal(leader.address);
        expect (await clubFactory.timeLock()).to.equal(timeLock.address);
        expect (await clubFactory.whiteList()).to.equal(whiteList.address);
        expect (await clubFactory.numberOfClubs()).to.equal(0);
    });

    it("performance deployed correctly", async function () {
        const performanceAddress = await leader.performance();
        performance = await ethers.getContractAt("Performance",performanceAddress);
        expect (await performance.leader()).to.equal(leader.address);
    });
    

});
//     3. Deploy YieldFarm
describe("Deploy YieldFarm", function () {
    it("Should deploy the YieldFarm", async function () {
        const YieldFarm = await ethers.getContractFactory("YieldFarm");
        //deploy YieldFarm with timelock, whitelist, and owner, mint 500M to owner (dev1)
        yieldFarm = await YieldFarm.deploy(whiteList.address);
        await yieldFarm.deployed();
        console.log("YieldFarm deployed to:", yieldFarm.address);
    });

    it("constructor", async function () {
        expect(await yieldFarm.owner()).to.equal(whiteList.address);
    });
});
//      1. add yieldfarm and clubFactory to whitelist
describe("Whitelist adds YieldFarm and ClubFactory", function () {
    it("Should add YieldFarm and ClubFactory", async function () {
        //non owner can't add
        await expect(whiteList.connect(wL2).addClubFactoryAddress(clubFactory.address)).to.be.revertedWith("not owner");
        await expect(whiteList.connect(wL2).addYieldFarmAddress(yieldFarm.address)).to.be.revertedWith("not owner");
        //owner can add
        await whiteList.addClubFactoryAddress(clubFactory.address);
        await whiteList.addYieldFarmAddress(yieldFarm.address);
        //check that the addresses are added
        expect(await whiteList.clubFactoryAddress()).to.equal(clubFactory.address);
        expect(await whiteList.yieldFarmAddress()).to.equal(yieldFarm.address);
        //cant add YieldFarm twice
        await expect(whiteList.addYieldFarmAddress(wL1.address)).to.be.revertedWith("Already set");
    });
});

describe("timeLock sets leader", function () {
    it("Should set leader", async function () {
        //non owner can't set
        await expect(timeLock.connect(wL2).setLeader(leader.address)).to.be.revertedWith("not owner");
        //owner can set
        await timeLock.setLeader(leader.address);
        //check that the address is set
        expect(await timeLock.leader()).to.equal(leader.address);
        //cant set leader twice
        await expect(timeLock.setLeader(wL1.address)).to.be.revertedWith("Already set");
    });
});

//dev deposits tokens in timeLock
describe("Dev deposits tokens in timeLock", function () {
    it("Should deposit tokens in timeLock", async function () {
        //increase allowance
        await leader.connect(owner).increaseAllowance(timeLock.address, ethers.utils.parseEther("500000000"));
        //deposit in timeLock
        await timeLock.connect(owner).deposit(owner.address, ethers.utils.parseEther("500000000"), 185);
        //check that the balance is correct
        expect(await leader.balanceOf(timeLock.address)).to.equal(ethers.utils.parseEther("500000000"));
        //check balance of owner
        expect(await leader.balanceOf(owner.address)).to.equal(0);
        expect(await timeLock.getBalance(owner.address)).to.equal(ethers.utils.parseEther("500000000"));
        //check that the release time is correct
        expect(await timeLock.getReleaseTime(owner.address)).to.equal((await ethers.provider.getBlock()).timestamp + 185*24*60*60);
    });
});
//Deploy DaoTimelock
describe("Deploy DaoTimelock and transfer DAO funds", function () {
    it("Should deploy the DaoTimelock", async function () {
        const DaoTimelock = await ethers.getContractFactory("DaoTimelock");
        daoTimelock = await DaoTimelock.deploy(7*24*60*60, [owner.address], [owner.address], owner.address);
        await daoTimelock.deployed();
        console.log("DaoTimelock deployed to:", daoTimelock.address);
    });

    it("constructor", async function () {
        //check min delay
        expect(await daoTimelock.getMinDelay()).to.equal(7*24*60*60);
        //check admin
        //get DEFAULT_ADMIN_ROLE in bytes32
        const ADMIN = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('TIMELOCK_ADMIN_ROLE'));
        expect(await daoTimelock.hasRole(ADMIN, owner.address)).to.equal(true);
        //will check the rest after governance is deployed
    });
    //transfer 1B to DAO Timelock
    it("transfer 1B to DAO Timelock", async function () {
        await leader.transfer(daoTimelock.address, ethers.utils.parseEther("1000000000"));
        expect(await leader.balanceOf(daoTimelock.address)).to.equal(ethers.utils.parseEther("1000000000"));
    });
});


//Deploy DaoleGov
//Set DaoGov as Proposer and Executor
//Revoke owner as admin from timelock


// 3. Close Whitelist:
//After close time test all the onlyOpen functions don't run
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