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
    console.log("Before: ");
    //wL = Whitelisted accounts, m = Members, p = public, not members
    [owner, wL1, wL2, wL3, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, p1, p2, p3] = await ethers.getSigners();

    //deploy WONE
    const WOne = await ethers.getContractFactory("WOne");
    wOne = await WOne.deploy();
    await wOne.deployed();
    console.log("WOne deployed to:", wOne.address);

    //deploy UniswapFactory
    const UniswapFactory = await ethers.getContractFactory("UniswapFactory");
    uniswapFactory = await UniswapFactory.deploy();
    await uniswapFactory.deployed();
    console.log("UniswapFactory deployed to:", uniswapFactory.address);

    //deploy UniswapRouter
    const UniswapRouter = await ethers.getContractFactory("UniswapRouter");
    uniswapRouter = await UniswapRouter.deploy(uniswapFactory.address, wOne.address);
    await uniswapRouter.deployed();
    console.log("UniswapRouter deployed to:", uniswapRouter.address);
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
        //can't refund twice
        await expect(whiteList.connect(wL1).refund()).to.be.revertedWith("not whitelisted");
        //add back wL1 for later tests and add wL3 too
        await whiteList.connect(wL1).addToWhiteList(wL1.address, {value: ethers.utils.parseEther("1000")});
        await whiteList.connect(wL3).addToWhiteList(wL3.address, {value: ethers.utils.parseEther("1000")});
    });

    it("check there are 3 clubs", async function () {
        expect(await whiteList.totalClubs()).to.equal(3);
    });
    it("onlyClosed functions won't run", async function () {
        //can't transfer to clubFactory
        await expect(whiteList.transferToClubFactory()).to.be.revertedWith("too early")
        //can't create club
        await expect(whiteList.connect(wL1).createClub()).to.be.revertedWith("too early")
        await expect(whiteList.createPair()).to.be.revertedWith("too early")
        await expect(whiteList.initializeYieldFarm()).to.be.revertedWith("too early") 
    });
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
describe("Whitelist adds Leader, YieldFarm and ClubFactory", function () {
    it("Should add Leader, YieldFarm and ClubFactory", async function () {
        //non owner can't add
        await expect(whiteList.connect(wL2).addLeaderAddress(leader.address)).to.be.revertedWith("not owner");
        await expect(whiteList.connect(wL2).addClubFactoryAddress(clubFactory.address)).to.be.revertedWith("not owner");
        await expect(whiteList.connect(wL2).addYieldFarmAddress(yieldFarm.address)).to.be.revertedWith("not owner");
        //owner can add
        await whiteList.addLeaderAddress(leader.address);
        await whiteList.addClubFactoryAddress(clubFactory.address);
        await whiteList.addYieldFarmAddress(yieldFarm.address);
        //check that the addresses are added
        expect(await whiteList.leader()).to.equal(leader.address);
        expect(await whiteList.clubFactoryAddress()).to.equal(clubFactory.address);
        expect(await whiteList.yieldFarmAddress()).to.equal(yieldFarm.address);
        //cant add twice
        await expect(whiteList.addLeaderAddress(leader.address)).to.be.revertedWith("Already set");
        await expect(whiteList.addClubFactoryAddress(clubFactory.address)).to.be.revertedWith("Already set");
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
        expect(await leader.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1000000000"));
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
        //check owner balance
        expect(await leader.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1000000000"));
        await leader.transfer(daoTimelock.address, ethers.utils.parseEther("1000000000"));
        //owner balance should be 0
        expect(await leader.balanceOf(owner.address)).to.equal(0);
        expect(await leader.balanceOf(daoTimelock.address)).to.equal(ethers.utils.parseEther("1000000000"));
    });
});

//Deploy DaoleGov
describe("Deploy DaoleGov", function () {
    it("Should deploy the DaoleGov", async function () {
        const DaoleGov = await ethers.getContractFactory("DaoleGov");
        daoleGov = await DaoleGov.deploy(leader.address, daoTimelock.address);
        await daoleGov.deployed();
        console.log("DaoleGov deployed to:", daoleGov.address);
        //gas cost
        console.log("Gas cost of DaoleGov:", (await ethers.provider.getTransactionReceipt(daoleGov.deployTransaction.hash)).gasUsed.toString());
    });

    it("constructor", async function () {
        //check token
        expect(await daoleGov.token()).to.equal(leader.address);
        //check timelock
        expect(await daoleGov.timelock()).to.equal(daoTimelock.address);
    });
});

//Set DaoGov as Proposer and Executor & Revoke owner as admin from timelock
describe("Set up dao timelock", function () {
    it("add governance as proposer and executor", async function () {
        //grant proposer role
        const PROPOSER = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('PROPOSER_ROLE'));
        await daoTimelock.grantRole(PROPOSER, daoleGov.address);
        expect(await daoTimelock.hasRole(PROPOSER, daoleGov.address)).to.equal(true);
        //grant executor role
        const EXECUTOR = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('EXECUTOR_ROLE'));
        await daoTimelock.grantRole(EXECUTOR, daoleGov.address);
        expect(await daoTimelock.hasRole(EXECUTOR, daoleGov.address)).to.equal(true);
    });

    it("revoke owner as proposer, executer and admin", async function () {
        //revoke proposer role
        const PROPOSER = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('PROPOSER_ROLE'));
        await daoTimelock.revokeRole(PROPOSER, owner.address);
        expect(await daoTimelock.hasRole(PROPOSER, owner.address)).to.equal(false);
        //revoke executor role
        const EXECUTOR = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('EXECUTOR_ROLE'));
        await daoTimelock.revokeRole(EXECUTOR, owner.address);
        expect(await daoTimelock.hasRole(EXECUTOR, owner.address)).to.equal(false);
        //revoke admin role
        const ADMIN = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('TIMELOCK_ADMIN_ROLE'));
        await daoTimelock.revokeRole(ADMIN, owner.address);
        expect(await daoTimelock.hasRole(ADMIN, owner.address)).to.equal(false);
    });
    it("check owner can't do stuff", async function () {
        //check owner can't add proposer
        const PROPOSER = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('PROPOSER_ROLE'));
        await expect(daoTimelock.connect(owner).grantRole(PROPOSER, owner.address)).to.be.reverted;
    });
});

