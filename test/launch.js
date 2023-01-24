//test file
const { expect, assert } = require("chai");
const chai = require('chai');
const chaiAlmost = require('chai-almost');
const { BigNumber, logger } = require("ethers");
chai.use(chaiAlmost(100));
const { ethers } = require("hardhat");
const twoWeeks = 60*60*24*14
const oneMonth = 60*60*24*28
const sixMonths = 60*60*24*7*26

before(async function () {
    [god, adam, eve, moses, steven, mary, jose, cuervo, mrT, lilTimmy, bigDog, newGuy, newGuy2, uncleG, dummy, dummy2, dummy3] = await ethers.getSigners();

    const TimeLock = await hre.ethers.getContractFactory("TimeLock");
    timeLock = await TimeLock.deploy();
    await timeLock.deployed();
    console.log("TimeLock deployed to:", timeLock.address);

    WhiteList = await ethers.getContractFactory("WhiteList");
    whiteList = await WhiteList.deploy()
    await whiteList.deployed();

    await whiteList.addToWhiteList(adam.address);
    await whiteList.addToWhiteList(eve.address);
    await whiteList.addToWhiteList(moses.address);
    await whiteList.addToWhiteList(steven.address);
    await whiteList.addToWhiteList(mary.address);

    Leader = await ethers.getContractFactory("Leader");
    leader = await Leader.deploy(whiteList.address, timeLock.address)
    await leader.deployed();

    await timeLock.setLeader(leader.address);

    facto = await leader.clubFactoryAddress();

    // add club factory to whitelist
    await whiteList.addClubFactoryAddress(facto);

    // deploy club factory
    ClubFactory = await hre.ethers.getContractAt("ClubFactory", facto);

    perf = await leader.performance()
    Perf = await hre.ethers.getContractAt("Performance", perf);

    await whiteList.connect(adam).createClub();
    await whiteList.connect(eve).createClub();
    await whiteList.connect(moses).createClub();
    await whiteList.connect(steven).createClub();
    await whiteList.connect(mary).createClub();

    const clubs = await ClubFactory.numberOfClubs()

    clubA = await leader.clubOfMember(adam.address)
    ClubAdam = await hre.ethers.getContractAt("Club", clubA);

    const clubB = await leader.clubOfMember(eve.address)
    ClubEve = await hre.ethers.getContractAt("Club", clubB);
    
    const clubMoses = await leader.clubOfMember(moses.address)
    ClubMoses = await hre.ethers.getContractAt("Club", clubMoses);

  
    const bal = await leader.balanceOf(god.address);

    const votingAddress = await leader.votingAddress();
    voting = await hre.ethers.getContractAt("Voting", votingAddress);

    maxS = await leader.MAX_SUPPLY();
    maxSupply = BigInt(maxS)

    calculateGrant = function(totalSupply) {
            return((maxSupply - totalSupply)*BigInt(4)/BigInt(100))
    }

//initialize performance variables
    performance = {"club": BigInt(0)};
    totalPerformance = BigInt(0);

//reset performance to zero for a new month
    resetPerformance = function() {
        performance = {"club": BigInt(0)};
        totalPerformance = BigInt(0);
    }
//add performance to a specific club
    addPerformance = async function(to, amount) {
        const club = await leader.clubOfMember(to);
        const addedBy = await leader.getAddedBy(to);

        if(!(club in performance)){
            performance[club] = BigInt(0);
        }

        if(!(addedBy in performance)){
            performance[addedBy] = BigInt(0);
        }


        performance[club] += BigInt(amount)/BigInt(2)
        performance[addedBy] += BigInt(amount)/BigInt(2)    

        totalPerformance += BigInt(amount)
    }
//transfer function that adds performance
    transfer = async function(to, amount) {
        await leader.transfer(to, amount)
        await addPerformance(to, amount)
    }
//gives the grant ratio for the club
    getGrant = async function(to){
        const club = await leader.clubOfMember(to);
        return totalGrants*performance[club]/totalPerformance
    }

});

