// a landing page for a cryptocurrency

import React, { Component } from 'react';
import './App.css';
import logo from '../Eth-Club-7-lighter.png'
import sankey from '../Sankey2.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope} from '@fortawesome/free-solid-svg-icons'
import { faTwitter, faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons'

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
                        {/* these buttons open up external links */}
                        <button className="app-button" onClick={() => window.open("https://docs.ethclub7.one", "_blank")}>Documentation</button>
                        <button className="app-button" onClick={() => window.open("https://github.com/BigFatDAO/daole", "_blank")}>GitHub</button>
                    </div>
                </section>
                <section className="app-body-intro">
                    <p className="app-intro">
                        <strong>Eth Club 7 is a DAO</strong>, providing a way to invest in the millions of small businesses and startups around the world.
                    </p>
                </section>
                <section className="app-body">
                    <h1 className="app-section-title">How it works</h1>
                    <p className="app-body-text">
                        The DAO is made up of businesses and split into 7-member Clubs, each responsible for investing part of the ecosystem's token, DAOLE, as grants to onboard new businesses.
                    </p>
                    <p className="app-body-text">
                        A Club's performance is measured by the transaction volume of the businesses it has added. Better performing Clubs are allocated more funds for future rounds.
                    </p>
                    <p className="app-body-text">
                        2% of every transaction is burned, returning funds to the DAO, and every month 4% of the remaining DAOLE supply is minted to Clubs to invest, proportional to their performance.
                    </p>
                </section>

                <section className="app-body">
                    <h1 className="app-section-title">Why DAOLE?</h1>
                    <p className="app-body-text">
                        Customer adoption is encouraged by businesses accepting DAOLE at a discounted rate, called the Accepted Rate (AR).
                    </p>
                    <p className="app-body-text">
                        AR is published via a smart contract and initially set to $0.001/DAOLE. When the market price reaches 90% of AR, AR doubles, establishing a new floor.
                    </p>
                    <p className="app-body-text">
                        This creates a virtuous cycle of adoption and price appreciation, where businesses are incentivized to accept DAOLE and customers are incentivized to use it.
                    </p>
                </section>
                <section className="app-body">
                    <h1 className="app-section-title">Why Eth Club 7?</h1>
                    <p className="app-body-text">
                        Allocating funds using small investment clubs and a performance-based algorithm provides several benefits over token-based voting:
                    </p>
                    <div className="app-body-text">
                        <ul>
                            <li>Hundreds of proposals can be implemented simultaneously</li>
                            <li>Performance is measured and Clubs are held accountable by the protocol</li>
                            <li>Larger token holders, who are often exchanges, do not have extra power, reducing centralization</li>
                            <li>It's personal and fun: An entire Club can meet in person or online to discuss investments</li>
                         </ul>
                    </div>
                </section>

                <section className="app-body">
                    <h1 className="app-section-title">Tokenomics</h1>
                        <img src={sankey} className="sankey" alt="Eth Club 7 Daole Tokenomics" />
                </section>
                <section className="app-body">
                    <p className="app-intro">
                        This is an open-source project. The source code can be found on 
                        <a href="https://github.com/BigFatDAO/daole"> GitHub</a>.
                    </p>
                </section>
                <section className='app-footer'>
                    <h3>Contact</h3>
                    <div className="app-contacts">
                        <div className="app-contact">
                            <a href="mailto:daole42069@tutanota.com">
                                <FontAwesomeIcon icon={faEnvelope} size="1x" />
                            </a>
                        </div>
                        <div className="app-contact">
                            <a href="https://twitter.com/DaoleBillYall">
                                <FontAwesomeIcon icon={faTwitter} size="1x" />
                            </a>
                        </div>
                        <div className="app-contact">
                            <a href="https://discord.gg/pp4h2SHZf9">
                                <FontAwesomeIcon icon={faDiscord} size="1x" />
                            </a>
                        </div>
                        <div className="app-contact">
                            <a href="https://github.com/BigFatDAO/daole">
                                <FontAwesomeIcon icon={faGithub} size="1x" />
                            </a>
                        </div>
                    </div>
                </section>

        </div>
        );
    }
}