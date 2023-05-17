import React, { useState } from "react";
import "./navbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

const Navbar = ({ page }) => {
  console.log("page:", page);
  const [isOpen, setIsOpen] = useState(false);
  const toggleNav = () => {
    setIsOpen(!isOpen);
  };
  const allItems = {
    preLaunch: [
      { title: "Prelaunch", path: "/" },
      { title: "Dashboard", path: "/dashboard" },
      { title: "Profile", path: "/profile" },
      { title: "Logout", path: "/logout" },
    ],
    memberDash: [
      { title: "Members", path: "/" },
      { title: "Dashboard", path: "/dashboard" },
      { title: "Profile", path: "/profile" },
      { title: "Logout", path: "/logout" },
    ],
  };
  const navItems = allItems[page];

  return (
    <div className="navbar">
        <div className="nav-header">
            DAO 7.1
        </div>
      <nav className={`nav ${isOpen ? "nav-open" : ""}`}>
        <button className="nav-toggle" onClick={toggleNav}>
          <span className="sr-only">Toggle navigation</span>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <a href={item.path}>{item.title}</a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
