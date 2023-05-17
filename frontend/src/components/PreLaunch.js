import React, { useState } from "react";
import { ethers } from "ethers";

export function PreLaunch(props) {
  //set the state
  const [isLoading, setIsLoading] = useState(false);
  const [clubCount, setClubCount] = useState();
  const [isWhitelisted, setIsWhitelisted] = useState();
  // const [error, setError] = useState();
  numberOfClubs();
  whiteListed();

  // // EVM Time:{" "}
  // {new Date(this.state.blockTime * 1000).toLocaleTimeString([], {
  //   year: "numeric",
  //   month: "short",
  //   day: "numeric",
  //   hour: "2-digit",
  //   minute: "2-digit",
  // })}
  // <br />
  // Real Time:{" "}
  // {new Date(Date.now()).toLocaleTimeString([], {
  //   hour: "2-digit",
  //   minute: "2-digit",
  // })}

  // display loading if the user is waiting for a transaction
  if (isLoading) {
    return (
      <>
      <div className="countDown">
        <div className="infoCard">
          <p>Loading...</p>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <div className="infoCard">
        <p>Welcome {props.address}</p>
        <p>There are {clubCount} people on the whitelist so far</p>
        {/* if user is whitelisted display refund button, if not display add to wl button */}
        {isWhitelisted ? (
          <>
            <p>You are on the Whitelist</p>
            <button onClick={refund}>Remove and refund me</button>
          </>
        ) : (
          <>
            <p>You are not on the Whitelist</p>
            <button onClick={addToWhiteList}>Add me to the Whitelist</button>
          </>
        )}
      </div>
    </>
  );

  // This is the public component so only the public functions are here
  // Check number of clubs
  async function numberOfClubs() {
    const clubCount = await props.whitelist.totalClubs();
    setClubCount(clubCount.toString());
  }
  // check if the user is whitelisted
  async function whiteListed() {
    const isWhitelisted = await props.whitelist.whiteList(props.address);
    setIsWhitelisted(isWhitelisted);
  }

  // buy into the whitelist
  async function addToWhiteList() {
    setIsLoading(true);
    try {
      const tx = await props.whitelist.addToWhiteList(props.address, {
        value: ethers.utils.parseEther("1000"),
      });
      await tx.wait();
      await numberOfClubs();
      await whiteListed();
      setIsLoading(false);
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  }
  // refund
  async function refund() {
    setIsLoading(true);
    try {
      const tx = await props.whitelist.refund();
      await tx.wait();
      await numberOfClubs();
      await whiteListed();
      setIsLoading(false);
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  }
}
