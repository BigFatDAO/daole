// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import './EthClub7Interfaces.sol';
import './YieldFarm.sol';
import './DAOLE.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';

/// @title Eth Club 7
/// @author Mr Nobody
/// @notice Creates a system of DAOs to allocate grants

// holds tokens for a set period, plus 100 day linear release.
// we'll use 6 months for dev funds and 1 month for member grants
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
    function setLeader(address _leader) external onlyOwner {
        leader = _leader;
    }

    //deposit function updates balance and sets locktime
    function deposit(address _member, uint256 _amount, uint256 _lockDays) external {
        require(_amount > 0, "amount must be greater than 0");
        releases[_member].releaseTime = block.timestamp + _lockDays* 1 days;
        releases[_member].balance += _amount;
        Leader(leader).transferFrom(msg.sender, address(this), _amount);        
    }

    //withdraw function releases funds linerally over 100 days, after the lockTime
    function withdraw() external {
        require(releases[msg.sender].balance > 0, "no balance");
        require(releases[msg.sender].releaseTime < block.timestamp, "locked");
        //calculate amount to release
        uint256 amount = releases[msg.sender].balance * (block.timestamp - releases[msg.sender].releaseTime) / (100 days);
        //update balance
        if(amount > releases[msg.sender].balance) amount = releases[msg.sender].balance;
        releases[msg.sender].balance -= amount;
        Leader(leader).transfer(msg.sender, amount);
    }

    function getBalance(address _member) public view returns (uint256) {
        return releases[_member].balance;
    }

    function getReleaseTime(address _member) public view returns (uint256) {
        return releases[_member].releaseTime;
    }
}

/// @notice WhiteListed addresses that can create their own clubs
contract WhiteList{
    mapping(address => bool) whiteList;
    address public owner;
    address public clubFactoryAddress;
    address public leader;
    IUniswapV2Router02 public immutable router;
    // Tranquil Finance: '0x3C8BF7e25EbfAaFb863256A4380A8a93490d8065';
    IUniswapV2Factory public immutable factory; 
    // Tranquil Finance: '0xF166939E9130b03f721B0aE5352CCCa690a7726a';
    address public immutable wone; 
    // '0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a';
    address public liquidityPair;
    uint256 public totalClubs;
    uint256 public unlockTime;

/// @notice adds owner
    constructor(address _router, address _factory, address _wone){
        router = IUniswapV2Router02(_router);
        factory = IUniswapV2Factory(_factory);
        wone = _wone;
        owner = msg.sender;
        unlockTime = block.timestamp + 90 days;
    }

    modifier onlyOwner {
        require(owner == msg.sender, "not owner");
        _;
    }

    modifier onlyClosed {
        require(block.timestamp > unlockTime, "too early");
        _;
    }

    modifier onlyOpen {
        require(block.timestamp < unlockTime, "too late");
        _;
    }

/// @notice adds clubFactory address
/// @param _clubFactoryAddress The clubFactory address
    function addClubFactoryAddress(address _clubFactoryAddress) external onlyOwner {
        clubFactoryAddress = _clubFactoryAddress;
    }

/// @notice Adds an address to the WhiteList - only owner.
/// @dev This is a placeholder. Needs to be updated to burn an NFT to add to the whitelist
/// @param _winner The address to add to the whitelist
    function addToWhiteList(address _address) external payable onlyOpen {
        require(msg.value == 1000 ether, "not enough ONE");
        require(whiteList[_address]==false, "already whitelisted");
        whiteList[_address] = true;
    }

    function refund() external onlyOpen {
        require(whiteList[msg.sender]==true, "not whitelisted");
        whiteList[_address] = false;
        payable(owner).transfer(1000 ether);
    }

/// @notice Owner can delay launch if needed
/// @param _delay The number of days to delay launch
    function delayLaunch(uint256 _delay) external onlyOwner onlyOpen {
        unlockTime = block.timestamp + _delay * 1 days;
    }

/// @notice Creates a club for a whitelisted address
    function createClub() external onlyClosed {
        require(whiteList[msg.sender]==true,"not whitelisted");
        ClubFactory(clubFactoryAddress).createClub(msg.sender,address(this));
    }

/// @notice Create the Uniswap V2 pair for the token
/// @param _tokenAddress The token address

    function createPair() external onlyClosed {
        require(msg.sender == leader, "not leader");
        require(liquidityPair == address(0), "pair already created");
        require(numberofClubs > 0, "no clubs");
        //we use the periphery router02 to create and fund the pair 
        uint amountDaole = numberofClubs * 1e24;
        uint amountOne = address(this).balance;

        // Approve the router to spend your token
        Leader(leader).approve(address(router), amountDaole);

        // Create the pair
        router.addLiquidityETH{value: amountOne}(
            leader,
            amountDaole,
            0,
            0,
            address(this),
            block.timestamp+300
        );

        // Get the pair address
        liquidityPair = factory.getPair(leader, wone);
    }

/// @notice Creates the YieldFarm contract
/// @param leader The DAOLE address
/// @param pair The Uniswap V2 pair address
    function createYieldFarm() external onlyClosed {
        require(msg.sender == leader, "not leader");
        require(liquidityPair != address(0), "no pair");
        YieldFarm yieldFarm = new YieldFarm(leader, liquidityPair);
        //transfer 4B - numberofClubs * 1M
        uint rewards = 4e27 - totalClubs * 1e24;
        Leader(leader).transfer(address(yieldFarm), rewards);
        //set rewards duration to 7 years
        uint duration = 7 * 365 days;
        yieldFarm.setRewardsDuration(duration);
        yieldFarm.notifyRewardAmount(rewards);
    }

}

