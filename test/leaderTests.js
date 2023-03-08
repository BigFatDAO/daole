// Testing the contracts in isolation first, then testing the whole system
// This is a test file for the Leader contract
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Leader', function () {
    it('Should deploy the contract', async function () {
        const Leader = await ethers.getContractFactory('Leader');
        const leader = await Leader.deploy();
        await leader.deployed();
        expect(await leader.address).to.properAddress;
    });
});


