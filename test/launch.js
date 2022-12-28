//test file
const { expect, assert } = require("chai");
const chai = require('chai');
const chaiAlmost = require('chai-almost');
const { BigNumber } = require("ethers");
chai.use(chaiAlmost(100));
const { ethers } = require("hardhat");
const twoWeeks = 60*60*24*14
const oneMonth = 60*60*24*28
const sixMonths = 60*60*24*182

before(async function () {
    [god, adam, eve, moses, steven, mary, jose, cuervo, mrT, lilTimmy, bigDog, newGuy, newGuy2, uncleG, dummy, dummy2, dummy3] = await ethers.getSigners();

    WhiteList = await ethers.getContractFactory("WhiteList");
    whiteList = await WhiteList.deploy()
    await whiteList.deployed();

    await whiteList.addToWhiteList(adam.address);
    await whiteList.addToWhiteList(eve.address);
    await whiteList.addToWhiteList(moses.address);
    await whiteList.addToWhiteList(steven.address);
    await whiteList.addToWhiteList(mary.address);

    Leader = await ethers.getContractFactory("Leader");
    leader = await Leader.deploy(whiteList.address)
    await leader.deployed();

    facto = await leader.subFactoryAddress();

    perf = await leader.performance()
    Perf = await hre.ethers.getContractAt("Performance", perf);

    await whiteList.connect(adam).createSub(facto);
    await whiteList.connect(eve).createSub(facto);
    await whiteList.connect(moses).createSub(facto);
    await whiteList.connect(steven).createSub(facto);
    await whiteList.connect(mary).createSub(facto);

    const subs = await Perf.totalSubs()

    subA = await leader.subOfMember(adam.address)
    SubAdam = await hre.ethers.getContractAt("SubDAO", subA);

    const subB = await leader.subOfMember(eve.address)
    SubEve = await hre.ethers.getContractAt("SubDAO", subB);
    
    const subMoses = await leader.subOfMember(moses.address)
    SubMoses = await hre.ethers.getContractAt("SubDAO", subMoses);

  
    const bal = await leader.balanceOf(god.address);

    const votingAddress = await leader.votingAddress();
    voting = await hre.ethers.getContractAt("Voting", votingAddress);

    maxS = await leader.maxSupply();
    maxSupply = BigInt(maxS)

    calculateGrant = function(totalSupply) {
            return((maxSupply - totalSupply)*BigInt(9)/BigInt(200))
    }

//initialize performance variables
    performance = {"sub": BigInt(0)};
    totalPerformance = BigInt(0);

//reset performance to zero for a new month
    resetPerformance = function() {
        performance = {"sub": BigInt(0)};
        totalPerformance = BigInt(0);
    }
//add performance to a specific sub
    addPerformance = async function(to, amount) {
        const sub = await leader.subOfMember(to);
        const grantAmount = await leader.grantSize(to);
        const addedBy = await leader.getAddedBy(to);

        if(!(sub in performance)){
            performance[sub] = BigInt(0);
        }

        if(!(addedBy in performance)){
            performance[addedBy] = BigInt(0);
        }


        performance[sub] += BigInt(1e20)*BigInt(amount)*BigInt(amount)/(BigInt(2)*BigInt(grantAmount))
        performance[addedBy] += BigInt(1e20)*BigInt(amount)*BigInt(amount)/(BigInt(2)*BigInt(grantAmount))        

        totalPerformance += BigInt(1e20)*BigInt(amount)*BigInt(amount)/BigInt(grantAmount)
    }
//transfer function that adds performance
    transfer = async function(to, amount) {
        await leader.transfer(to, amount)
        await addPerformance(to, amount)
    }
//gives the grant ratio for the sub
    getGrant = async function(to){
        const sub = await leader.subOfMember(to);
        return totalGrants*performance[sub]/totalPerformance
    }

});

