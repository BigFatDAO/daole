// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract AcceptedPrice {
    uint256 public acceptedPrice;
    mapping(uint => uint) public priceByDate;
    
}
// display accepted price

// recalculate AP - emit event

// limited functionality:
    // change get exchange rate contract
    // Manually rollback X days
    // Pause/resume