/// @notice The Leader contract calculates clubs performace. Mints, transfers and burns.
contract Leader is Daole {
    address public clubFactoryAddress;
    address public votingAddress;
    address public whiteList;
    address public performance;
    mapping (uint => uint) totalGrants;
    mapping (address => bool) clubs;

    struct memberDeets {
        address addedBy;
        address club;
    }
    mapping (address => memberDeets) members;

    event Log(string func);

/// @notice Creates clubFactory and Voting contracts
/// @param _whiteList The whitelist contract address
    constructor(address _whiteList, address _timeLock, address _dev1, uint _amountDev1) Daole() {
        whiteList = _whiteList;
        Voting voting = new Voting(address(this), _timeLock);
        votingAddress = address(voting);
        ClubFactory clubFactory = new ClubFactory(address(this),_whiteList, _timeLock);
        clubFactoryAddress = address(clubFactory);
        Performance perf = new Performance(address(this));
        performance = address(perf);
        //mint 4B to whiteList
        _mint(whiteList, 4e27);
        //mint 500M to devs, to be transferred to the timelock
        _mint(dev1, _amountDev1);
    }

    modifier onlyClubs{
        require(clubs[msg.sender],"not club");
        _;
    }

/// @notice Transfers. Adds transfers to members to their clubs' performance
/// @param _to The receiver
/// @param _amount Transfer size
    function transfer(address _to, uint _amount) public override returns (bool) {
        //If reciever is a member, add volume to performance
        if(members[_to].club != address(0)){
            _transfer(msg.sender, _to, _amount*98/100);
            _burn(msg.sender, _amount/50);
            IPerformance(performance).addPerformance(_amount, members[_to].addedBy, members[_to].club);
        } else {
            _transfer(msg.sender, _to, _amount);
        }
        return true;
    }

/// @notice Called by clubs or clubFactory to add members to the leader mappings
/// @param _memberAddress Member to be added
/// @param _addedBy The club that added the member
/// @param _club The club of the member
    function addToAllMembers(address _memberAddress, address _addedBy, address _club ) public {
        require(clubs[msg.sender]||msg.sender==clubFactoryAddress);
        members[_memberAddress].addedBy = _addedBy;
        members[_memberAddress].club = _club;
    }

/// @notice Adds the new club to clubs struct, mints grant to the new club
/// @param _member1 The first member of the club
/// @param _club The club that's just been created
/// @param _addedBy The club that added member1
    function finishCreation(address _member1, address _club, address _addedBy) public {
        require(msg.sender == clubFactoryAddress,"not factory");
        clubs[_club] = true;
        addToAllMembers(_member1, _addedBy, _club);
//        emit ClubCreated(_owner, _addedBy, _grantAmount, block.timestamp);
    }

/// @notice 4-weekly payment to clubs, called by the club contracts
/// @dev can this be used to fund the initial 100 clubs?
    function payClubs() public onlyClubs {
        uint month = block.timestamp/(4 weeks);

        if(totalGrants[month]==0){
            totalGrants[month] = (MAX_SUPPLY - totalSupply())*4/100;
        }

        uint payment = IPerformance(performance).getPayment(totalGrants[month], msg.sender);

        _mint(msg.sender, payment);
    }

/// @notice Returns the club of an address
/// @param _member The member
/// @return The club of the member - returns zero address if not a member
    function clubOfMember(address _member) public view returns (address) {
        return members[_member].club;
    }

/// @notice Returns the club that added a member
/// @param _member The member
/// @return The club that added the member - returns zero if not a member
    function getAddedBy(address _member) public view returns (address) {
        return members[_member].addedBy;
    }

/// @notice Is the address a club?
/// @param _club The address
/// @return Is it a club - T/F
    function isClub(address _club) public view returns (bool) {
        return clubs[_club];
    }
    
/// @notice fallback function    
        fallback() external {
        // send / transfer (forwards 2300 gas to this fallback function)
        // call (forwards all of the gas)
        emit Log("fallback");
    }
}

