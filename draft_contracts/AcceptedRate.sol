// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import './PriceConsumerV3.sol';


contract AcceptedRate is PriceConsumerV3 {
    uint256 public acceptedRate;
    uint256 public lastUpdated;

// use a chainlink oracle to get price of ONE token in USD
// *handled in PriceConsumerV3.sol

// use the uniswapV2 router to get the price of DAOLE in ONE

// calculate the price of DAOLE in USD

// set the acceptedRate to the price of DAOLE in USD
// if price is more than 90% of the acceptedRate, double the accepted rate

    
}

