<h1>Eth Club 7</h1>
<h2>Algorithmic Angel Investing</h2>
<h3>Overview</h3>

Eth Club 7 is a DAO of businesses that use DAOLE, an ERC-20 token, as currency.

A business gets a grant in DAOLE to start accepting it as payment. Initially, they accept DAOLE at a rate of $0.01/DAOLE, this is called Accepted Rate (AR), i.e. If a customer wants to buy a $1 orange, they can pay 100 DAOLE instead. This will initially be a huge discount and encourage adoption. If the market price of DAOLE reaches $0.009, AR doubles to $0.02. Everytime the market price of DAOLE reaches 90% parity with AR, it doubles. It can only be reduced by governance vote, e.g. in order to correct a price oracle error.

AR is published via a smart contract so users can always see what they'll get for their DAOLE. Initially, the index currency is USD, although this can be changed via governance vote if needed.

The size of a business’ grant should be high enough that both parties benefit: The customer, by the discount, and the businesses, by the value of the grant, but not too high, as eficient grant allocation is favored for future grants.

<h4>How are these grants allocated? By the Eth Club 7 DAO.</h4> 
Eth Club 7 is made up of many 7-member ‘Clubs’ that invest these grants.

Every time a Club gives a grant, the business that receives it becomes a new member of that Club, unless the Club already has 7 members, in which case they become the first member of a new Club.

The funding available for each Club to invest is based on the performance of members it has previously funded. This creates a network of Clubs where performance measurement is baked into the protocol.

In the case where the newly added member becomes the first in a new Club, their performance will be split between the Club that added them and the new Club.

<h3>Details</h3>
<h4>Tokenomics</h4>

* Max Supply: 10B DAOLE
* Liquidity Pool: 5B DAOLE + Eth from Whitelist Auction
* Business Grants: 5B DAOLE

<h3>Launch</h3>
<h4>Auction and Whitelist</h4>
100 Whitelist places will be auctioned to become the first 100 members, each in their own Club.

<h4>Initial Mint and Liquidity</h4>

* 5,112,500,000 (5.12B) DAOLE minted at launch.
* 5B DAOLE and the Eth from the Whitelist Auction added to the liquidity pool, and the liquidity pool tokens sent to a burn address.
* 112,500,000 to be transferred to the first 100 Clubs on creation (see below).

<h4>Creating the Clubs & funding</h4>
Whitelisted accounts can create their Club and become a member anytime within the first month. This means there will initially be 100 Clubs with 1 member each.

Each member will receive 1,125,000 DAOLE as their grant, this is locked for 6 months, as are all grants. The Club will also receive 1,125,000 DAOLE, which can be given as grants to onboard new members.

<h3>Ongoing Distribution:</h3>
<h4>Minting:</h4>
Every 4 weeks 4.5% of remaining supply is minted to Clubs, based on the performance of members that Club has added previously, divided by the total performance of all Clubs:
</br></br>
<p>A member’s performance is defined as: 

$P = \frac{V^2}{G}$

Where:
</br>
<i>
P = Performance</br>
V = Transaction volume received by the member in the previous month</br>
G = Initial grant received by the member</br>
 </i>
</p>

The performance of a club, <i>P<sub>C</sub></i> , is the sum of the performance of its members.
</br></br>
So, the payment received by a Club every 4 weeks is:
</br></br>
$0.045(M-C) \frac{P_C}{P_t}$
</br></br>
Where:
</br>
<i>
M = DAOLE Max supply </br>
C = DAOLE Current supply </br>
P<sub>C</sub> = Club Performance</br>
P<sub>t</sub> = Total Performance</br>
</i>
</br>
Clubs use these funds to give grants to new members to onboard them. These grants are locked for 6 months, then can be withdrawn by the member.

In addition, when the funds are minted to each Club, the active members of that Club will each be paid 1% of the Clubs balance to compensate them for participating in elections.
 
Edge cases:
</br>
When the member’s grant, G, is small, the minimum effective grant, G<sub>e</sub>, will be used.
</br></br>
$G_e = T10n$
</br>

Where:
</br>
<i>
T = Total grants given to date</br>
n = Number of members</br>
 </i></br>

If total performance, P<sub>t</sub>, is zero, i.e., no members received transfers that month, the payment is split equally amongst every Club.
 
<h3>Burning</h3>
1% of every transfer to a member is burned. This is to prevent volume spoofing and replenish funds for future distribution. Eventually there will be a balance between minting and burning, so the supply will never reach 10B tokens.
 
<h3>Club details</h3>
Every Club is made up of up to 7 members. The members are businesses, charities, dApps, or any other venture wishing to participate in Eth Club 7 and transact in DAOLE.
 </br>
The first 100 Clubs will have 1 member each, see the Launch section for more details.
 </br>
<h4>New members are added as follows:</h4>

1. An existing member proposes a new member to be added, and the size of the onboarding grant, and creates an election for the Club.
    1. Every member can only suggest one new member every 2 weeks.
    2. Grant must be at least 5% of the Club's balance and less than  balance/number of members.
2. 	The election can be closed after 2 weeks, if more than 50% of members have voted yes, the new member is added and allocated their grant, which is locked for 6 months.
    1. 	If the Club already has 7 members, the new added member becomes the first in a new Club. Then their performance is split equally among the new Club and the Club that added them.

