// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
interface IVoting {
    //still need to add getters
    function createVote(address _candidate, uint _grantAmount, address _suggestedBy) external;

    // function accept() external;

    function vote(address _candidate, address _voter, int8 _vote) external;

    function finishVote(address _candidate) external;

    // function opens(address _club) external view returns (address[] memory);
}

interface IClub {
    //still need to add getters
    function createVote(address _candidate, uint _grantAmount) external;

    function vote (address _candidate, int8 _vote) external;

    function passVote(address _candidate, uint _grant) external;

    function payMembers() external;

    function getMembers () external view returns (address[] memory);
}

interface IClubFactory {
    //check if getters are needed
    function createClub(address _member1, address _addedBy) external;

    // function getNumberOfClubs(address _owner) external view returns (uint256);
}

interface ILeader is IERC20{
    function clubFactoryAddress() external view returns (address);

    function votingAddress() external view returns (address);

    function whiteList() external view returns (address);

    function performance() external view returns (address);
    
    function finishCreation(address _member1, address _club, address _addedBy) external;

    function payClubs() external;

    function addToAllMembers(address _memberAddress, address _addedBy, address _club) external;

    // function clubOfMember(address _member) external view returns (address);

    // function getAddedBy(address _member) external view returns (address);

    function isClub(address _club) external view returns (bool);

}

//make a whitelist interface
interface IPerformance {
    function addPerformance(uint _amount, address _addedBy, address _club) external;

    function getPayment(uint _monthlyGrants, address _club) external view returns (uint);

    function getPerformance(address _club, uint256 _month) external view returns (uint);

    function getCurrentMonth() external view returns (uint);
}

interface ITimeLock {
    // function setLeader(address _leader) external;

    function deposit(address _member, uint256 _amount) external;

    function withdraw() external;

    // function getBalance(address _member) external view returns (uint256);

    // function getReleaseTime(address _member) external view returns (uint256);
}


