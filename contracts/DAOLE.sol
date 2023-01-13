// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Daole is ERC20, ERC20Burnable {
    uint256 public constant MAX_SUPPLY = 10000000000 * 10 ** 18;
    constructor() ERC20("Daole", "DAOLE") {
        _mint(msg.sender, 5000000000 * 10 ** decimals());
    }
}