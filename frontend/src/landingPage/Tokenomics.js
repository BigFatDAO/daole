import React from "react";
import TokeChart from "./TokeChart";

export default function Tokenomics() {

  return (
    <div>
        <div className="row no-gutters justify-content-between" style={{ width: "80vw"}}>
          <div className="col-sm-12 col-md-6 pb-5 app-body-text">
            <p>The Max Supply is 10 billion, divided as follows:</p>
            <div>
              <ul>
                <li>
                  3.5B: Liquidity
                  <ul>
                    <li>500M at launch</li>
                    <li>3B in yield farm</li>
                  </ul>
                </li>
                <li>
                  1.5B: Treasury
                  <ul>
                    <li>500M pre-launch team: Locked 6 months + 100 days</li>
                    <li>1B controlled DAO after launch</li>
                  </ul>
                </li>
                <li>
                  5B: Funding for grants
                  <ul>
                    <li>3M to every founding Club</li>
                    <li>4.7B released at 4% of remaining supply/4 weeks</li>
                  </ul>
                </li>
              </ul>
              Note: All grants are locked for 6 months then released linearly
              over 100 days.
            </div>
          </div>
          <div className="col-sm-12 col-md-6 pb-5">
            <TokeChart />
          </div>
        </div>
      </div>
  );
}
