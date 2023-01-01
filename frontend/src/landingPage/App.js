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
                    {/* add two buttons */}
                    <div className="app-buttons">
                        <button className="app-button">Documentation</button>
                        <button className="app-button">Whitepaper</button>
                    </div>
                </section>
                <section className="app-body">
                   
                    <p className="app-intro">
                        <strong>Eth Club 7 is a DAO</strong>, a collection of 7-member Clubs that invest the ecosystem token, DAOLE, into businesses, charities and web3 projects.
                    </p>
                    <p className="app-intro">
                        These businesses accept DAOLE as payment, providing:
                    </p>
                    <ul className='app-intro'>
                        <li>A large discount to customers who use the token</li>
                        <li>Utility for the businesses onboarding grant</li>
                        <li>A way for the DAO to earn a return on its investment</li>
                    </ul>
                </section>
                <section className="app-body">
                    <p className="app-intro">
                        <strong>DAOLE is an ERC-20 utility token</strong> that can be used to pay for goods and services of any business in the Eth Club 7 ecosystem.
                    </p>
                    <p className="app-intro">
                        Businesses who accept an onboarding grant agree to accept DAOLE at a rate determined by the <i>Accepted Rate</i> smart contract. 
                    </p>
                    <p className="app-intro">
                        The Accepted Rate is initially set at $0.01 per DAOLE and when the actual price of DAOLE is within 90% of the Accepted Rate, the Accepted Rate doubles.
                    </p>
                </section>
                <section className="app-body">
                    <p className="app-intro">
                        This is an open-source project still under development. The source code can be found on 
                        <a href="https://github.com/BigFatDAO/daole"> GitHub</a>.
                    </p>
                </section>
                {/* add a footer with contact details */}
                <section className='app-footer'>
                    <h3>Contact</h3>
                    <p className="app-intro">
                        Email: <a href="mailto:daole42069@tutanota.com">Eth Club 7</a>
                    </p>
                </section>


        </div>
        );
    }
}