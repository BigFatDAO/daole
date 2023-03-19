// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WOne is ERC20 {
    uint256 public constant MAX_SUPPLY = 10000000000 * 10 ** 18;
    constructor() ERC20("Wrapped ONE", "WONE") {
        _mint(msg.sender, 50000 * 10 ** decimals());

    }
}