contract Voting {
    /// @notice This contract stores the proposal info and executes voting
    /// @dev alows clubs to vote on adding members, removing members and adding a description contract
    
    struct proposal {
        uint proposalType; // 1 = addMember, 2 = removeMember, 3 = addDescription
        bool open;
        bool accepted;
        int8 votes;
        uint creationTime;
        uint grantAmount;
        address club;
        mapping (address => bool) vote;
    }

    mapping(address => proposal) public proposals;

    mapping(address => address[]) openProposals;

    Leader leader;
    TimeLock timeLock;

    event VoteCreated(address indexed _suggestedBy, address indexed _proposal, uint _proposalType, uint _time);
    event Voted(address indexed _member, address indexed _proposal, int8 _vote, uint _time);
    event VoteCompleted(address indexed _proposal, bool indexed _accepted, string _proposalType, uint _time);

    constructor(address _leader, address _timeLock) {
        leader = Leader(_leader);
        timeLock = TimeLock(_timeLock);
    }

    modifier onlyClubs {
        require(leader.isClub(msg.sender),"not a club");
        _;
    }

/// @notice Opens a vote for a new proposal
/// @param _proposal The suggested proposal to be voted on
/// @param _grantAmount Grant size for the new proposal
/// @param _suggestedBy The member that suggested this proposal

    function createProposal(uint _proposalType, uint _grantAmount, address _proposal, address _suggestedBy) external onlyClubs {
        require(!proposals[_proposal].open, "already open");
        //if adding members then require that the member is not already a member
        if(_proposalType == 1){
            require(leader.clubOfMember(_proposal)==address(0),"is member");
        } else if (_proposalType == 2){
            require(leader.clubOfMember(_proposal) == leader.clubOfMember(_suggestedBy),"not member of your club");
        }
        // some of these values need to be set to 0 or false because they may have already been a proposal that failed
        proposals[_proposal].proposalType = _proposalType;
        proposals[_proposal].open = true;
        proposals[_proposal].accepted = false;
        proposals[_proposal].creationTime = block.timestamp;
        proposals[_proposal].grantAmount = _grantAmount;
        proposals[_proposal].club = msg.sender;
        proposals[_proposal].votes = 0;

        openProposals[msg.sender].push(_proposal);

        vote(_proposal, _suggestedBy, 1);

        emit VoteCreated(_suggestedBy, _proposal, _proposalType,  block.timestamp);
    }

/// @notice Proposal must accept before becoming a member
/// @dev If the new member is a contract, you must build a function for it to accept
    function accept() public {
        require(proposals[msg.sender].open == true, "not open");
        proposals[msg.sender].accepted = true;
    } 

/// @notice Adds the votes for a proposal
/// @param _proposal The suggested proposal to be voted on
/// @param _voter the member voting
/// @param _vote the vote, +1 or -1
    function vote(address _proposal, address _voter, int8 _vote) public onlyClubs {
        require(!proposals[_proposal].vote[_voter],"voted");
        require(_vote == 1 || _vote == -1, "vote not right");
        require(proposals[_proposal].open, "not open");
        proposals[_proposal].vote[_voter]=true;
        proposals[_proposal].votes += _vote;

        emit Voted(_voter, _proposal, _vote, block.timestamp);
    }

    function removeFromOpenArray(address _proposal) internal {
        //this removes the proposal from the openProposals array
        for (uint i = 0; i < openProposals[msg.sender].length; i++) {
            
            if(openProposals[msg.sender][i] == _proposal) {
                delete openProposals[msg.sender][i];

                for (uint j = i; j<openProposals[msg.sender].length-1; j++){
                    openProposals[msg.sender][j] = openProposals[msg.sender][j+1];
                }
                openProposals[msg.sender].pop();
            }
        }
    }

    function addMember(address _proposal) internal {
        require(proposals[_proposal].accepted == true, "has not accepted");
        if(proposals[_proposal].votes>=1){
            emit VoteCompleted(_proposal, true, "addMember", block.timestamp);
            
            // deposit the grant into the timeLock for 4 weeks+
            leader.increaseAllowance(address(timeLock), proposals[_proposal].grantAmount);
            timeLock.deposit(_proposal ,proposals[_proposal].grantAmount, 4);
            
            // add the member to the club
            Club(proposals[_proposal].club).addMember(_proposal, proposals[_proposal].grantAmount);
        } else {
            emit VoteCompleted(_proposal, false, "addMember", block.timestamp);
            leader.transfer(proposals[_proposal].club, proposals[_proposal].grantAmount);
        }
    }

    function removeMember(address _proposal) internal {
        //can only remove with at least +4 vote count 
        if(proposals[_proposal].votes>=4){
            emit VoteCompleted(_proposal, true, "removeMember", block.timestamp);
            // remove the member from the club
            Club(proposals[_proposal].club).removeMember(_proposal);
        } else {
            emit VoteCompleted(_proposal, false, "removeMember", block.timestamp);
        }
    }

//this finction allows a club to add a description contract, describing club name, rules and function
    function addDescription(address _proposal) internal {
        if(proposals[_proposal].votes>=1){
            emit VoteCompleted(_proposal, true, "addDescription", block.timestamp);
            // add the description contract to the club
            Club(proposals[_proposal].club).addDescription(_proposal);
        } else {
            emit VoteCompleted(_proposal, false, "addDescription", block.timestamp);
        }
    }



/// @notice Closes the vote and adds/closes the proposal
/// @param _proposal The suggested proposal
    function finishVote(address _proposal) external onlyClubs {
        // need to call the right functions based on proposal type
        require(block.timestamp > proposals[_proposal].creationTime+2 weeks, "too soon bro");
        require(proposals[_proposal].open == true, "not open");
        proposals[_proposal].open = false;

        removeFromOpenArray(_proposal);

        // Now we see if the vote percentage is high enough to pass. Types 1 and 3 only need a magority, Type 2 needs +4 votes
        // Types 1 and 2 need acceptance, Types 3 and 4 do not
        if(proposals[_proposal].proposalType == 1){
            addMember(_proposal);
        } else if (proposals[_proposal].proposalType == 2){
            removeMember(_proposal);
        } else if (proposals[_proposal].proposalType == 3){
            // do nothing
        }
                
    }

/// @notice shows the open proposals for a club
/// @param _club The club to show openProposals for
/// @return An array of the open proposals for this club

    function opens(address _club) public view returns (address[] memory) {
        return openProposals[_club];
    }

}


