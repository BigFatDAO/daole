//this component contains the Club functions

import React from "react";

export function MemberArea (props) {
    return (
        <div>
            <div className="row py-3">
                <div className="col">
                    <h2>Member Area</h2>
                    <p>You are a member of Club: <b>{props.subAddress}</b></p>
                    <p>Club Members: {props.clubMembers}</p>
                    <p>Club balance: {props.effectiveBalance}</p>
                    <p>Open Votes: {props.openVotes}</p>
                </div>
            </div>
        </div>
    );
}