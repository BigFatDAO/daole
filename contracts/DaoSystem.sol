// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import './DAOLE.sol';
/// @title Eth Club 7
/// @author Mr Nobody
/// @notice Creates a system of DAOs to allocate grants

contract Voting {
    /// @notice This contract stores the candidate info and executes voting
    
    struct candidate {
        bool open;
        bool accepted;
        int8 votes;
        uint creationTime;
        uint grantAmount;
        address subDAO;
        mapping (address => bool) vote;
    }

    mapping(address => candidate) public candidates;

    mapping(address => address[]) openCandidates;

    Leader leader;
    TimeLock timeLock;

    event VoteCreated(address indexed _suggestedBy, address indexed _candidate, uint _time);
    event Voted(address indexed _member, address indexed _candidate, int8 _vote, uint _time);
    event VoteCompleted(address indexed _candidate, bool indexed _accepted, uint _time);

    constructor(address _leader, address _timeLock) {
        leader = Leader(_leader);
        timeLock = TimeLock(_timeLock);
    }

    modifier onlySubs {
        require(leader.isSubDAO(msg.sender),"not a sub");
        _;
    }

/// @notice Opens a vote for a new candidate
/// @param _candidate The suggested candidate to be voted on
/// @param _grantAmount Grant size for the new candidate
/// @param _suggestedBy The member that suggested this candidate

    function createVote(address _candidate, uint _grantAmount, address _suggestedBy) public onlySubs {
        require(_candidate != address(leader), "no leader");
        require(!leader.isSubDAO(_candidate),"no subs");
        require(leader.subOfMember(_candidate)==address(0),"is member");
        require(!candidates[_candidate].open, "already been suggested");
        // some of these values need to be set to 0 or false because they may have already been a candidate
        candidates[_candidate].open = true;
        candidates[_candidate].accepted = false;
        candidates[_candidate].creationTime = block.timestamp;
        candidates[_candidate].grantAmount = _grantAmount;
        candidates[_candidate].subDAO = msg.sender;
        candidates[_candidate].votes = 0;

        openCandidates[msg.sender].push(_candidate);

        emit VoteCreated(_suggestedBy, _candidate, block.timestamp);
    }

/// @notice Candidate must accept before becoming a member
/// @dev If the new member is a contract, you must build a function for it to accept
    function accept() public {
        require(candidates[msg.sender].open == true, "not open");
        candidates[msg.sender].accepted = true;
    } 

/// @notice Adds the votes for a candidate
/// @param _candidate The suggested candidate to be voted on
/// @param _voter the member voting
/// @param _vote the vote, +1 or -1
    function vote(address _candidate, address _voter, int8 _vote) public onlySubs {
        require(!candidates[_candidate].vote[_voter],"voted");
        require(_vote == 1 || _vote == -1, "vote not right");
        require(candidates[_candidate].open, "not open");
        candidates[_candidate].votes += _vote;
        candidates[_candidate].vote[_voter]=true;

        emit Voted(_voter, _candidate, _vote, block.timestamp);
    }

/// @notice Closes the vote and adds/closes the candidate
/// @param _candidate The suggested candidate
    function finishVote(address _candidate) public onlySubs {
        require(block.timestamp > candidates[_candidate].creationTime+2 weeks, "too soon bro");
        require(candidates[_candidate].open == true, "not open");

        candidates[_candidate].open = false;

        for (uint i = 0; i < openCandidates[msg.sender].length; i++) {
            
            if(openCandidates[msg.sender][i] == _candidate) {
                delete openCandidates[msg.sender][i];

                for (uint j = i; j<openCandidates[msg.sender].length-1; j++){
                    openCandidates[msg.sender][j] = openCandidates[msg.sender][j+1];
                }
                openCandidates[msg.sender].pop();
            }
        }

        if(candidates[_candidate].votes>=1){
            require(candidates[_candidate].accepted == true, "has not accepted");
            emit VoteCompleted(_candidate, true, block.timestamp);
            // deposit the grant into the timeLock
            leader.increaseAllowance(address(timeLock), candidates[_candidate].grantAmount);
            timeLock.deposit(_candidate ,candidates[_candidate].grantAmount);

            SubDAO(candidates[_candidate].subDAO).passVote(_candidate, candidates[_candidate].grantAmount);
        } else {
            emit VoteCompleted(_candidate, false, block.timestamp);
            leader.transfer(candidates[_candidate].subDAO, candidates[_candidate].grantAmount);
        }
    }

/// @notice shows the open candidates for a sub
/// @param _subDAO The subDAO to show openCandidates for
/// @return An array of the open candidates for this sub

    function opens(address _subDAO) public view returns (address[] memory) {
        return openCandidates[_subDAO];
    }

}


