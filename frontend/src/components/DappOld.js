import React from "react";
import { ethers } from "ethers";

// import leader, voting, club and whitelist artifacts
import LeaderArtifact from "../contracts/Leader.json";
import VotingArtifact from "../contracts/Voting.json";
// import WhiteListArtifact from "../contracts/WhiteList.json";
import ClubArtifact from "../contracts/Club.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NonMemberMessage } from "./NonMemberMessage";
import { MemberArea } from "./MemberArea";

// get the contract addresses from the json files
import LeaderAddress from "../contracts/Leader-address.json";
// import WhiteListAddress from "../contracts/WhiteList-address.json";
import VotingAddress from "../contracts/Voting-address.json";

const leaderAddress = LeaderAddress.Address;
// const whiteListAddress = WhiteListAddress.Address;
const votingAddress = VotingAddress.Address;

const cl = console.log;


const HARDHAT_NETWORK_ID = '1337';
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes contracts
//   3. Polls the user balance to keep it updated.
//   4. Connects the member to their club
//   5. Renders the whole application

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      // The info of the token (i.e. It's Name and symbol)
      tokenData: undefined,
      // The user's address and balance
      selectedAddress: undefined,
      balance: undefined,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      // the club address
      clubAddress: undefined,
      // open votes
      openVotes: undefined,
      // effective balance
      effectiveBalance: undefined,
      // club members
      clubMembers: undefined,
    };

    this.state = this.initialState;
  }

  render() {
    // injected, we instruct the user to install MetaMask.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    // The next thing we need to do, is to ask the user to connect their wallet.
    // Note that we pass it a callback that is going to be called when the user
    // clicks a button. This callback just calls the _connectWallet method.
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // If the token data or the user's balance hasn't loaded yet, we show
    // a loading component.
    if (!this.state.tokenData || !this.state.balance) {
      return <Loading />;
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>
              {this.state.tokenData.name} ({this.state.tokenData.symbol})
            </h1>
            <p>
              Welcome <b>{this.state.selectedAddress}</b> you have{" "}
              <b>
                {this.state.balance.toString()} {this.state.tokenData.symbol}
              </b>
              .
            </p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
            {/* 
              Sending a transaction isn't an immediate action. You have to wait
              for it to be mined.
              If we are waiting for one, we show a message here.
            */}
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}

            {/* 
              Sending a transaction can fail in multiple ways. 
              If that happened, we show a message here.
            */}
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            {/* if the user is not a member, we show a the NonMemberMessage */}
            {this.state.clubAddress === "0x0000000000000000000000000000000000000000" && (
              <NonMemberMessage selectedAddress={this.state.selectedAddress} />
            )}

            {/*
              This is a component that shows the member all the information about their Club
              It contains functions for all the actions a member can do
            */}
            {this.state.clubAddress !== "0x0000000000000000000000000000000000000000" && (
              <MemberArea
                clubAddress={this.state.clubAddress}
                openVotes={this.state.openVotes}
                effectiveBalance={this.state.effectiveBalance}
              />)}
          </div>
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state 
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      this._initialize(newAddress);
    });
    
    // We reset the dapp state if the network is changed
    window.ethereum.on("chainChanged", ([networkId]) => {
      this._stopPollingData();
      this._resetState();
    });
  }

  _initialize(userAddress) {
    this.setState({
      selectedAddress: userAddress,
    });
    this._initializeEthers();
    this._getTokenData();
    this._startPollingData();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    // Then initialize leader contract
    this._leader = new ethers.Contract(
      leaderAddress,
      LeaderArtifact.abi,
      this._provider.getSigner(0)
    );

    // find the club address
    await this._getClubAddress();

    // if user is a member of a club, initialize the club contract and the voting contract
    if (this.state.clubAddress !== "0x0000000000000000000000000000000000000000") {
      this._club = new ethers.Contract(
        this.state.clubAddress,
        ClubArtifact.abi,
        this._provider.getSigner(0)
      );

      this._voting = new ethers.Contract(
        votingAddress,
        VotingArtifact.abi,
        this._provider.getSigner(0)
      );

      // await this._getOpenVotes();
      // await this._getClubBalance();
      // await this._getNumberOfMembers();
    }

    // 

  }

  // The next two methods are needed to start and stop polling data. While
  // the data being polled here is specific to this example, you can use this
  // pattern to read any data from your contracts.
  //
  // Note that if you don't need it to update in near real time, you probably
  // don't need to poll it. If that's the case, you can just fetch it when you
  // initialize the app, as we do with the token data.
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);

    // We run it once immediately so we don't have to wait for it
    this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _getClubAddress() {
    const clubAddress = await this._leader.clubOfMember(this.state.selectedAddress);
    cl(clubAddress + typeof(clubAddress))
    this.setState({ clubAddress });
  }

  // The next two methods just read from the contract and store the results
  // in the component state.
  async _getTokenData() {
    const name = await this._leader.name();
    const symbol = await this._leader.symbol();

    this.setState({ tokenData: { name, symbol } });
  }

  async _updateBalance() {
    const balance = await this._leader.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
  }

  async _getOpenVotes() {
    const openVotes = await this._voting.opens(this.state.clubAddress);
    this.setState({ openVotes });
  }

  // get effective balance
  async _getClubBalance() {
    const effectiveBalanceBigInt = await this._leader.balanceOf(this.state.clubAddress);
    const effectiveBalance = ethers.utils.formatEther(effectiveBalanceBigInt);
    this.setState({ effectiveBalance });
    cl(effectiveBalance)
  }

  //transfer tokens
  async _transferTokens(to, amount) {
    await this._sendTransaction( this._leader, "transfer", [to, amount], this._updateBalance);
  }

  //get number of members
  async _getNumberOfMembers() {
    const numberOfMembers = await this._club.numberOfMembers();
    this.setState({ numberOfMembers });
  }

  async _getMembers() {
    const members = await this._club.getMembers();
    this.setState({ members });
  }

  

  //suggest a member
  async _suggestMember(memberAddress, grant) {
    this._sendTransaction( this._club, "createVote", [memberAddress, grant], this._getOpenVotes);
  }

  // Here is a generic try/catch function to handle errors 
  // that takes an array of inputs, a contract and a function name
  // and calls a chosen state to update
  async _sendTransaction(contract, functionName, inputs, updateMethod) {
    try {
      this._dismissTransactionError();
      const tx = await contract[functionName](...inputs);
      this.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await updateMethod;
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545 
  _checkNetwork() {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }

    this.setState({ 
      networkError: 'Please connect Metamask to Localhost:8545'
    });

    return false;
  }

  // here is the function to accept joining a club from the voting contract

  // All our club functions are below:

    

}
