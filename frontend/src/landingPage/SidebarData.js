import React from "react";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import * as IoIcons from "react-icons/io";

export const SidebarData = [
  {
    title: "Home",
    path: "/documentation#top",
    icon: <AiIcons.AiFillHome />,
    cName: "nav-text",
  },
  {
    title: "Introduction",
    path: "/documentation#introduction",
    icon: <IoIcons.IoIosPaper />,
    cName: "nav-text",
  },
  {
    title: "DAOLE",
    path: "/documentation#daole",
    icon: <FaIcons.FaCartPlus />,
    cName: "nav-text",
  },
  {
    title: "Accepted Rate",
    path: "/documentation#accepted-rate",
    icon: <IoIcons.IoMdPeople />,
    cName: "nav-text",
  },
  {
    title: "Messages",
    path: "/messages",
    icon: <FaIcons.FaEnvelopeOpenText />,
    cName: "nav-text",
  },
  {
    title: "Support",
    path: "/support",
    icon: <IoIcons.IoMdHelpCircle />,
    cName: "nav-text",
  },
];