import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
// import { Dapp } from "./components/Dapp";
import { LandingPage } from "./landingPage/App";
// We import bootstrap here, but you can remove if you want
import "bootstrap/dist/css/bootstrap.css";

// create a root
const root = createRoot(document.getElementById("root"));

// This is the entry point of your application, but it just renders the Dapp
// react component. All of the logic is contained in it.

const router = (createBrowserRouter)([
  {path: "/", element: <LandingPage />},
  // {path: "/dapp", element: <Dapp />},
]);

root.render(<RouterProvider router={router} />);
