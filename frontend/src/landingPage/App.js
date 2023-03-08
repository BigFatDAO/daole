// a landing page for a cryptocurrency

import React, { Component } from "react";
import "./App.css";
import TimelineMUI from "./TimelineMUI";
import Tokenomics from "./Tokenomics";
import logo from "../Eth-Club-7-lighter.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import {
  faTwitter,
  faDiscord,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";

export class LandingPage extends Component {
  render() {
    return (
      <div className="app">
        {/* add a logo and a header */}
        <section className="app-header">
          <img src={logo} className="app-logo" alt="logo" />
          <h1 className="app-title">Eth Club 7</h1>
          <h2 className="app-subtitle">Evolutionary Investment DAO</h2>
          {/* add two buttons */}
          <div className="app-buttons">
            {/* these buttons open up external links */}
            {/* <button
              className="app-button"
              onClick={() => window.open("https://docs.ethclub7.one", "_blank")}
            >
              Documentation
            </button> */}
            <button
              className="app-button"
              onClick={() =>
                window.open("https://github.com/BigFatDAO/daole", "_blank")
              }
            >
              GitHub
            </button>
          </div>
        </section>
        <section className="app-body-intro">
          <p className="app-intro">
            <strong>Eth Club 7</strong> is an ecosystem of 7-member Clubs that
            compete for funds while cooperating to grow the DAO.
          </p>
        </section>
        <section className="app-body">
          <h1 className="app-section-title">How it works</h1>
          <p className="app-body-text">
            The DAO is made up of many 7-member Clubs. Each Club is allocated
            funds monthly, in the form of the ecosystem token, DAOLE, to invest
            as grants to onboard new members.
          </p>
          <p className="app-body-text">
            The amount of funds allocated to each Club is based on the
            transaction volume of their previous investments, allowing the
            better Clubs to grow, and the ecosystem to thrive.
          </p>
          <p className="app-body-text">
            The return on investment for the DAO as a whole comes from a 2% burn on every transaction to a member.
          </p>
        </section>
        <section className="app-body">
          <h1 className="app-section-title">Why Eth Club 7?</h1>
          <p className="app-body-text">
            Allocating funds using small investment clubs and a
            performance-based algorithm provides several benefits over
            token-based voting:
          </p>
          <div className="app-body-text">
            <ul>
              <li>Hundreds of proposals can be implemented simultaneously</li>
              <li>
                Performance is measured and Clubs are held accountable by the
                protocol
              </li>
              <li>
                Larger token holders, who are often exchanges, do not have extra
                power, reducing centralization
              </li>
              <li>
                It's personal and fun: An entire Club can meet in person or
                online to discuss investments
              </li>
            </ul>
          </div>
        </section>
        <section className="app-body">
          <h1 className="app-section-title">Principles and Goals</h1>
          <p className="app-body-text">
            The idea for Eth Club 7 came from the fallout of Harmony One's "100 DAOs" initiative, where the community felt funds were allocated that didn't benefit the Harmony ecosystem. At the same time, during early COVID, there was a lot of talk of the decline of democracy.
          </p>
          <p className="app-body-text">
            The goal of Eth Club 7 is to create a DAO that's democratic but doesn't rely on large-scale votes. Where small groups can work efficiently, and actions that benefit the whole DAO are rewarded.
          </p>
          <p className="app-body-text">
            Eth Club 7 can be viewed as a playground for new ideas. There are many ways a Club can succeed. The low cost of starting a Club encourages innovation and experimentation, and the performance-based funding model rewards success.
          </p>
        </section>
        <section className="app-timeline">
          <h1 className="app-section-title">Roadmap</h1>
          <div>
            <TimelineMUI />
          </div>
        </section>

        <section className="app-tokenomics">
          <h1 className="app-section-title">Tokenomics</h1>
          <Tokenomics />
        </section>

        <section className="app-footer">
          <h1 className="app-contact-title">Contact</h1>
          <p className="app-intro">
            This is an open-source project. Join the conversation below:
          </p>
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
