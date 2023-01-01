// the documentation page
// Has a sidebar with section headings and links to the sections

import React, { Component } from "react";
import { HashLink } from "react-router-hash-link";
import SideNav from "./SideNav";

export class Documentation extends Component {
    render() {
        return (
            <>
                <SideNav />
                <div className="documentation" id="top">
                    <h1 className="documentation-title">Documentation</h1>
                    <h2 className="documentation-subtitle">Algorithmic Angel Investing</h2>
                    <section className="documentation-section">
                        <h3 className="documentation-section-title" id="introduction">
                            <HashLink to="/documentation#introduction">Introduction</HashLink>
                        </h3>
                        <p className="documentation-section-intro">
                            Eth Club 7 is a DAO, a collection of 7-member Clubs that invest the ecosystem token, DAOLE, into businesses, charities and web3 projects.
                        </p>
                        <p className="documentation-section-intro">
                            These businesses accept DAOLE as payment, providing:
                        </p>
                    </section>
                    <section className="documentation-section">
                        <h3 className="documentation-section-title" id="daole">
                            <HashLink to="/documentation#daole">DAOLE</HashLink>
                        </h3>
                        <p className="documentation-section-intro">
                            DAOLE is an ERC-20 utility token that can be used to pay for goods and services of any business in the Eth Club 7 ecosystem.
                        </p>
                    </section>
                    <section className="documentation-section">
                        <h3 className="documentation-section-title" id="accepted-rate">
                            <HashLink to="/documentation#accepted-rate">Accepted Rate</HashLink>
                        </h3>
                        <p className="documentation-section-intro">
                            Businesses who accept an onboarding grant agree to accept DAOLE at a rate determined by the <i>Accepted Rate</i> smart contract.
                        </p>
                    </section>
                </div>

            </>
        )
    }
}


