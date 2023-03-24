// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract DaoTimelock is TimelockController {
    constructor(uint256 minDelay, address[] memory proposers, address[] memory executors, address _admin)
        TimelockController(minDelay, proposers, executors, _admin)
    {}
}