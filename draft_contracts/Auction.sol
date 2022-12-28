// SPDX license identifier: MIT

pragma solidity ^0.8.0;

// this contract sends an NFT to the 100 highest bidders, and sends the rest of the bids back to the bidders

contract Auction {
    address public whiteList;
    address public nftContract;
    uint256 public nftId;
    uint256 public auctionEndTime;
    mapping 

}