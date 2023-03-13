// Testing the contracts in isolation first, then testing the whole system

const { expect } = require('chai');
const { ethers } = require('hardhat');

const twoWeeks = 60*60*24*14
const oneMonth = 60*60*24*28
const hundredDays = 60*60*24*100
const sixMonths = 60*60*24*7*26
const memberMint = 1125000
const clubMint = 2250000

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