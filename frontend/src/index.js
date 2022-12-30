import React from "react";
import ReactDOM from "react-dom";
import { Dapp } from "./components/Dapp";
import { LandingPage } from "./landingPage/App";

// We import bootstrap here, but you can remove if you want
import "bootstrap/dist/css/bootstrap.css";

//use app.css for the landing page
import "./landingPage/App.css";

// This is the entry point of your application, but it just renders the Dapp
// react component. All of the logic is contained in it.

// get the url
const url = new URL(window.location.href);
//split the url into an array
const urlArray = url.pathname.split("/");
//get the last item in the array
const lastItem = urlArray[urlArray.length - 1];
// if the last item is dapp, render the dapp
if (lastItem === "dapp") {
  ReactDOM.render(<Dapp />, document.getElementById("root"));
} else {
  // otherwise render the landing page
  ReactDOM.render(<LandingPage />, document.getElementById("root"));
}