///@notice The SubDAO contract that members interact with. Stores member details
contract SubDAO {
    bool locked;
    uint8 public numberOfMembers;
    address[] public members;
    mapping(address => uint256) public subMembers;

    Leader leader;
    mapping(uint256 => bool) paid;

    Voting voting;
    TimeLock timeLock;
    SubFactory subFactory;

    //Events:  
    event MemberRemoved(address indexed _member, uint _time);
    event MemberAdded(address indexed _newMember, address indexed _addedBy, uint _grantAmount, uint _time);

/// @notice constructor, sets up sub and adds the first member
/// @param _leaderAddress The address of the leader
/// @param _voting The address of the voting contract
/// @param _member The first member that will be added to the sub
/// @param _subFactory The address of the subFactory
    constructor(address _leaderAddress, address _voting, address _timeLock, address _subFactory, address _member) {
        locked = false;
        paid[block.timestamp/(4 weeks)]=true;
        leader = Leader(_leaderAddress);
        voting = Voting(_voting);
        timeLock = TimeLock(_timeLock);
        subFactory = SubFactory(_subFactory);
        members.push(_member);
        numberOfMembers = 1;
        subMembers[_member] = 1;
    }

    modifier onlyMembers {
        require(subMembers[msg.sender]>0,"not active member");
        _;
    }

    modifier onlyLeader {
        require(msg.sender == address(leader),"not leader");
        _;
    }

/// @notice Allows a member to submit a candiate to be voted on by their sub, also votes yes for them
/// @param _candidate The suggested candidate to be voted on
/// @param _grantAmount Grant size for the new candidate
    function createVote(address _candidate, uint _grantAmount) public onlyMembers {
        //make sure this contract has enough funds to pay the grant
        require(_grantAmount <= leader.balanceOf(address(this)), "not enough funds");
        // send the grant to the voting contract
        leader.transfer(address(voting), _grantAmount);  
        //create the vote
        voting.createVote(_candidate, _grantAmount, msg.sender);
        vote(_candidate, 1);
    }

/// @notice Adds the votes for a candidate
/// @param _candidate The suggested candidate to be voted on
/// @param _vote the vote, +1 or -1
    function vote (address _candidate, int8 _vote) public onlyMembers {
        voting.vote(_candidate, msg.sender, _vote);
    }


/// @notice Closes the vote and adds/closes the candidate
/// @param _candidate The suggested candidate
    function finishVote(address _candidate) public onlyMembers {
        voting.finishVote(_candidate);
    }

/// @notice called by the voting contract to add a member if the vote has passed
/// @param _candidate The suggested candidate
/// @param _grant The size of the grant
    function passVote(address _candidate, uint _grant) public {
        require(msg.sender == address(voting));
            if(members.length<7){
                members.push(_candidate);
                numberOfMembers += 1;
                subMembers[_candidate] = 1;
                leader.addToAllMembers(_candidate, address(this), address(this));
                emit MemberAdded(_candidate, address(this), _grant, block.timestamp);
            } else { 
                subFactory.createSubDAO(_candidate, address(this));
            }         
        }

/// @notice Calls the Leader contract to pay this sub
    function payMembers() public onlyMembers {
        uint256 month = block.timestamp/(4 weeks);
        require(!paid[month],"paid");
        paid[month]=true;
        leader.paySubs();
    }

    function getMembers () public view returns (address[] memory) {
        return members;
    }

}


