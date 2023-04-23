// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

///@title Yield Farming interface

interface IYieldFarm {
    function setTokens(address _stakingToken, address _rewardToken) external;

    function setRewardsDuration(uint _duration) external;

    function notifyRewardAmount(uint _amount) external;

    function stake(uint _amount) external;

    function getReward() external;
}

interface IUniswapV2Router02 {
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
}

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}