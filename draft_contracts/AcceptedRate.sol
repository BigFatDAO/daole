// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import './PriceConsumerV3.sol';

interface IDaoleONEOracle {
    function consult(address token, uint amountIn) external view returns (uint amountOut);
}

interface IPriceConsumerV3 {
    function getLatestPrice() external view returns (int);
}

contract AcceptedRate {
    uint256 public acceptedRate;
    uint256 public lastUpdated;

// set addresses for interfaces, don't forget to make functions to update them if required

constructor (address _daoleONEOracle, address _priceConsumerV3) {
    acceptedRate = 0;
    lastUpdated = 0;
}

// use a chainlink oracle to get price of ONE token in USD
// *handled in PriceConsumerV3.sol

// use the uniswapV2 router to get the price of DAOLE in ONE
function daolePerONE () public view returns (uint256) {
    // get the price of DAOLE in ONE
    IDaoleONEOracle()
    // return the price of DAOLE in ONE
}

// calculate the price of DAOLE in USD

// set the acceptedRate to the price of DAOLE in USD
// if price is more than 90% of the acceptedRate, double the accepted rate

    
}