///@notice The Club contract that members interact with. Stores member details
contract Club {
    uint256 public numberOfMembers;
    address[] public members;
    address public description;
    mapping(address => uint256) public clubMembers;
    mapping(uint256 => bool) paid;
    
    Leader leader;
    Voting voting;
    TimeLock timeLock;
    ClubFactory clubFactory;

    //Events:  
    event MemberRemoved(address indexed _member, uint _time);
    event MemberAdded(address indexed _newMember, address indexed _addedBy, uint _grantAmount, uint _time);

/// @notice constructor, sets up club and adds the first member
/// @param _leaderAddress The address of the leader
/// @param _voting The address of the voting contract
/// @param _member The first member that will be added to the club
/// @param _clubFactory The address of the clubFactory
    constructor(address _leaderAddress, address _voting, address _timeLock, address _clubFactory, address _member) {
        paid[block.timestamp/(4 weeks)]=true;
        leader = Leader(_leaderAddress);
        voting = Voting(_voting);
        timeLock = TimeLock(_timeLock);
        clubFactory = ClubFactory(_clubFactory);
        members.push(_member);
        numberOfMembers = 1;
        clubMembers[_member] = 1;
    }

    modifier onlyMembers {
        require(clubMembers[msg.sender]>0,"not active member");
        _;
    }

    modifier onlyLeader {
        require(msg.sender == address(leader),"not leader");
        _;
    }

/// @notice Allows a member to submit a candiate to be voted on by their club, also votes yes for them
/// @param _proposal The suggested proposal to be voted on
/// @param _grantAmount Grant size for the new proposal
    function createVote(address _proposal, uint _grantAmount, uint _proposalType) public onlyMembers {
        //make sure this contract has enough funds to pay the grant
        require(_grantAmount <= leader.balanceOf(address(this)), "not enough funds");
        // send the grant to the voting contract
        leader.transfer(address(voting), _grantAmount);  
        //create the vote
        voting.createProposal(_proposalType, _grantAmount, _proposal, msg.sender);
        vote(_proposal, 1);
    }

/// @notice Adds the votes for a proposal
/// @param _proposal The suggested proposal to be voted on
/// @param _vote the vote, +1 or -1
    function vote (address _proposal, int8 _vote) public onlyMembers {
        voting.vote(_proposal, msg.sender, _vote);
    }


/// @notice Closes the vote and adds/closes the proposal
/// @param _proposal The suggested proposal
    function finishVote(address _proposal) public onlyMembers {
        voting.finishVote(_proposal);
    }

/// @notice called by the voting contract to add a member if the vote has passed
/// @param _proposal The suggested proposal
/// @param _grant The size of the grant
    function addMember(address _proposal, uint _grant) public {
        require(msg.sender == address(voting));
            // if 7 or fewer members, add the member to this club 
            if(numberOfMembers<=7){
                members.push(_proposal);
                numberOfMembers += 1;
                clubMembers[_proposal] = 1;
                leader.addToAllMembers(_proposal, address(this), address(this));
                emit MemberAdded(_proposal, address(this), _grant, block.timestamp);
            } else {
                // if more than 7 members, create a new club
                clubFactory.createClub(_proposal, address(this));
        }
    }

/// @notice called by the voting contract to remove a member if the vote has passed
/// @param _proposal The suggested proposal
    function removeMember(address _proposal) public {
        require(msg.sender == address(voting));
        clubMembers[_proposal] = 0;
        numberOfMembers -= 1;
        leader.addToAllMembers(_proposal, address(0), address(0));
        emit MemberRemoved(_proposal, block.timestamp);
    }

/// @notice Allows the Club to add a description contract
/// @param _description The address of the description contract
    function addDescription(address _description) public {
        require(msg.sender == address(voting));
        description = _description;
    }

/// @notice Calls the Leader contract to pay this club
    function payMembers() public onlyMembers {
        uint256 month = block.timestamp/(4 weeks);
        require(!paid[month],"paid");
        paid[month]=true;
        leader.payClubs();
    }

    function getMembers () public view returns (address[] memory) {
        return members;
    }
}


