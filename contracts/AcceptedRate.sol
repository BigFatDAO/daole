// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import './PriceConsumerV3.sol';

interface IDaoleONEOracle {  
    function consult(address token, uint amountIn) external view returns (uint amountOut);

    function update() external;
}

interface IPriceConsumerV3 {
    function getLatestPrice() external view returns (int);
}

contract AcceptedRate {
    // acceptedRate is the price of DAOLE in USD to 6 decimal places
    uint256 public acceptedRate;
    uint256 public lastUpdated;

    address public daoleONEOracle;
    address public priceConsumerV3;

    address public daole;

    address public owner;
    bool public paused;

    event AcceptedRateChanged(uint256 acceptedRate, uint256 timeChanged);

    constructor (address _daole, address _daoleONEOracle, address _priceConsumerV3) {
        acceptedRate = 100000;
        lastUpdated = block.timestamp;
        daoleONEOracle = _daoleONEOracle;
        priceConsumerV3 = _priceConsumerV3;
        daole = _daole;
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    // use a chainlink oracle to get price of ONE token in USD
    function usdPerONE () internal view returns (int) {
        // get the price of ONE in USD x 1e8
        return IPriceConsumerV3(priceConsumerV3).getLatestPrice();
        // return the price of ONE in USD
    }

    // use the uniswapV2 router to get the price of DAOLE in ONE
    function onePerDaole () internal view returns (uint256) {
        return IDaoleONEOracle(daoleONEOracle).consult(daole, 1e18);
    }

    // updates the accepted rate, this can only be updated once per the period set in DaoleONEOracle contract
    // this is pausable in case of error in one of the oracles
    function update () public returns (uint256) {
        require(!paused, "Pausable: paused");
        IDaoleONEOracle(daoleONEOracle).update();
        
        uint256 onePDaole = onePerDaole();
        int usdONE = usdPerONE();
        
        // calculate the price of DAOLE in USD
        uint256 daolePrice = uint256(usdONE) * onePDaole / 1e18;
        // if the price of DAOLE is more than 90% of the accepted rate, double the accepted rate
        if (daolePrice > acceptedRate * 9 / 10) {
            acceptedRate = acceptedRate * 2;
            lastUpdated = block.timestamp;
            emit AcceptedRateChanged(acceptedRate, lastUpdated);
        }
        // returns the accepted rate x 1e8
        return acceptedRate;
    }



    // pause the contract in case of error in one of the oracles
    function pause () public onlyOwner {
        paused = true;
    }

    // unpause the contract
    function unpause () public onlyOwner {
        paused = false;
    }

    // manual reset of the accepted rate - only to be used in case of error in one of the oracles
    function overrideAcceptedRate (uint256 _acceptedRate) public onlyOwner {
        acceptedRate = _acceptedRate;
        lastUpdated = block.timestamp;
        emit AcceptedRateChanged(acceptedRate, lastUpdated);
    }

    // transfer ownership of the contract - intended to be transferred to the DAO
    function transferOwnership (address newOwner) public onlyOwner {
        owner = newOwner;
    }
    
}

