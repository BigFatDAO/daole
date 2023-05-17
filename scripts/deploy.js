// Deploy the contracts. We'll need to put a delay in here to do the second half of the deployment. Or do it manually.
//deploy command: npx hardhat run --network localhost scripts/deploy.js

const path = require("path");
const { ethers } = require("hardhat");

//get signers, deploy existing contracts (WONE, UniswapV2Factory, UniswapV2Router02)
async function main() {
  //wL = Whitelisted accounts, m = Members, p = public, not members
  [owner, wL1, wL2, wL3, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, p1, p2, p3] = await ethers.getSigners();

  //Localnet only:
  //deploy WONE
  const WOne = await ethers.getContractFactory("WOne");
  wOne = await WOne.deploy();
  await wOne.deployed();
  console.log("WOne deployed to:", wOne.address);
  saveFrontendFiles("WOne", wOne);

  //deploy UniswapFactory
  const UniswapFactory = await ethers.getContractFactory("UniswapFactory");
  uniswapFactory = await UniswapFactory.deploy();
  await uniswapFactory.deployed();
  console.log("UniswapFactory deployed to:", uniswapFactory.address);
  saveFrontendFiles("UniswapFactory", uniswapFactory);

  //deploy UniswapRouter
  const UniswapRouter = await ethers.getContractFactory("UniswapRouter");
  uniswapRouter = await UniswapRouter.deploy(
    uniswapFactory.address,
    wOne.address
  );
  await uniswapRouter.deployed();
  console.log("UniswapRouter deployed to:", uniswapRouter.address);
  saveFrontendFiles("UniswapRouter", uniswapRouter);

  // 1. Deploy Whitelist.
  const WhiteList = await ethers.getContractFactory("WhiteList");
  whiteList = await WhiteList.deploy(
    uniswapRouter.address,
    uniswapFactory.address,
    wOne.address
  );
  await whiteList.deployed();
  console.log("WhiteList deployed to:", whiteList.address);
  saveFrontendFiles("WhiteList", whiteList);

  // 2. Deploy Timelock.
  const TimeLock = await ethers.getContractFactory("TimeLock");
  timeLock = await TimeLock.deploy();
  await timeLock.deployed();
  console.log("TimeLock deployed to:", timeLock.address);
  saveFrontendFiles("TimeLock", timeLock);

  // 3. Deploy Leader
  const Leader = await ethers.getContractFactory("Leader");
  //deploy leader with timelock, whitelist, and owner, mint 500M to owner (dev1)
  leader = await Leader.deploy(
    whiteList.address,
    timeLock.address,
    owner.address,
    ethers.utils.parseEther("500000000")
  );
  await leader.deployed();
  console.log("Leader deployed to:", leader.address);
  saveFrontendFiles("Leader", leader);

  // 4. get voting, clubfactory and performance addresses from leader and bind them to the contracts
  const votingAddress = await leader.votingAddress();
  voting = await ethers.getContractAt("Voting", votingAddress);
  console.log("Voting deployed to:", voting.address);
  saveFrontendFiles("Voting", voting);

  const clubFactoryAddress = await leader.clubFactoryAddress();
  clubFactory = await ethers.getContractAt("ClubFactory", clubFactoryAddress);
  console.log("ClubFactory deployed to:", clubFactory.address);
  saveFrontendFiles("ClubFactory", clubFactory);

  const performanceAddress = await leader.performance();
  performance = await ethers.getContractAt("Performance", performanceAddress);
  console.log("Performance deployed to:", performance.address);
  saveFrontendFiles("Performance", performance);

  // 5. Deploy YieldFarm
  const YieldFarm = await ethers.getContractFactory("YieldFarm");
  //deploy YieldFarm with timelock, whitelist, and owner, mint 500M to owner (dev1)
  yieldFarm = await YieldFarm.deploy(whiteList.address);
  await yieldFarm.deployed();
  console.log("YieldFarm deployed to:", yieldFarm.address);
  saveFrontendFiles("YieldFarm", yieldFarm);

  //      1. add yieldfarm and clubFactory to whitelist
  await whiteList.addLeaderAddress(leader.address);
  await whiteList.addClubFactoryAddress(clubFactory.address);
  await whiteList.addYieldFarmAddress(yieldFarm.address);

  // timelock sets leader
  await timeLock.setLeader(leader.address);

  //dev deposits tokens in timeLock
  //increase allowance
  await leader
    .connect(owner)
    .increaseAllowance(timeLock.address, ethers.utils.parseEther("500000000"));
  //deposit in timeLock
  await timeLock
    .connect(owner)
    .deposit(owner.address, ethers.utils.parseEther("500000000"), 185);

  //Deploy DaoTimelock - may or may not just remove this
  const DaoTimelock = await ethers.getContractFactory("DaoTimelock");
  daoTimelock = await DaoTimelock.deploy(
    7 * 24 * 60 * 60,
    [owner.address],
    [owner.address],
    owner.address
  );
  await daoTimelock.deployed();
  console.log("DaoTimelock deployed to:", daoTimelock.address);
  saveFrontendFiles("DaoTimelock", daoTimelock);

  //transfer 1B to DAO Timelock
  await leader.transfer(
    daoTimelock.address,
    ethers.utils.parseEther("1000000000")
  );

  //Deploy DaoleGov
  const DaoleGov = await ethers.getContractFactory("DaoleGov");
  daoleGov = await DaoleGov.deploy(leader.address, daoTimelock.address);
  await daoleGov.deployed();
  console.log("DaoleGov deployed to:", daoleGov.address);
  saveFrontendFiles("DaoleGov", daoleGov);

  //Set DaoGov as Proposer and Executor & Revoke owner as admin from timelock
  //grant proposer role
  const PROPOSER = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("PROPOSER_ROLE")
  );
  await daoTimelock.grantRole(PROPOSER, daoleGov.address);
  //grant executor role
  const EXECUTOR = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("EXECUTOR_ROLE")
  );
  await daoTimelock.grantRole(EXECUTOR, daoleGov.address);

  //revoke proposer role
  await daoTimelock.revokeRole(PROPOSER, owner.address);
  //revoke executor role
  await daoTimelock.revokeRole(EXECUTOR, owner.address);
  //revoke admin role
  const ADMIN = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("TIMELOCK_ADMIN_ROLE")
  );
  await daoTimelock.revokeRole(ADMIN, owner.address);

/*
  // 3. Close Whitelist:
  //get whitelist close time
  const closeTime = await whiteList.closeTime();
  //advance the evm past that time
  await ethers.provider.send("evm_increaseTime", [closeTime.toNumber()]);
  await ethers.provider.send("evm_mine", []);

  // 4. Create LP
  await whiteList.createPair();
  const lPAddress = await whiteList.liquidityPair();
  liquidityPair = await ethers.getContractAt("LP", lPAddress);
  console.log("LP deployed to:", liquidityPair.address);
        saveFrontendFiles("LP", liquidityPair);

  //initialize yield farm
  await whiteList.initializeYieldFarm();
*/
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

//function to save contract addresses to a file in frontend
function saveFrontendFiles(contractName, contract) {
  const fs = require("fs");
  const contractsDir = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "contracts"
  );

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, contractName + "-address.json"),
    JSON.stringify({ Address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(contractName);

  fs.writeFileSync(
    path.join(contractsDir, contractName + ".json"),
    JSON.stringify(contractArtifact, null, 2)
  );
}
