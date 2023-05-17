// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes contracts
//   3. Polls the user balance to keep it updated.
//   4. Displays DAOLE price
//   5. Renders the whole application

//import react & ethers
import React, { Component } from "react";
import { ethers } from "ethers";
//import leader abi and address
import LeaderArtifact from "../contracts/Leader.json";
import LeaderAddress from "../contracts/Leader-address.json";
//import the whitelist abi and address
import WhiteListArtifact from "../contracts/WhiteList.json";
import WhiteListAddress from "../contracts/WhiteList-address.json";
//import connectwallet component
import { ConnectWallet } from "./ConnectWallet";
import { NoWalletDetected } from "./NoWalletDetected";
import { Loading } from "./Loading";
import { MemberDash } from "./MemberDash";
import { NotMemberDash } from "./NotMemberDash";
import { PreLaunch } from "./PreLaunch";
import "../landingPage/App.css";
import Navbar from "./Navbar";

const leaderAddress = LeaderAddress.Address;
const HARDHAT_NETWORK_ID = "1337";
// const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends Component {
  //constructor runs on load
  constructor(props) {
    super(props);
    this.initialState = {
      // The info of the token (i.e. It's Name and symbol)
      tokenData: undefined,
      // The user's address and balance
      selectedAddress: undefined,
      balance: undefined,
      clubOfMember: undefined,
      whitelistClosed: true,
      blockTime: undefined,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
    };
    this.state = this.initialState;
  }

  // This method initializes the dapp
  async componentDidMount() {
    await this._connectWallet();
  }

  render() {
    // injected, we instruct the user to install MetaMask.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }
    // If the user hasn't connected their wallet yet, we show a button
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

    return (
      <div className="dapp">
        <div className="dapp-background-image"></div>
        <Navbar page={"preLaunch"} />
        <div className="dapp-main">
          {/* now we add the components */}
          {this.state.whitelistClosed ? (
            <>
              {this.state.clubOfMember ? (
                <MemberDash
                  leader={this._leader}
                  clubOfMember={this.state.clubOfMember}
                  address={this.state.selectedAddress}
                />
              ) : (
                <NotMemberDash
                  leader={this._leader}
                  address={this.state.selectedAddress}
                />
              )}
            </>
          ) : (
            <PreLaunch
              address={this.state.selectedAddress}
              whitelist={this._whitelist}
            />
          )}
        </div>
      </div>
    );
  }
  //unmounts component
  componentWillUnmount() {
    this._stopPollingData();
  }

  // This method is in charge of connecting the user's wallet.
  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
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

  async _initialize(userAddress) {
    this.setState({
      selectedAddress: userAddress,
    });
    await this._initializeEthers();
    await this._getTokenData();
    await this._startPollingData();
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

    this._whitelist = new ethers.Contract(
      WhiteListAddress.Address,
      WhiteListArtifact.abi,
      this._provider.getSigner(0)
    );
  }

  // initialize the app, as we do with the token data.
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 10000);

    // We run it once immediately so we don't have to wait for it
    this._updateBalance();
    this._whitelistClosed();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  // This method is in charge of updating the user's balance.
  async _updateBalance() {
    const balance = await this._leader.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
  }

  // Check if the whitelist is closed
  async _whitelistClosed() {
    //get current blocktime
    const blockTime = (await this._provider.getBlock()).timestamp;
    this.setState({ blockTime });
    //get whitelist close time
    const whitelistCloseTime = await this._whitelist.closeTime();
    //check if whitelist is closed
    if (blockTime > whitelistCloseTime) {
      this.setState({ whitelistClosed: true });
    } else {
      this.setState({ whitelistClosed: false });
    }
  }

  async _getTokenData() {
    const name = await this._leader.name();
    const symbol = await this._leader.symbol();

    this.setState({ tokenData: { name, symbol } });
  }

  async _clubOfMember() {
    const clubOfMember = await this._leader.clubOfMember(
      this.state.selectedAddress
    );
    this.setState({ clubOfMember });
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
      networkError: "Please connect Metamask to Localhost:8545",
    });

    return false;
  }
}
