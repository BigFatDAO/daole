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

    event VoteCreated(address indexed _suggestedBy, address indexed _candidate, uint _time);
    event Voted(address indexed _member, address indexed _candidate, int8 _vote, uint _time);
    event VoteCompleted(address indexed _candidate, bool indexed _accepted, uint _time);

    constructor(address _leader) {
        leader = Leader(_leader);
    }

    modifier onlySubs {
        require(leader.isSubDAO(msg.sender),"not a sub");
        _;
    }

/// @notice Opens a vote for a new candidate
/// @param _candidate The suggested candidate to be voted on
/// @param _grantAmount Grant size for the new candidate
/// @param _suggestedBy The member that suggested this candidate

    function createVote(address _candidate, uint _grantAmount, address _suggestedBy, uint _effectiveBalance) public onlySubs {
        require(_grantAmount <= _effectiveBalance,"too big");
        require(_candidate != address(leader), "no leader");
        require(!leader.isSubDAO(_candidate),"no subs");
        require(leader.subOfMember(_candidate)==address(0),"is member");
        require(!candidates[_candidate].open, "already been suggested");
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
            SubDAO(candidates[_candidate].subDAO).passVote(_candidate, candidates[_candidate].grantAmount);
        } else {
            emit VoteCompleted(_candidate, false, block.timestamp);
            SubDAO(candidates[_candidate].subDAO).addBalance(candidates[_candidate].grantAmount);
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
    uint256 public effectiveBalance;
    address[] public members;
    
    Leader leader;
    mapping(uint256 => bool) paid;
    struct subMember {
        uint256 active;
        uint256 grantAmount;
        uint256 nextSuggestion;
        uint256 releaseTime;
    }
    mapping(address => subMember) public subMembers;
    Voting voting;

    //Events:  
    event MemberRemoved(address indexed _member, uint _time);
    event MemberAdded(address indexed _newMember, address indexed _addedBy, uint _grantAmount, uint _time);

/// @notice constructor, sets up sub and adds the first member
/// @param _leaderAddress The address of the leader
/// @param _voting The address of the voting contract
/// @param _member The first member that will be added to the sub
/// @param _grantAmount The grant size for first member
    constructor(address _leaderAddress, address _voting, address _member, uint _grantAmount ) {
        locked = false;
        paid[block.timestamp/(4 weeks)]=true;
        leader = Leader(_leaderAddress);
        voting = Voting(_voting);
        members.push(_member);
        numberOfMembers = 1;
        subMembers[_member].active = 1;
        subMembers[_member].grantAmount = _grantAmount;
        subMembers[_member].releaseTime = block.timestamp + (26 weeks);
    }

    modifier onlyMembers {
        require(subMembers[msg.sender].active>0,"not active member");
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
        require(block.timestamp>subMembers[msg.sender].nextSuggestion,"wait");
        voting.createVote(_candidate, _grantAmount, msg.sender, effectiveBalance);
        vote(_candidate, 1);
        effectiveBalance -= _grantAmount;
        subMembers[msg.sender].nextSuggestion = block.timestamp + 2 weeks;
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
                subMembers[_candidate].active = 1;
                subMembers[_candidate].grantAmount = _grant;
                subMembers[_candidate].releaseTime = block.timestamp+(26 weeks);
                leader.addToAllMembers(_candidate, address(this),address(this));
                emit MemberAdded(_candidate, address(this), _grant, block.timestamp);
            } else { 
                leader.createSubDAO(_candidate, _grant, address(this));
            }         
        }

/// @notice Calls the Leader contract to pay this sub
    function payMembers() public onlyMembers {
        uint256 month = block.timestamp/(4 weeks);
        require(!paid[month],"paid");
        paid[month]=true;
        leader.paySubs();
    }

/// @notice Withdraws the grant for the caller, if they are a member
    function withdrawGrant() public {
        require(block.timestamp > subMembers[msg.sender].releaseTime, "locked");
        require(subMembers[msg.sender].grantAmount > 0, "no grant");
        uint grant = subMembers[msg.sender].grantAmount;
        subMembers[msg.sender].grantAmount = 0;
        leader.transfer(msg.sender, grant);
    }

/// @notice Called by leader or voting contract to add to effectiveBalance
/// @param _payment The amount to be added
    function addBalance (uint _payment) public {
        require(msg.sender == address(leader) || msg.sender == address(voting));
        effectiveBalance += _payment;
    }

    function getMembers () public view returns (address[] memory) {
        return members;
    }

}


