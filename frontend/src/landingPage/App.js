// a landing page for a cryptocurrency

import React, { Component } from 'react';
import './App.css';
import logo from '../Eth-Club-7-lighter.png'
import sankey from '../Sankey2.png'

export class LandingPage extends Component {
    render() {
        return (
            <div className="app">
                {/* add a logo and a header */}
                <section className="app-header">
                    <img src={logo} className="app-logo" alt="logo" />
                    <h1 className="app-title">Eth Club 7</h1>
                    <h2 className="app-subtitle">Algorithmic Angel Investment</h2>
                    {/* add two buttons */}
                    <div className="app-buttons">
                        <button className="app-button">Documentation</button>
                        <button className="app-button">GitHub</button>
                    </div>
                </section>
                <section className="app-body">
                   
                    <p className="app-intro">
                        <strong>Eth Club 7 is a DAO</strong>, providing a way to invest in the millions of small businesses and startups around the world.
                    </p>
                </section>
                <section className="app-body">
                    <p className="app-intro">
                        <strong>Return on investment</strong> comes in the form of adoption, rather than asset price increases, because most small businesses don't have a coin or stock price to measure.
                    </p>
                </section>
                <section className="app-body">
                    <p className="app-intro">
                        Instead of the entire DAO voting on investments together, the DAO is made up of 7-member Clubs, each responsible for investing their portion of the ecosystem's ERC-20 token, DAOLE, as grants to onboard new businesses.
                    </p>
                </section>
                <section className="app-body">
                    <p className="app-intro">
                        A Club's performance is measured by the transaction volume of the businesses they have previously added, and better performing Clubs are allocated more funds to invest in future rounds.
                    </p>
                </section>
                <section className="app-body">
                    <p className="app-intro">
                        2% of every transaction to members is burned, returning funds to the DAO, and every month 4% of the remaining DAOLE supply is minted to the Clubs to invest, proportional to their performance in previous months.
                    </p>
                </section>
                <section className="app-body">
                    <p className="app-intro">
                        Adoption of the ecosystem token DAOLE is encouraged by businesses accepting it at an agreed upon discounted rate, called the Accepted Rate (AR).
                    </p>
                    <p className="app-intro">
                        AR is published via a smart contract and is initially set to $0.001/DAOLE. Every time the real market price of DAOLE reaches 90% of AR, AR doubles, thus establishing a new floor.
                    </p>
                </section>
                <section className="app-body">
                    <p className="app-intro">
                        Allocating funds using small investment clubs and a performance-based algorithm provides several benefits over the standard DAO voting process:
                    </p>
                    <p className="app-intro">
                        <ul>
                            <li>It's much faster and more efficient</li>
                            <li>Hundreds of proposals can be implimented simultaneously</li>
                            <li>Investment performance is measured and Clubs are held accountable by the protocol</li>
                            <li>Larger token holders, who may not make better investment decisions, do not have extra power</li>
                            <li>In many crypto projects, the largest token holders are centralised exchanges</li>
                         </ul>
                    </p>
                </section>
                <section className="app-body">
                    <p className="app-intro">
                        This is an open-source project. The source code can be found on 
                        <a href="https://github.com/BigFatDAO/daole"> GitHub</a>.
                    </p>
                </section>
                <section className="app-body">
                    <img src={sankey} className="sankey" alt="Token Distribution"/>
                </section>
                {/* add a footer with contact details */}
                <section className='app-footer'>
                    <h3>Contact</h3>
                    <p className="app-intro">
                        Email: <a href="mailto:daole42069@tutanota.com">Eth Club 7</a>
                    </p>
                    <p className="app-intro">
                        Twitter: <a href="https://twitter.com/DaoleBillYall">@DaoleBillYall</a>
                    </p>
                </section>

        </div>
        );
    }
}