///@notice The subFactory creates SubDAOs
contract SubFactory {
    address public leader;
    address public whiteList;
    address public timeLock;
    uint256 public numberOfSubs;

/// @notice Adds Leader and Whitelist address
/// @param _leader The Leader contract
/// @param _whiteList The Whitelist contract
    constructor (address _leader, address _whiteList, address _timeLock) {
        leader = _leader;
        whiteList = _whiteList;
        timeLock = _timeLock;
    }

/// @notice Creates a new sub
/// @param _member1 The first member of the sub
/// @param _addedBy The sub that added member1
    function createSubDAO (address _member1, address _addedBy) public {
        require(Leader(leader).isSubDAO(msg.sender) || msg.sender == whiteList);
        SubDAO subDAO = new SubDAO(leader, Leader(leader).votingAddress(),timeLock, address(this), _member1);
        Leader(leader).finishCreation(_member1, address(subDAO), _addedBy);
        if(msg.sender == whiteList) {
            Leader(leader).transfer(address(subDAO), 1125e21);
            Leader(leader).increaseAllowance(timeLock, 1125e21);
            TimeLock(timeLock).deposit(_member1, 1125e21);
        }
        numberOfSubs += 1;
    }
}


/// @notice The Leader contract calculates subs performace. Mints, transfers and burns.
contract Leader is Daole {
    address public subFactoryAddress;
    address public votingAddress;
    address public whiteList;
    address public performance;
    mapping (uint => uint) totalGrants;
    mapping (address => bool) subs;

    struct memberDeets {
        address addedBy;
        address subDAO;
    }
    mapping (address => memberDeets) members;


    event Log(string func);

/// @notice Creates subFactory and Voting contracts
/// @param _whiteList The whitelist contract address
    constructor(address _whiteList, address _timeLock) Daole() {
        whiteList = _whiteList;
        Voting voting = new Voting(address(this), _timeLock);
        votingAddress = address(voting);
        SubFactory subFactory = new SubFactory(address(this),_whiteList, _timeLock);
        subFactoryAddress = address(subFactory);
        Performance perf = new Performance(address(this));
        performance = address(perf);
        _mint(subFactoryAddress,225e24);
    }

    modifier onlySubs{
        require(subs[msg.sender],"not sub");
        _;
    }

/// @notice Adds the new sub to subs struct, mints grant to the new sub
/// @param _member1 The first member of the sub
/// @param _subDAO The sub that's just been created
/// @param _addedBy The sub that added member1
    function finishCreation(address _member1, address _subDAO, address _addedBy) public {
        require(msg.sender == subFactoryAddress,"not factory");
        subs[_subDAO] = true;
        Performance(performance).addSub();
        addToAllMembers(_member1, _addedBy, _subDAO);
//        emit SubDAOCreated(_owner, _addedBy, _grantAmount, block.timestamp);
    }

/// @notice Transfers. Adds transfers to members to their subs' performance
/// @param _to The receiver
/// @param _amount Transfer size
    function transfer(address _to, uint _amount) public override returns (bool) {
        //If reciever is a member, add volume to performance
        if(members[_to].subDAO != address(0)){
            _transfer(msg.sender, _to, _amount*98/100);
            _burn(msg.sender, _amount/50);
            Performance(performance).addPerformance(_amount, members[_to].addedBy, members[_to].subDAO);
        } else {
            _transfer(msg.sender, _to, _amount);
        }
        return true;
    }

/// @notice 4-weekly payment to subDAOs, called by the sub contracts
/// @dev can this be used to fund the initial 100 subs?
    function paySubs() public onlySubs {
        uint month = block.timestamp/(4 weeks);

        if(totalGrants[month]==0){
            totalGrants[month] = (MAX_SUPPLY - totalSupply())*4/100;
        }

        uint payment = Performance(performance).getPayment(totalGrants[month], msg.sender);

        _mint(msg.sender, payment);
    }

/// @notice Called by subs or subFactory to add members to the leader mappings
/// @param _memberAddress Member to be added
/// @param _addedBy The sub that added the member
/// @param _subDAO The sub of the member
    function addToAllMembers(
        address _memberAddress, 
        address _addedBy, 
        address _subDAO 
    ) 
        public 
    {
        require(subs[msg.sender]||msg.sender==subFactoryAddress);
        members[_memberAddress].addedBy = _addedBy;
        members[_memberAddress].subDAO = _subDAO;
    }

/// @notice Returns the sub of an address
/// @param _member The member
/// @return The sub of the member - returns zero address if not a member
    function subOfMember(address _member) public view returns (address) {
        return members[_member].subDAO;
    }

/// @notice Returns the sub that added a member
/// @param _member The member
/// @return The sub that added the member - returns zero if not a member
    function getAddedBy(address _member) public view returns (address) {
        return members[_member].addedBy;
    }

/// @notice Is the address a sub?
/// @param _subDAO The address
/// @return Is it a sub - T/F
    function isSubDAO(address _subDAO) public view returns (bool) {
        return subs[_subDAO];
    }
    
/// @notice fallback function    
        fallback() external {
        // send / transfer (forwards 2300 gas to this fallback function)
        // call (forwards all of the gas)
        emit Log("fallback");
    }
}