///@notice The subFactory creates SubDAOs
contract SubFactory {
    address public leader;
    address public whiteList;

/// @notice Adds Leader and Whitelist address
/// @param _leader The Leader contract
/// @param _whiteList The Whitelist contract
    constructor (address _leader, address _whiteList) {
        leader = _leader;
        whiteList = _whiteList;
    }

/// @notice Creates a new sub
/// @param _member1 The first member of the sub
/// @param _grantAmount First member grant size
/// @param _addedBy The sub that added member1
    function createSubDAO (address _member1, uint _grantAmount, address _addedBy) public {
        require(msg.sender == leader || msg.sender == whiteList);
        SubDAO subDAO = new SubDAO(leader, Leader(leader).votingAddress(),_member1, _grantAmount);
        Leader(leader).finishCreation(_member1, address(subDAO), _grantAmount, _addedBy);
        if(msg.sender == whiteList) {
            Leader(leader).transfer(address(subDAO), 1125e21);
        }
    }
}


/// @notice The Leader contract calculates subs performace. Mints, transfers and burns.
contract Leader is Daole {
    address public subFactoryAddress;
    address public votingAddress;
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
    constructor(address _whiteList) Daole() {
        Voting voting = new Voting(address(this));
        votingAddress = address(voting);
        SubFactory subFactory = new SubFactory(address(this),_whiteList);
        subFactoryAddress = address(subFactory);
        Performance perf = new Performance(address(this));
        performance = address(perf);
        _mint(subFactoryAddress,1125e23);
    }

    modifier onlySubs{
        require(subs[msg.sender],"not sub");
        _;
    }

/// @notice Starts creation of a new sub, burns the grant from the old sub
/// @param _member1 The first member of the sub
/// @param _grantAmount First member grant size
/// @param _addedBy The sub that added member1
    function createSubDAO (address _member1, uint _grantAmount, address _addedBy) public onlySubs {
        _burn(msg.sender, _grantAmount);
        SubFactory(subFactoryAddress).createSubDAO(_member1, _grantAmount, _addedBy);
    }

/// @notice Adds the new sub to subs struct, mints grant to the new sub
/// @param _member1 The first member of the sub
/// @param _subDAO The sub that's just been created
/// @param _grantAmount First member grant size
/// @param _addedBy The sub that added member1
    function finishCreation(address _member1, address _subDAO, uint _grantAmount, address _addedBy) public {
        require(msg.sender == subFactoryAddress,"not factory");
        subs[_subDAO] = true;
        _mint(_subDAO, _grantAmount);
        Performance(performance).addSub();
        addToAllMembers(_member1, _addedBy, _subDAO);
//        emit SubDAOCreated(_owner, _addedBy, _grantAmount, block.timestamp);
    }

/// @notice Transfers. Adds transfers to members to their subs' performance
/// @param _to The receiver
/// @param _amount Transfer size
    function transfer(address _to, uint _amount) public override returns (bool) {
        if(subs[_to]) {
            SubDAO(_to).addBalance(_amount);
        } 
        //If reciever is a member, add volume to performance
        if(members[_to].subDAO != address(0)){

            _transfer(msg.sender, _to, _amount*99/100);
            _burn(msg.sender, _amount/100);

            Performance(performance).addPerformance(_amount, members[_to].addedBy, members[_to].subDAO);
        } else {
            _transfer(msg.sender, _to, _amount);
        }
        return true;
    }

/// @notice 4-weekly payment to subDAOs, called by the sub contracts
    function paySubs() public onlySubs {
        uint month = block.timestamp/(4 weeks);

        if(totalGrants[month]==0){
            totalGrants[month] = (MAX_SUPPLY - totalSupply())*9/200;
        }

        uint payment = Performance(performance).getPayment(totalGrants[month], msg.sender);

        _mint(msg.sender, payment);
        SubDAO(msg.sender).addBalance(payment);
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

/// @notice adds owner
    constructor(){
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(owner == msg.sender, "not owner");
        _;
    }

/// @notice Adds an address to the WhiteList - only owner
/// @param _winner The address to add to the whitelist
    function addToWhiteList(address _winner) public onlyOwner {
        whiteList[_winner] = true;
    }

/// @notice Creates a sub for a whitelisted address
/// @param _subFactoryAddress Pass in the address of the subFactory
    function createSub(address _subFactoryAddress) public {
        require(whiteList[msg.sender]==true,"not whitelisted");
        SubFactory(_subFactoryAddress).createSubDAO(msg.sender,1125e21,address(this));
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