//this component contains the subdao functions

import React from "react";

export function MemberArea ({ subAddress }) {
    return (
        <div className="container">
        <div className="row">
            <div className="col-12">
            <h2>Member Area</h2>
            <p>You are a member of Club: {subAddress}</p>
            </div>
            
        </div>
        </div>
    );
}