///@notice The clubFactory creates Clubs
contract ClubFactory {
    address public leader;
    address public whiteList;
    address public timeLock;
    uint256 public numberOfClubs;

/// @notice Adds Leader and Whitelist address
/// @param _leader The Leader contract
/// @param _whiteList The Whitelist contract
    constructor (address _leader, address _whiteList, address _timeLock) {
        leader = _leader;
        whiteList = _whiteList;
        timeLock = _timeLock;
    }

/// @notice Creates a new club
/// @param _member1 The first member of the club
/// @param _addedBy The club that added member1
    function createClub (address _member1, address _addedBy) public {
        require(Leader(leader).isClub(msg.sender) || msg.sender == whiteList);
        Club club = new Club(leader, Leader(leader).votingAddress(),timeLock, address(this), _member1);
        Leader(leader).finishCreation(_member1, address(club), _addedBy);
        if(msg.sender == whiteList) {
            Leader(leader).transfer(address(club), 2250e21);
            Leader(leader).increaseAllowance(timeLock, 1125e21);
            TimeLock(timeLock).deposit(_member1, 1125e21,4);
        }
        numberOfClubs += 1;
    }
}



contract Performance {

    Leader leader;
    mapping(address => mapping(uint => uint)) public clubPerformance;
    mapping(uint => uint) public totalPerformance;
    
    // constructor - adds leader address
    constructor(address _leader) {
        leader = Leader(_leader);
    }

    modifier onlyLeader {
        require(msg.sender == address(leader), "not leader");
        _;
    }

    function addPerformance(uint _amount, address _addedBy, address _club) public onlyLeader {
        uint month = block.timestamp/(4 weeks);
        
        clubPerformance[_addedBy][month+1] += (_amount/2);
        clubPerformance[_club][month+1] += (_amount/2);
                
        totalPerformance[month+1] += (_amount);
    }

    function getPayment(uint _monthlyGrants, address _club) public view returns (uint) {
        uint month = block.timestamp/(4 weeks);

        if(totalPerformance[month] == 0){
            return _monthlyGrants / ClubFactory(Leader(leader).clubFactoryAddress()).numberOfClubs();
        } else {
            return _monthlyGrants * clubPerformance[_club][month] / totalPerformance[month];
        }
    }

    function getPerformance(address _club, uint256 _month) public view returns (uint) {
        return clubPerformance[_club][_month];
    }

    function getCurrentMonth() public view returns (uint) {
        return block.timestamp/(4 weeks);
    }

}

