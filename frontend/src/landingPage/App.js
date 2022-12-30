// a landing page for a cryptocurrency

import React, { Component } from 'react';
import './App.css';

export class LandingPage extends Component {
    render() {
        return (
            <div className="app">
                {/* add scroll snapping */}
                <section className="app-header">
                    <h1 className="app-title">Eth Club 7</h1>
                    <h2 className="app-subtitle">Algorithmic Angel Investing</h2>
                </section>
                <section className="app-body">
                    <p className="app-intro">
                        Eth Club 7 is a cryptocurrency that is backed by a portfolio of 7 of the top 100 cryptocurrencies. The portfolio is rebalanced every 24 hours to maintain a 14.28% allocation to each cryptocurrency. The portfolio is managed by a smart contract that is controlled by a group of 7 angel investors. The angel investors are incentivized to maintain the portfolio by receiving a 1% fee on all transactions.
                    </p>
                    <p className="app-intro">
                        The smart contract is deployed on the Ethereum blockchain and is open source. The source code can be found on 
                        <a href="https://github.com/BigFatDAO/daole"> GitHub</a>.
                    </p>
                </section>
                <section className="app-body">
                    <p className="app-intro">
                        The smart contract is deployed on the Ethereum blockchain and is open source. The source code can be found on 
                        <a href="https://github.com/BigFatDAO/daole"> GitHub</a>.
                    </p>
                </section>
                {/* add a footer with contact details */}
                <section className='app-footer'>
                    <p className="app-intro">
                        Contact: <a href="mailto:daole42069@tutanota.com">Eth Club 7</a>
                    </p>
                </section>

        </div>
        );
    }
}