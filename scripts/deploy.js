//launch script for deploying the daosystem
// npx hardhat run --network localhost scripts/deploy.js

const hre = require("hardhat");
const path = require('path');

async function main() {
  // get a deployer address and 10 members addresses
  const [deployer, member1, member2, member3, member4, member5, member6, member7, member8, member9, member10] = await hre.ethers.getSigners();

  //deploy WhiteList
  const WhiteList = await hre.ethers.getContractFactory("WhiteList");
  const whiteList = await WhiteList.deploy();
  await whiteList.deployed();
  console.log("WhiteList deployed to:", whiteList.address);
  //save to the frontend
  saveFrontendFiles("WhiteList", whiteList);

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
  const leader = await Leader.deploy(whiteList.address);
  await leader.deployed();
  console.log("Leader deployed to:", leader.address);
  //save to the frontend
  saveFrontendFiles("Leader", leader);

  //get sub factory address and deploy sub factory
  const subFactoryAddress = await leader.subFactoryAddress();

  //get voting address
  const votingAddress = await leader.votingAddress();
  //get voting contract at above address
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.attach(votingAddress);

  // save voting and voting address to frontend
  saveFrontendFiles("Voting", voting);

  
  //let whitelisted members create their subs
  await whiteList.connect(member1).createSub(subFactoryAddress);
  await whiteList.connect(member2).createSub(subFactoryAddress);
  await whiteList.connect(member3).createSub(subFactoryAddress);
  await whiteList.connect(member4).createSub(subFactoryAddress);
  await whiteList.connect(member5).createSub(subFactoryAddress);
  await whiteList.connect(member6).createSub(subFactoryAddress);

  console.log("Subs created");

  // save subdao artifact to frontend
  const subDAOArtifact = artifacts.readArtifactSync("SubDAO");
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }
  fs.writeFileSync(
    path.join(contractsDir, "SubDAO.json"),
    JSON.stringify(subDAOArtifact, null, 2)
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