describe('Basic Set up', function () { 
    it("check totalSupply", async function () {
        supply = await leader.totalSupply()
        subMint = 1125000
        const mint = subMint*105+5000000000
        console.log(mint)
        expect(supply).to.equal(ethers.utils.parseEther(mint.toString()));
    });

    it("subs effective balances are 1125e21", async function () {
        expect(await SubAdam.effectiveBalance()).to.equal(ethers.utils.parseEther("1125000"))
    })

    it("check sub numbers", async function () {
        noSubs = BigInt(await Perf.totalSubs())
        expect(noSubs).to.equal(BigInt(5));
    });

    it("rejects payment from god", async function () {
        await expect(SubAdam.payMembers()).to.be.revertedWith('not active member')    
    })

    it("pays Adam", async function () {
        await network.provider.send("evm_increaseTime", [oneMonth]);
        await network.provider.send("evm_mine");
        
        totalSupply = BigInt(await leader.totalSupply());
        await SubAdam.connect(adam).payMembers()

        subBal = BigInt(subMint)*BigInt(1e18)
        grant = calculateGrant(totalSupply)/noSubs
        payment = (subBal + grant)/BigInt(100);
        burn = payment/BigInt(100);
        subBal += grant-payment;
        adamBal = payment-burn;

        totalSupply += grant - burn

        expect(await SubAdam.effectiveBalance()).to.equal(subBal);
        expect(await leader.balanceOf(adam.address)).to.equal(adamBal);

        await addPerformance(adam.address, payment)
    })

    it("pays Eve", async function () {
        await SubEve.connect(eve).payMembers()
        expect(await SubEve.effectiveBalance()).to.equal(subBal);
        expect(await leader.balanceOf(eve.address)).to.equal(payment-burn)
        await addPerformance(eve.address, payment)
        totalSupply += grant - burn
    })

    it("pays moses", async function () {
        await SubMoses.connect(moses).payMembers()
        expect(await SubMoses.effectiveBalance()).to.equal(subBal);
        expect(await leader.balanceOf(moses.address)).to.equal(payment-burn)
        await addPerformance(moses.address, payment)
        totalSupply += grant - burn
    })

    it("rejects payment", async function () {
        await expect(SubAdam.connect(adam).payMembers()).to.be.revertedWith('paid')    
    })

    it("accepts after t", async function () {
        await network.provider.send("evm_increaseTime", [oneMonth]);
        await network.provider.send("evm_mine");

        totalGrants = calculateGrant(totalSupply);

        const grant = await getGrant(adam.address);

        await SubAdam.connect(adam).payMembers()
        
        subBal += grant;

        payment = subBal/BigInt(100);
        subBal -= payment
        burn = payment/BigInt(100);

        adamBal += (payment*BigInt(99)/BigInt(100))
        
        expect(await SubAdam.effectiveBalance()).to.equal(subBal)
        expect(await leader.balanceOf(adam.address)).to.equal(adamBal)
    })

    it("rejects vote creation", async function () {
        await expect(SubAdam.connect(adam).createVote(cuervo.address, ethers.utils.parseEther("533249752.375"))).to.be.revertedWith("too big")
        await expect(SubAdam.connect(adam).createVote(cuervo.address, ethers.utils.parseEther("249752.375"))).to.be.revertedWith("too small")
        await expect(SubAdam.connect(adam).createVote(eve.address, ethers.utils.parseEther("5332492.375"))).to.be.revertedWith("is member")
    })

    it("creates a vote", async function () {
        const grantSize = subBal/BigInt(4);
        await SubAdam.connect(adam).createVote(jose.address, grantSize)
        active = {
            "adam": 12
        }
        subBal -= grantSize;
        const candidate1 = await voting.opens(SubAdam.address);
        expect(candidate1[0]).to.equal(jose.address);
    })

    it("rejects too soon vote creation", async function () {
        await expect(SubAdam.connect(adam).createVote(cuervo.address, ethers.utils.parseEther("43324975"))).to.be.revertedWith("wait")
    })

    it("rejects double vote", async function () {
        await expect(SubAdam.connect(adam).vote(jose.address, 1)).to.be.revertedWith("voted");
    })

    it("rejects early close", async function () {
        await expect(SubAdam.connect(adam).finishVote(jose.address)).to.be.revertedWith("too soon");
    })

    it("rejects unaccepted close", async function () {
        totalSupply = BigInt(await leader.totalSupply())
        totalGrants = calculateGrant(totalSupply)
        
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");

        await expect(SubAdam.connect(adam).finishVote(jose.address)).to.be.revertedWith("has not accepted");
    })

    it("closes vote and adds jose", async function () {
        let AA = await SubAdam.subMembers(adam.address)
        expect(AA.active).to.equal(active.adam)
        await voting.connect(jose).accept()
        await SubAdam.connect(adam).finishVote(jose.address);
        active.jose = 9
        expect(await SubAdam.effectiveBalance()).to.equal(subBal)
        expect(await SubAdam.connect(adam).members(1)).to.equal(jose.address);
        expect(await leader.subOfMember(jose.address)).to.equal(SubAdam.address);
        active.adam -= 2
        AA = await SubAdam.subMembers(adam.address)
        expect(AA.active).to.equal(active.adam)

    })

    it("pays the two people", async function () {
        const monthGrant = calculateGrant(totalSupply)/BigInt(2)
        expect(await SubAdam.effectiveBalance()).to.equal(subBal);

        subBal += monthGrant
        
        payment = subBal/BigInt(100)
        burn = payment/BigInt(100)

        adamBal += payment-burn
        joseBal = payment-burn
        subBal -= (payment+payment)

        await SubAdam.connect(adam).payMembers()

        expect((await SubAdam.effectiveBalance())/10e10).to.almost.equal(Number(subBal/BigInt(10e10)));
        expect((await leader.balanceOf(jose.address))/10e10).to.almost.equal(Number(joseBal/BigInt(10e10)))
        expect((await leader.balanceOf(adam.address))/10e10).to.almost.equal(Number(adamBal/BigInt(10e10)))
    })

    //cuervo, mrT, lilTimmy, bigDog

    it("creates a vote for cuervo", async function () {
        await SubAdam.connect(adam).createVote(cuervo.address, ethers.utils.parseEther("43324975"))
        const candidate1 = await voting.opens(SubAdam.address);
        expect(candidate1[0]).to.equal(cuervo.address);
        subBal = BigInt(await SubAdam.effectiveBalance())
        active.adam += 3
    })

    it("jose votes for cuervo, then tries a double", async function () {
        await SubAdam.connect(jose).vote(cuervo.address, 1)
        await expect(SubAdam.connect(jose).vote(cuervo.address, 1)).to.be.revertedWith("voted");
        active.jose += 3
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        await voting.connect(cuervo).accept();
        await SubAdam.connect(jose).finishVote(cuervo.address);
        active.cuervo = 9
        active.adam -= 2
        active.jose -= 2
        expect(await SubAdam.numberOfMembers()).to.equal(3)
        expect(await SubAdam.connect(adam).members(2)).to.equal(cuervo.address);
    })

    // test voting against and so rejected
    // current members: adam, jose, cuervo
    it("creates a vote for Mr T", async function () {
        addGrants = BigInt((await SubAdam.effectiveBalance())/8)
        await SubAdam.connect(jose).createVote(mrT.address, addGrants)
        active.jose += 1
        subBal -= addGrants
        expect(await SubAdam.effectiveBalance()).to.equal(subBal)
        const candidate1 = await voting.opens(SubAdam.address);
        expect(candidate1[0]).to.equal(mrT.address);

    })

    it("adam and cuervo vote no", async function () {
        await expect(SubAdam.connect(adam).vote(mrT.address, -2)).to.be.revertedWith("vote not right")
        await SubAdam.connect(adam).vote(mrT.address, -1)
        await SubAdam.connect(cuervo).vote(mrT.address, -1)
        active.adam += 3
        active.cuervo += 3
    })

    it("closes vote and rejects mr T", async function () {
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        await voting.connect(mrT).accept();
        await SubAdam.connect(adam).finishVote(mrT.address);
        active.adam -= 2
        active.cuervo -= 2 
        expect(await SubAdam.connect(adam).numberOfMembers()).to.equal(3);
        subBal += addGrants
        expect(await SubAdam.effectiveBalance()).to.equal(subBal)
    })

    it("adds lilTimmy, big dog and the new guys", async function () {
        await SubAdam.connect(jose).createVote(bigDog.address, addGrants)
        subBal -= addGrants
        active.jose += 3
        await SubAdam.connect(cuervo).vote(bigDog.address, 1)
        active.cuervo += 3
        await SubAdam.connect(adam).createVote(lilTimmy.address, addGrants)
        active.adam += 3
        subBal -= addGrants
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        await voting.connect(bigDog).accept();
        await SubAdam.connect(adam).finishVote(bigDog.address);
        active.adam -= 2
        active.jose -= 2
        active.cuervo -= 2
        await voting.connect(lilTimmy).accept();
        await SubAdam.connect(adam).finishVote(lilTimmy.address);
        active.adam -= 2
        active.jose -= 2
        active.cuervo -= 2
        active.bigDog = 7

        await SubAdam.connect(jose).createVote(newGuy.address, addGrants)
        subBal -= addGrants
        active.jose +=3
        await SubAdam.connect(cuervo).createVote(newGuy2.address, addGrants)
        subBal -= addGrants
        active.cuervo +=3
        //
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        await voting.connect(newGuy).accept();
        await SubAdam.connect(adam).finishVote(newGuy.address);
        active.adam -= 2
        active.jose -= 2
        active.cuervo -= 2
        active.bigDog -= 2
        await voting.connect(newGuy2).accept();
        await SubAdam.connect(adam).finishVote(newGuy2.address);
        active.adam -= 2
        active.jose -= 2
        active.cuervo -= 2
        active.bigDog -= 2
        expect(await Perf.totalSubs()).to.equal(5);
        expect(await SubAdam.connect(adam).numberOfMembers()).to.equal(7);
        await expect(SubAdam.connect(bigDog).withdrawGrant()).to.be.revertedWith('locked')
        addGrants = BigInt((await SubAdam.effectiveBalance())/8)
    })

    it("adds uncleG and creates new sub", async function () {
        const subsBefore = Number(await Perf.totalSubs());
        await SubAdam.connect(jose).createVote(uncleG.address, addGrants)
        subBal -= addGrants
        if(active.jose<21){active.jose+=3}
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        await voting.connect(uncleG).accept();
        await SubAdam.connect(adam).finishVote(uncleG.address);
        active.adam -= 2
        active.jose -= 2
        active.cuervo -= 2
        active.bigDog -= 2
        const subsAfter = subsBefore+1;
        expect(await Perf.totalSubs()).to.equal(subsAfter);
        expect(await Perf.totalSubs()).to.equal(6);
    })

    it("members in subAdam shouldn't change", async function () {
        expect(await SubAdam.connect(adam).numberOfMembers()).to.equal(7);
    })

    it("uncle Gs Sub", async function () {
        const subU = await leader.subOfMember(uncleG.address)
        SubU = await hre.ethers.getContractAt("SubDAO", subU);

        expect(await SubU.members(0)).to.equal(uncleG.address)
        expect(await SubU.effectiveBalance()).to.equal(0)
        expect(await SubU.numberOfMembers()).to.equal(1)
    })

    it("do some transactions then pay up", async function () {
        resetPerformance()
        const transferAmount = BigInt(90900879900)
        const burnAmount = transferAmount/BigInt(100)
        const balanceAmount = transferAmount-burnAmount
        await transfer(uncleG.address, transferAmount)
        
        // transfers to lilTimmy, Big Dog
        await transfer(lilTimmy.address, transferAmount)
        subGrant = BigInt(await leader.grantSize(lilTimmy.address))

        expect(await leader.balanceOf(lilTimmy.address)).to.equal(balanceAmount)
        
        await transfer(bigDog.address, transferAmount)
        expect(await leader.balanceOf(bigDog.address)).to.equal(balanceAmount)

        // caclulate grants and pay
        totalSupply = BigInt(await leader.totalSupply())
        totalGrants = calculateGrant(totalSupply)

        await network.provider.send("evm_increaseTime", [oneMonth]);
        await network.provider.send("evm_mine");
        expect(await leader.balanceOf(uncleG.address)).to.equal(balanceAmount)

        await SubU.connect(uncleG).payMembers();

        //SubU and uncleG balance
        grant = await getGrant(uncleG.address)
        payment = grant/BigInt(100)
        burn = payment/BigInt(100)

        expect(await SubU.effectiveBalance()).to.equal(grant-payment)

        var expUncBal1 = balanceAmount + payment - burn;
        var uncBal1 = await leader.balanceOf(uncleG.address)
        
        var expUncBal = Number(expUncBal1);
        var uncBal = Number(uncBal1);

        expect(uncBal).to.almost.equal(expUncBal)

        expect(await SubAdam.effectiveBalance()).to.equal(subBal)

        await SubAdam.connect(adam).payMembers();

        grant = await getGrant(adam.address)

        subBal += grant
        payment = subBal/BigInt(100)
        burn = payment/BigInt(100)
        subBal -= BigInt(7)*payment
        subNum = Number(subBal/BigInt(10e10))
       
        expect((await SubAdam.effectiveBalance())/10e10).to.almost.equal(subNum)

        expect((await leader.balanceOf(lilTimmy.address))/10e10).to.almost.equal(Number((balanceAmount + payment - burn)/BigInt(10e10)))
    })

    it("check becoming inactive", async function (){
        const cuervoActive = await SubAdam.subMembers(cuervo.address)
        expect(cuervoActive.active).to.equal(active.cuervo)

        const adamA = await SubAdam.subMembers(adam.address)
        expect(active.adam).to.equal(adamA.active)

        const joseA = await SubAdam.subMembers(jose.address)
        expect(active.jose).to.equal(joseA.active)

        bigDogA = await SubAdam.subMembers(bigDog.address)
        expect(active.bigDog).to.equal(bigDogA.active)
        
        newTransfer = subBal/BigInt(10);
        await SubAdam.connect(adam).createVote(dummy.address, newTransfer);
        await SubAdam.connect(jose).vote(dummy.address, -1)
        await SubAdam.connect(cuervo).vote(dummy.address, -1)
        await SubAdam.connect(lilTimmy).vote(dummy.address, -1)
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        await voting.connect(dummy).accept();
        await SubAdam.connect(adam).finishVote(dummy.address);
        await SubAdam.connect(adam).createVote(dummy2.address, newTransfer);
        await SubAdam.connect(jose).vote(dummy2.address, -1)
        await SubAdam.connect(cuervo).vote(dummy2.address, -1)
        await SubAdam.connect(lilTimmy).vote(dummy2.address, -1)
        await SubAdam.connect(newGuy).vote(dummy2.address, -1)

        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");
        await voting.connect(dummy2).accept();
        await SubAdam.connect(adam).finishVote(dummy2.address);
        await SubAdam.connect(adam).createVote(dummy3.address, newTransfer);
        
        await voting.connect(dummy3).accept();
        await SubAdam.connect(jose).vote(dummy3.address, 1)
        await SubAdam.connect(cuervo).vote(dummy3.address, 1)
        await SubAdam.connect(lilTimmy).vote(dummy3.address, 1)

        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");

        await SubAdam.connect(adam).finishVote(dummy3.address);
        expect(await SubAdam.members(6)).to.equal(dummy3.address)
        expect(await SubAdam.numberOfMembers()).to.equal(7)
        await expect(SubAdam.connect(bigDog).createVote(dummy2.address,newTransfer)).to.be.revertedWith("not active member")

    })

    it("big dog can still withdraw", async function () {
        subBal = BigInt(await SubAdam.effectiveBalance())
        bigDogBal = BigInt(await leader.balanceOf(bigDog.address))
        bdGrant = BigInt(bigDogA.grantAmount)
        bdBurn = bdGrant/BigInt(100)
        await network.provider.send("evm_increaseTime", [sixMonths]);
        await network.provider.send("evm_mine");

        await SubAdam.connect(bigDog).withdrawGrant()
        expect(await SubAdam.effectiveBalance()).to.equal(subBal)
        expect((await leader.balanceOf(bigDog.address))/1e10).to.almost.equal(Number(bigDogBal+bdGrant-bdBurn)/1e10)
    })

    it("cant withdraw", async function () {
        await expect(SubAdam.connect(bigDog).withdrawGrant()).to.be.revertedWith("no grant")
        await expect(SubAdam.connect(god).withdrawGrant()).to.be.revertedWith("no grant")  
    })

    it("rejects adding leader, sub", async function () {
        await expect(SubAdam.connect(adam).createVote(SubU.address, newTransfer)).to.be.revertedWith("no subs")
        await expect(SubAdam.connect(adam).createVote(leader.address, newTransfer)).to.be.revertedWith("no leader")
    })

    it('try pay a couple people', async function() {
        await expect(leader.paySubs()).to.be.revertedWith("not sub")
        await expect(leader.connect(bigDog).paySubs()).to.be.revertedWith("not sub")
    })

    it("transfers to a sub", async function() {
        const coinage = 100000000
        subBal = BigInt(await leader.balanceOf(subA)) + BigInt(coinage);
        var effBal = BigInt(await SubAdam.effectiveBalance()) + BigInt(coinage);
        await leader.transfer(subA, coinage)
        expect(await leader.balanceOf(subA)).to.equal(subBal)
        expect(await SubAdam.effectiveBalance()).to.equal(effBal);
    })

    //Monthly payment should be in line with a minimum grant

    //check I can't mint to a new sub without the burn happening
    //or burn without minting
});