// 3. Close Whitelist:
describe("Close whitelist", function () {
    //get whitelist close time and advance the evm past that time
    it("go past close time", async function () {
        //get whitelist close time
        const closeTime = await whiteList.closeTime();
        //advance the evm past that time
        await ethers.provider.send("evm_increaseTime", [closeTime.toNumber()]);
        await ethers.provider.send("evm_mine", []);
    });


    it("check onlyOpen functions", async function () {
        //check can no longer join whitelist
        await expect(whiteList.connect(m1).addToWhiteList(m1.address,{value: ethers.utils.parseEther("1000")})).to.be.revertedWith("too late");
        //can't refund
        await expect(whiteList.connect(wL1).refund()).to.be.revertedWith("too late");
        //owner can't delay close time
        await expect(whiteList.connect(owner).delayCloseTime(100)).to.be.revertedWith("too late");
    });

    it("check onlyClosed club creation", async function () {
        //revert when whitelist hasn't transferred Daole to ClubFactory
        await expect(whiteList.connect(wL1).createClub()).to.be.revertedWith("Not transferred");
        //check club is zero address
        expect(await leader.clubOfMember(wL1.address)).to.equal(ethers.constants.AddressZero);
        //check whitelist balance
        expect(await leader.balanceOf(whiteList.address)).to.equal(ethers.utils.parseEther("4000000000"));
        //transfer to clubFactory
        await whiteList.transferToClubFactory()
        //check whitelist balance
        expect(await leader.balanceOf(whiteList.address)).to.equal(ethers.utils.parseEther("3997000000"));
        //check clubFactory balance
        expect(await leader.balanceOf(clubFactory.address)).to.equal(ethers.utils.parseEther("3000000"));
        //check wL1 can create club
        await whiteList.connect(wL1).createClub();
        //check club is not zero address
        expect(await leader.clubOfMember(wL1.address)).to.not.equal(ethers.constants.AddressZero);
        //get club address
        wL1ClubAddress = await leader.clubOfMember(wL1.address);
        //check can't call twice
        await expect(whiteList.connect(wL1).createClub()).to.be.revertedWith("not whitelisted");
        //check club balance
        expect(await leader.balanceOf(wL1ClubAddress)).to.equal(ethers.utils.parseEther("1000000"));
    });

    it("create LP", async function () {
        //initializeYieldFarm should revert before pair is created
        await expect(whiteList.initializeYieldFarm()).to.be.revertedWith("no pair")
        expect(await whiteList.router()).to.equal(uniswapRouter.address);
        await whiteList.createPair()
        //check LP address is not zero
        expect(await whiteList.liquidityPair()).to.not.equal(ethers.constants.AddressZero);
    });
    it("initialize Yield Farm", async function () {
        //initialize yield farm
        await whiteList.initializeYieldFarm();
        //check all the rewards durations and stuff
        expect(await yieldFarm.duration()).to.equal(7*365*24*60*60);
    });
    it("Set up done", async function () {
        console.log("System is up but not thoroughly tested")
    });
});
//test the yield farm 
describe("Test YieldFarm", function () {
    it("buy some tokens", async function () {
        //p1 buys 1000 tokens
        const deadline = (await ethers.provider.getBlock("latest")).timestamp + 1000;
        await uniswapRouter.connect(p1).swapExactETHForTokens(0, [wOne.address, leader.address], p1.address, deadline, {value: ethers.utils.parseEther("100")});
        //check p1 balance
        p1Balance = await leader.balanceOf(p1.address);
        console.log("p1 balance: ", ethers.utils.formatEther(p1Balance));
    });

    it("get LP", async function () {
        //get LP address
        const lPAddress = await whiteList.liquidityPair();
        liquidityPair = await ethers.getContractAt("LP", lPAddress);
    });



    it("add liquidity", async function () {
        //p1 adds liquidity
        await leader.connect(p1).approve(uniswapRouter.address, p1Balance);
        const deadline = (await ethers.provider.getBlock("latest")).timestamp + 1000;
        await uniswapRouter.connect(p1).addLiquidityETH(leader.address, p1Balance, 0, 0, p1.address, deadline, {value: ethers.utils.parseEther("100")});
        //check p1 LP balance
        const p1LPBalance = await liquidityPair.balanceOf(p1.address);
        console.log("p1 LP balance: ", ethers.utils.formatEther(p1LPBalance));
        //p1 approves yield farm
        await liquidityPair.connect(p1).approve(yieldFarm.address, p1LPBalance);
        //p1 stakes LP
        await yieldFarm.connect(p1).stake(p1LPBalance);
        //p1 tries to stake more than they have
        await expect(yieldFarm.connect(p1).stake(p1LPBalance)).to.be.reverted;
        //check balance after a week
        await ethers.provider.send("evm_increaseTime", [24*60*60]);
        await ethers.provider.send("evm_mine", []);
        await yieldFarm.connect(p1).getReward();
        p1Balance = await leader.balanceOf(p1.address);
        console.log("p1 balance after a week: ", ethers.utils.formatEther(p1Balance));
        //p2 tries to withdraw
        await expect(yieldFarm.connect(p2).withdraw(ethers.utils.parseEther("100"))).to.be.reverted;
        //p1 withdrawals
        await yieldFarm.connect(p1).withdraw(p1LPBalance);
        expect(await liquidityPair.balanceOf(p1.address)).to.equal(p1LPBalance);
    });
});

//clearly needs the whitelist to stake a bit to be burned


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