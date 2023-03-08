import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
// import { Dapp } from "./components/Dapp";
import { LandingPage } from "./landingPage/App";
import "bootstrap/dist/css/bootstrap.css";
//importing fonts for Material UI
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';


// create a root
const root = createRoot(document.getElementById("root"));

// This is the entry point of your application, but it just renders the Dapp
// react component. All of the logic is contained in it.

const router = (createBrowserRouter)([
  {path: "/", element: <LandingPage />},
  // {path: "/dapp654", element: <Dapp />},
]);

root.render(<RouterProvider router={router} />);