describe('Basic Set up', function () { 
    // still need to check minting and burning
    
    it("check totalSupply", async function () {
        supply = await leader.totalSupply()
        clubMint = 1125000
        const mint = clubMint*200+5000000000
        console.log(mint)
        expect(supply).to.equal(ethers.utils.parseEther(mint.toString()));
    });

    it("clubs effective balances are 1125e21", async function () {
        expect(await leader.balanceOf(clubA)).to.equal(ethers.utils.parseEther("1125000"))
    })

    it("check club numbers", async function () {
        noClubs = BigInt(await ClubFactory.numberOfClubs())
        expect(noClubs).to.equal(BigInt(5));
    });

    it("checks adams timelock", async function () {
        expect(await timeLock.getBalance(adam.address)).to.equal(ethers.utils.parseEther("1125000"))
        const releaseTime = await timeLock.getReleaseTime(adam.address);
        const now = await ethers.provider.getBlock("latest");
        const sixMonthsMore = now.timestamp + sixMonths;
        //expect releaseTime to be within 10 of now.timeStamp
        expect(releaseTime).to.be.within(sixMonthsMore-10, sixMonthsMore);

    })

    it("rejects payment from god", async function () {
        await expect(ClubAdam.payMembers()).to.be.revertedWith('not active member')    
    })

    it("pays Adam", async function () {
        await network.provider.send("evm_increaseTime", [oneMonth]);
        await network.provider.send("evm_mine");
        
        totalSupply = BigInt(await leader.totalSupply());
        await ClubAdam.connect(adam).payMembers()

        clubBal = BigInt(clubMint)*BigInt(1e18)
        grant = calculateGrant(totalSupply)/noClubs
        clubBal += grant
        
        totalSupply += grant

        expect(await leader.balanceOf(clubA)).to.equal(clubBal);

    })

    it("pays Eve", async function () {
        await ClubEve.connect(eve).payMembers()
        expect(await leader.balanceOf(ClubEve.address)).to.equal(clubBal);

        totalSupply += grant
    })

    it("pays moses", async function () {
        await ClubMoses.connect(moses).payMembers()
        expect(await leader.balanceOf(ClubMoses.address)).to.equal(clubBal);

        totalSupply += grant
    })

    it("rejects payment", async function () {
        await expect(ClubAdam.connect(adam).payMembers()).to.be.revertedWith('paid')    
    })

    it("check totalSupply", async function () {
        expect(await leader.totalSupply()).to.equal(totalSupply);
    });

    it("accepts after t", async function () {
        //transfer a bit to adam
        await transfer(adam.address, BigInt(1.1e10))

        //burn 1% of transfers
        totalSupply -= BigInt(1.1e10)/BigInt(50)
        expect(await leader.totalSupply()).to.equal(totalSupply)

        await network.provider.send("evm_increaseTime", [oneMonth]);
        await network.provider.send("evm_mine");

        totalGrants = calculateGrant(totalSupply);

        const grant = await getGrant(adam.address);

        await ClubAdam.connect(adam).payMembers()
        
        clubBal += grant;
        
        expect(await leader.balanceOf(clubA)).to.equal(clubBal)
    })

    it("rejects vote creation", async function () {
        await expect(ClubAdam.connect(adam).createVote(cuervo.address, ethers.utils.parseEther("533249752.375"))).to.be.revertedWith("not enough funds")
        await expect(ClubAdam.connect(adam).createVote(eve.address, ethers.utils.parseEther("9332492.375"))).to.be.revertedWith("is member")
    })

    it("creates a vote", async function () {
        const grantSize = clubBal/BigInt(4);
        await ClubAdam.connect(adam).createVote(jose.address, grantSize)

        clubBal -= grantSize;
        const candidate1 = await voting.opens(ClubAdam.address);
        expect(candidate1[0]).to.equal(jose.address);
    })

    it("rejects double vote", async function () {
        await expect(ClubAdam.connect(adam).vote(jose.address, 1)).to.be.revertedWith("voted");
    })

    it("rejects early close", async function () {
        await expect(ClubAdam.connect(adam).finishVote(jose.address)).to.be.revertedWith("too soon bro");
    })

    it("rejects unaccepted close", async function () {
        totalSupply = BigInt(await leader.totalSupply())
        totalGrants = calculateGrant(totalSupply)
        
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");

        await expect(ClubAdam.connect(adam).finishVote(jose.address)).to.be.revertedWith("has not accepted");
    })

    it("closes vote and adds jose", async function () {
        await voting.connect(jose).accept()
        await ClubAdam.connect(adam).finishVote(jose.address);
        expect(await leader.balanceOf(clubA)).to.equal(clubBal)
        expect(await ClubAdam.connect(adam).members(1)).to.equal(jose.address);
        expect(await leader.clubOfMember(jose.address)).to.equal(ClubAdam.address);
    })

    it("pays adam", async function () {
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        const monthGrant = calculateGrant(totalSupply)
        expect(await leader.balanceOf(clubA)).to.equal(clubBal);

        clubBal += monthGrant/BigInt(5);

        await ClubAdam.connect(adam).payMembers()

        expect((await leader.balanceOf(clubA))/10e10).to.almost.equal(Number(clubBal/BigInt(10e10)));
    })

    //cuervo, mrT, lilTimmy, bigDog

    it("creates a vote for cuervo", async function () {
        await ClubAdam.connect(adam).createVote(cuervo.address, ethers.utils.parseEther("43324975"))
        const candidate1 = await voting.opens(ClubAdam.address);
        expect(candidate1[0]).to.equal(cuervo.address);
        clubBal = BigInt(await leader.balanceOf(clubA))
    })

    it("jose votes for cuervo, then tries a double", async function () {
        await ClubAdam.connect(jose).vote(cuervo.address, 1)
        await expect(ClubAdam.connect(jose).vote(cuervo.address, 1)).to.be.revertedWith("voted");
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        await voting.connect(cuervo).accept();
        await ClubAdam.connect(jose).finishVote(cuervo.address);

        expect(await ClubAdam.numberOfMembers()).to.equal(3)
        expect(await ClubAdam.connect(adam).members(2)).to.equal(cuervo.address);
    })

    // test voting against and so rejected
    // current members: adam, jose, cuervo
    it("creates a vote for Mr T", async function () {
        addGrants = BigInt((await leader.balanceOf(clubA))/8)
        await ClubAdam.connect(jose).createVote(mrT.address, addGrants)

        clubBal -= addGrants
        expect(await leader.balanceOf(clubA)).to.equal(clubBal)
        const candidate1 = await voting.opens(ClubAdam.address);
        expect(candidate1[0]).to.equal(mrT.address);

    })

    it("adam and cuervo vote no", async function () {
        await expect(ClubAdam.connect(adam).vote(mrT.address, -2)).to.be.revertedWith("vote not right")
        await ClubAdam.connect(adam).vote(mrT.address, -1)
        await ClubAdam.connect(cuervo).vote(mrT.address, -1)
    })

    it("closes vote and rejects mr T", async function () {
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        await voting.connect(mrT).accept();
        await ClubAdam.connect(adam).finishVote(mrT.address);
        expect(await ClubAdam.connect(adam).numberOfMembers()).to.equal(3);
        clubBal += addGrants
        expect(await leader.balanceOf(clubA)).to.equal(clubBal)
    })

    it("adds lilTimmy, big dog and the new guys", async function () {
        await ClubAdam.connect(jose).createVote(bigDog.address, addGrants)
        clubBal -= addGrants
        await ClubAdam.connect(cuervo).vote(bigDog.address, 1)
        await ClubAdam.connect(adam).createVote(lilTimmy.address, addGrants)
        clubBal -= addGrants
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        await voting.connect(bigDog).accept();
        await ClubAdam.connect(adam).finishVote(bigDog.address);
        await voting.connect(lilTimmy).accept();
        await ClubAdam.connect(adam).finishVote(lilTimmy.address);

        await ClubAdam.connect(jose).createVote(newGuy.address, addGrants)
        clubBal -= addGrants
        await ClubAdam.connect(cuervo).createVote(newGuy2.address, addGrants)
        clubBal -= addGrants
        //
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        await voting.connect(newGuy).accept();
        await ClubAdam.connect(adam).finishVote(newGuy.address);
        await voting.connect(newGuy2).accept();
        await ClubAdam.connect(adam).finishVote(newGuy2.address);
        expect(await ClubFactory.numberOfClubs()).to.equal(5);
        expect(await ClubAdam.connect(adam).numberOfMembers()).to.equal(7);
        await expect(timeLock.connect(bigDog).withdraw()).to.be.revertedWith('locked')
        addGrants = BigInt((await leader.balanceOf(clubA))/8)
    })

    it("adds uncleG and creates new club", async function () {
        const clubsBefore = Number(await ClubFactory.numberOfClubs());
        await ClubAdam.connect(jose).createVote(uncleG.address, addGrants)
        clubBal -= addGrants
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        await voting.connect(uncleG).accept();
        await ClubAdam.connect(adam).finishVote(uncleG.address);
        const clubsAfter = clubsBefore+1;
        expect(await ClubFactory.numberOfClubs()).to.equal(clubsAfter);
        expect(await ClubFactory.numberOfClubs()).to.equal(6);
    })

    it("members in clubAdam shouldn't change", async function () {
        expect(await ClubAdam.connect(adam).numberOfMembers()).to.equal(7);
    })

    it("uncle Gs Club", async function () {
        const clubU = await leader.clubOfMember(uncleG.address)
        ClubU = await hre.ethers.getContractAt("Club", clubU);

        expect(await ClubU.members(0)).to.equal(uncleG.address)
        expect(await leader.balanceOf(ClubU.address)).to.equal(0)
        expect(await ClubU.numberOfMembers()).to.equal(1)
    })

    it("do some transactions then pay up", async function () {
        resetPerformance()
        const transferAmount = BigInt(90900879900)
        const burnAmount = transferAmount/BigInt(50)
        const balanceAmount = transferAmount-burnAmount
        await transfer(uncleG.address, transferAmount)
        
        // transfers to lilTimmy, Big Dog
        await transfer(lilTimmy.address, transferAmount)
        expect(await leader.balanceOf(lilTimmy.address)).to.equal(balanceAmount)
        
        await transfer(bigDog.address, transferAmount)
        expect(await leader.balanceOf(bigDog.address)).to.equal(balanceAmount)

        // caclulate grants and pay
        totalSupply = BigInt(await leader.totalSupply())
        totalGrants = calculateGrant(totalSupply)

        await network.provider.send("evm_increaseTime", [oneMonth]);
        await network.provider.send("evm_mine");
        expect(await leader.balanceOf(uncleG.address)).to.equal(balanceAmount)

        await ClubU.connect(uncleG).payMembers();

        //ClubU and uncleG balance
        grant = await getGrant(uncleG.address)

        expect(await leader.balanceOf(ClubU.address)).to.equal(grant)

        var expUncBal1 = balanceAmount
        var uncBal1 = await leader.balanceOf(uncleG.address)
        
        var expUncBal = Number(expUncBal1);
        var uncBal = Number(uncBal1);

        expect(uncBal).to.almost.equal(expUncBal)

        expect(await leader.balanceOf(clubA)).to.equal(clubBal)

        await ClubAdam.connect(adam).payMembers();

        grant = await getGrant(adam.address)

        clubBal += grant

        clubNum = Number(clubBal/BigInt(10e10))
       
        expect((await leader.balanceOf(clubA))/10e10).to.almost.equal(clubNum)

        expect((await leader.balanceOf(lilTimmy.address))/10e10).to.almost.equal(Number((balanceAmount)/BigInt(10e10)))
    })

    it("big dog can withdraw", async function () {
        clubBal = BigInt(await leader.balanceOf(clubA))
        bigDogBal = BigInt(await leader.balanceOf(bigDog.address))
        bdGrant = BigInt(await timeLock.getBalance(bigDog.address))
        bdBurn = bdGrant/BigInt(50)
        await network.provider.send("evm_increaseTime", [sixMonths]);
        await network.provider.send("evm_mine");

        await timeLock.connect(bigDog).withdraw()
        expect(await leader.balanceOf(clubA)).to.equal(clubBal)
        expect((await leader.balanceOf(bigDog.address))/1e10).to.almost.equal(Number(bigDogBal+bdGrant-bdBurn)/1e10)
    })

    it("cant withdraw", async function () {
        await expect(timeLock.connect(bigDog).withdraw()).to.be.revertedWith("no balance")
        await expect(timeLock.connect(god).withdraw()).to.be.revertedWith("no balance") 
    })

    it("rejects adding leader, club", async function () {
        const newTransfer = clubBal/BigInt(10)
        await expect(ClubAdam.connect(adam).createVote(ClubU.address, newTransfer)).to.be.revertedWith("no clubs")
        await expect(ClubAdam.connect(adam).createVote(leader.address, newTransfer)).to.be.revertedWith("no leader")
    })

    it('try pay a couple people', async function() {
        await expect(leader.payClubs()).to.be.revertedWith("not club")
        await expect(leader.connect(bigDog).payClubs()).to.be.revertedWith("not club")
    })

    it("transfers to a club", async function() {
        const coinage = 100000000
        clubBal = BigInt(await leader.balanceOf(clubA)) + BigInt(coinage);
        var effBal = BigInt(await leader.balanceOf(clubA)) + BigInt(coinage);
        await leader.transfer(clubA, coinage)
        expect(await leader.balanceOf(clubA)).to.equal(clubBal)
        expect(await leader.balanceOf(clubA)).to.equal(effBal);
    })

    //Monthly payment should be in line with a minimum grant

    //check I can't mint to a new club without the burn happening
    //or burn without minting
});

