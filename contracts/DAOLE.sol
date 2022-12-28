// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Daole is ERC20 {

    uint public maxSupply;
    address public leader;

    constructor(uint initialSupply, uint _maxSupply) ERC20 ("Daole", "DAOLE"){
        _mint(msg.sender, initialSupply);
        maxSupply = _maxSupply;
        leader = msg.sender;
    }


}