/// @notice WhiteListed addresses that can create their own subs
contract WhiteList{
    mapping(address => bool) whiteList;
    address public owner;
    address public subFactoryAddress;

/// @notice adds owner
    constructor(){
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(owner == msg.sender, "not owner");
        _;
    }

/// @notice adds subFactory address
/// @param _subFactoryAddress The subFactory address
    function addSubFactoryAddress(address _subFactoryAddress) public onlyOwner {
        subFactoryAddress = _subFactoryAddress;
    }

/// @notice Adds an address to the WhiteList - only owner.
/// @dev This is a placeholder. Needs to be updated to burn an NFT to add to the whitelist
/// @param _winner The address to add to the whitelist
    function addToWhiteList(address _winner) public onlyOwner {
        whiteList[_winner] = true;
    }

/// @notice Creates a sub for a whitelisted address
    function createSub() public {
        require(whiteList[msg.sender]==true,"not whitelisted");
        SubFactory(subFactoryAddress).createSubDAO(msg.sender,address(this));
    }

}

contract Performance {
    uint initialMonth;
    uint public totalSubs;
    Leader leader;
    mapping(address => mapping(uint => uint)) public subPerformance;
    mapping(uint => uint) public totalPerformance;
    
    // constructor - adds leader address
    constructor(address _leader) {
        leader = Leader(_leader);
    }

    modifier onlyLeader {
        require(msg.sender == address(leader), "not leader");
        _;
    }

    function addSub() public onlyLeader {
        totalSubs += 1;
    }

    function addPerformance(uint _amount, address _addedBy, address _subDAO) public onlyLeader {
        uint month = block.timestamp/(4 weeks);
        
        subPerformance[_addedBy][month+1] += (_amount/2);
        subPerformance[_subDAO][month+1] += (_amount/2);
                
        totalPerformance[month+1] += (_amount);
    }

    function getPayment(uint _monthlyGrants, address _subDAO) public view returns (uint) {
        uint month = block.timestamp/(4 weeks);

        if(totalPerformance[month] == 0){
            return _monthlyGrants / totalSubs;
        } else {
            return _monthlyGrants * subPerformance[_subDAO][month] / totalPerformance[month];
        }
    }

}

// holds the member grants for 6 months
contract TimeLock {
    struct balances {
        uint256 balance;
        uint256 releaseTime;
    }

    address public leader;
    address public owner;

    mapping(address => balances) releases;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "not owner");
        _;
    }

    //set leader address
    function setLeader(address _leader) public onlyOwner {
        leader = _leader;
    }

    //deposit function updates balance and sets locktime
    function deposit(address _member, uint256 _amount) public {
        require(_amount > 0, "amount must be greater than 0");
        releases[_member].releaseTime = block.timestamp + (26 weeks);
        releases[_member].balance += _amount;
        Leader(leader).transferFrom(msg.sender, address(this), _amount);        
    }

    //withdraw function releases funds after 6 months
    function withdraw() public {
        require(releases[msg.sender].balance > 0, "no balance");
        require(releases[msg.sender].releaseTime < block.timestamp, "not released yet");
        uint256 amount = releases[msg.sender].balance;
        releases[msg.sender].balance = 0;
        Leader(leader).transfer(msg.sender, amount);
    }

    function getBalance(address _member) public view returns (uint256) {
        return releases[_member].balance;
    }

    function getReleaseTime(address _member) public view returns (uint256) {
        return releases[_member].releaseTime;
    }



}