describe('test trasactions', function () {
    it('transfers from leader to eve', async function () {
        const godBal = BigInt(await leader.balanceOf(god.address))
        const eveBal = BigInt(await leader.balanceOf(eve.address))

        const trans = BigInt(5e15)
        burn = trans/BigInt(100)
        await transfer(eve.address, trans)  
        expect(await leader.balanceOf(god.address)).to.equal(godBal-trans)
        expect(await leader.balanceOf(eve.address)).to.equal(eveBal+(trans - burn))
        
        await network.provider.send("evm_increaseTime", [sixMonths]);
        await network.provider.send("evm_mine");

    })
})

describe("small grants", function () {
    it("add another member", async function (){
        let effy = BigInt((await SubU.effectiveBalance())*9999/10000)
        expect(await Perf.totalSubs()).to.equal(6);
        await SubU.connect(uncleG).createVote(dummy.address, effy);
        const candidates = await voting.opens(SubU.address)
        expect(candidates[0]).to.equal(dummy.address)

        const numM = await SubU.numberOfMembers()

        await voting.connect(dummy).accept()
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");

        await SubU.connect(uncleG).finishVote(dummy.address);
        
        let smallGrant = BigInt((await SubU.effectiveBalance())/19)
        await SubU.connect(uncleG).createVote(dummy2.address, smallGrant);
        
        await network.provider.send("evm_increaseTime", [twoWeeks]);
        await network.provider.send("evm_mine");

        await voting.connect(dummy2).accept();

        await SubU.connect(uncleG).finishVote(dummy2.address);
        expect(await SubU.members(0)).to.equal(uncleG.address)
        expect(await SubU.numberOfMembers()).to.equal(3);
        expect(await SubU.members(2)).to.equal(dummy2.address)
    })

    it("transfer equal amount to both subs", async function () {
        const joseBal = BigInt(await leader.balanceOf(jose.address))
        const dummy2Bal = BigInt(await leader.balanceOf(dummy2.address))
        const transfer3 = BigInt(1e18)
        burn = transfer3/BigInt(100)
        const subBal = BigInt(await SubAdam.effectiveBalance())
        const subUBal = BigInt(await SubU.effectiveBalance())
        await transfer(jose.address, transfer3)
        await transfer(dummy2.address, transfer3)

        expect(await leader.balanceOf(jose.address)).to.equal(joseBal+transfer3-burn)
        expect(await leader.balanceOf(dummy2.address)).to.equal(dummy2Bal+transfer3-burn)

        totalGrants = calculateGrant(totalSupply);

        await network.provider.send("evm_increaseTime", [oneMonth]);
        await network.provider.send("evm_mine");


        getPayment = await Perf.getPayment(totalGrants, SubAdam.address)
        console.log("payment subA: " + getPayment)
        getPayment = await Perf.getPayment(totalGrants, SubU.address)
        console.log("payment subU: " + getPayment)
    })

    //need to double check it's calculating correctly, then try breaking shit
})