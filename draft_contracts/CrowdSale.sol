// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

//get code for installing openzeppelin contracts is as follows:
//npm install @openzeppelin/contracts

contract DaoleNFTs is ERC721 {
    uint256 public price;
    uint256 public tokenCounter;
    address payable public owner;
    //max supply
    uint256 public maxSupply;
    

    constructor(uint256 _price, uint256 _maxSupply) ERC721("Daole NFTs", "DNFT") {
        price = _price;
        maxSupply = _maxSupply;
        tokenCounter = 0;
        owner = payable(msg.sender);
    }

// every mint is an auction that lasts a week


    function withdraw() public {
        require(msg.sender == owner, "You are not the owner");
        uint256 balance = address(this).balance;
        owner.transfer(balance);
    }
}

