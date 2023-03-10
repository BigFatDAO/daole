//launch script for deploying the daosystem
// npx hardhat run --network localhost scripts/deploy.js

const hre = require("hardhat");
const path = require('path');

async function main() {
  // get a deployer address and 10 members addresses
  const [deployer, member1, member2, member3, member4, member5, member6, member7, member8, member9, member10] = await hre.ethers.getSigners();

  //deploy timelock
  const TimeLock = await hre.ethers.getContractFactory("TimeLock");
  const timeLock = await TimeLock.deploy();
  await timeLock.deployed();
  console.log("TimeLock deployed to:", timeLock.address);
  //save to the frontend
  saveFrontendFiles("TimeLock", timeLock);
  //get gas used
  const timeLockGasUsed = await timeLock.deployTransaction.wait();
  console.log("TimeLock gas used:", timeLockGasUsed.gasUsed.toString());

  //deploy WhiteList
  const WhiteList = await hre.ethers.getContractFactory("WhiteList");
  const whiteList = await WhiteList.deploy();
  await whiteList.deployed();
  console.log("WhiteList deployed to:", whiteList.address);
  //save to the frontend
  saveFrontendFiles("WhiteList", whiteList);
  //get gas used
  const whiteListGasUsed = await whiteList.deployTransaction.wait();
  console.log("WhiteList gas used:", whiteListGasUsed.gasUsed.toString());

  //get deployed contract size
  const whiteListContractSize = await hre.ethers.provider.getCode(whiteList.address);
  console.log("WhiteList contract size:", whiteListContractSize.length);

  //add members to WhiteList
  await whiteList.addToWhiteList(member1.address);
  await whiteList.addToWhiteList(member2.address);
  await whiteList.addToWhiteList(member3.address);
  await whiteList.addToWhiteList(member4.address);
  await whiteList.addToWhiteList(member5.address);
  await whiteList.addToWhiteList(member6.address);

  //log member 1 address
  console.log("Member 1 address:", member1.address);

  // deploy leader
  const Leader = await hre.ethers.getContractFactory("Leader");
  const leader = await Leader.deploy(whiteList.address, timeLock.address);
  await leader.deployed();
  console.log("Leader deployed to:", leader.address);
  //save to the frontend
  saveFrontendFiles("Leader", leader);
  //get the deployed contract size
  const leaderBytecode = await hre.ethers.provider.getCode(leader.address);
  console.log("Leader contract size:", leaderBytecode.length);
  //get gas used for deployment
  const leaderGasUsed = await leader.deployTransaction.gasLimit;
  console.log("Leader gas used:", leaderGasUsed.toString());



  //get club factory address and deploy club factory
  const clubFactoryAddress = await leader.clubFactoryAddress();

  //get voting address
  const votingAddress = await leader.votingAddress();
  //get voting contract at above address
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.attach(votingAddress);

  // save voting and voting address to frontend
  saveFrontendFiles("Voting", voting);

  //pass the club factory address to the whitelist
  await whiteList.addClubFactoryAddress(clubFactoryAddress);

  //pass the leader address to the club timeLock
  await timeLock.setLeader(leader.address);

  console.log("are we here?");
  //let whitelisted members create their clubs
  await whiteList.connect(member1).createClub();
  await whiteList.connect(member2).createClub();
  await whiteList.connect(member3).createClub();
  await whiteList.connect(member4).createClub();
  await whiteList.connect(member5).createClub();
  await whiteList.connect(member6).createClub();

  console.log("Clubs created");

  // save club artifact to frontend
  const clubArtifact = artifacts.readArtifactSync("Club");
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }
  fs.writeFileSync(
    path.join(contractsDir, "Club.json"),
    JSON.stringify(clubArtifact, null, 2)
  );

  // function to save to frontend
  function saveFrontendFiles(contractName, contract) {
    const fs = require("fs");
    const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir);
    }
  
    fs.writeFileSync(
      path.join(contractsDir, contractName+"-address.json"),
      JSON.stringify({ Address: contract.address }, undefined, 2)
    );
  
    const contractArtifact = artifacts.readArtifactSync(contractName);
  
    fs.writeFileSync(
      path.join(contractsDir, contractName + ".json"),
      JSON.stringify(contractArtifact, null, 2)
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


