//this component contains the subdao functions

import React from "react";
import { Transaction } from "./Transaction";
import { Transfer } from "./Transfer";

export function MemberArea ({ subAddress, transferTokens, tokenSymbol }) {
    return (
        <div>
            <div className="row py-3">
                <div className="col">
                <h2>Member Area</h2>
                <p>You are a member of Club: {subAddress}</p>
                </div>
            </div>
            <h4> Here is a list of functions in the you can call in the subDAO contract </h4>
            <div className="row py-3">
                <div className="col">
                    <Transaction transactionName="Transfer" inputArray={[{label: "to", type: "text"}, {label: "amount", type: "number"}]} transaction={transferTokens} />
                </div>
                <div className="col">
                    <Transaction transactionName="Transfer" inputArray={[{label: "to", type: "text"}, {label: "amount", type: "number"}]} transaction={transferTokens} />
                </div>
                <div className="col">
                    <Transaction transactionName="Transfer" inputArray={[{label: "to", type: "text"}, {label: "amount", type: "number"}]} transaction={transferTokens} />
                </div>
            </div>

        </div>
    );
}