describe('test trasactions', function () {
    it('transfers from leader to eve', async function () {
        const godBal = BigInt(await leader.balanceOf(god.address))
        const eveBal = BigInt(await leader.balanceOf(eve.address))

        const trans = BigInt(5e15)
        burn = trans/BigInt(50)
        await transfer(eve.address, trans)  
        expect(await leader.balanceOf(god.address)).to.equal(godBal-trans)
        expect(await leader.balanceOf(eve.address)).to.equal(eveBal+(trans - burn))
        
        await network.provider.send("evm_increaseTime", [sixMonths]);
        await network.provider.send("evm_mine");

    })
})

describe("small grants", function () {
    it("add another member", async function (){
        let effy = BigInt((await leader.balanceOf(ClubU.address))*9999/10000)
        expect(await ClubFactory.numberOfClubs()).to.equal(6);
        await ClubU.connect(uncleG).createVote(dummy.address, effy);
        const candidates = await voting.opens(ClubU.address)
        expect(candidates[0]).to.equal(dummy.address)

        const numM = await ClubU.numberOfMembers()

        await voting.connect(dummy).accept()
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");

        await ClubU.connect(uncleG).finishVote(dummy.address);
        
        let smallGrant = BigInt((await leader.balanceOf(ClubU.address))/19)
        await ClubU.connect(uncleG).createVote(dummy2.address, smallGrant);
        
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");

        await voting.connect(dummy2).accept();

        await ClubU.connect(uncleG).finishVote(dummy2.address);
        expect(await ClubU.members(0)).to.equal(uncleG.address)
        expect(await ClubU.numberOfMembers()).to.equal(3);
        expect(await ClubU.members(2)).to.equal(dummy2.address)
    })

    it("transfer equal amount to both clubs", async function () {
        const joseBal = BigInt(await leader.balanceOf(jose.address))
        const dummy2Bal = BigInt(await leader.balanceOf(dummy2.address))
        const transfer3 = BigInt(1e18)
        burn = transfer3/BigInt(50)
        await transfer(jose.address, transfer3)
        await transfer(dummy2.address, transfer3)

        expect(await leader.balanceOf(jose.address)).to.equal(joseBal+transfer3-burn)
        expect(await leader.balanceOf(dummy2.address)).to.equal(dummy2Bal+transfer3-burn)

        totalGrants = calculateGrant(totalSupply);

        await network.provider.send("evm_increaseTime", [oneMonth]);
        await network.provider.send("evm_mine");

        getPayment = await Perf.getPayment(totalGrants, ClubAdam.address)
        expect(await Perf.getPayment(totalGrants, ClubU.address)).to.equal(getPayment)
    })

    //need to double check it's calculating correctly, then try breaking shit
})