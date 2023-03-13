/*
Sequence of events that will enable a trustless launch of the system.

1. Open Whitelist.
    1. People can buy in to start a club, 1000 ONE for a club loaded with 1M tokens.
    2. Set refunds close time - this also allows people to call the createClub function
2. Launch Leader:
    1. Mint 4B to the Whitelist
    2. Mint dev tokens to timelock
    3. Mint dev DAO tokens to governance contract
3. Close Whitelist:
    1. Transfer 1M ONE to ClubFactory for every club on the whitelist
    2. Create LP, get LP address
    3. Create the yield farm and transfer to it
    4. Unlock the createClub function
*/