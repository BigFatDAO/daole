import React from "react";
import { PieChart, Pie, Tooltip} from "recharts";

const data01 = [
  { name: "Liquidity", value: 3500, fill: "#61d9fa" },
  { name: "Treasury", value: 1500, fill: "#61fb6b" },
  { name: "Grants", value: 5000, fill: "#d733c4" },
];
const data02 = [
  { name: "Yield Farm", value: 3000, fill: "#00b1e2" },
  { name: "Launch Liquidity", value: 500, fill: "#afeeff" },
  { name: "Ongoing DAO controlled", value: 1000, fill: "#01b00d" },
  { name: "Pre-Launch Team", value: 500, fill: "#b0ffb5" },
  { name: "Ongoing Grants", value: 4700, fill: "#c314ae" },
  { name: "Founding Clubs", value: 300, fill: "#fa66e9" },
];

function getIntroOfPage(label) {
  switch(label) {
    case "Liquidity":
      return "500M at launch, 3B in yield farm";
    case "Treasury":
      return "500M pre-launch team: Locked 6 months + 100 days, 1B controlled DAO after launch";
    case "Grants":
      return "300M to founding Clubs, 4.7B released over time to Clubs on a performance basis";
    case "Yield Farm":
      return "3B released over 7 years";
    case "Launch Liquidity":
      return "500M put into liquidity at launch with the ONE from launch auction";
    case "Ongoing DAO controlled":
      return "1B to be distributed as grants by the DAO, voted on per-token basis";
    case "Pre-Launch Team":
      return "500M split between team who worked on the project before launch";
    case "Ongoing Grants":
      return "4.7B minted at 4% of remaining supply every 4 weeks";
    case "Founding Clubs":
      return "3M to every founding club";
    default:
      return "";
  }
}

function CustomTooltip({ payload, active }) {
  if (active) {
    let labelNumber = "bbb";

    if (payload[0].value < 1000) {
      labelNumber = payload[0].value + "M";
    } else {
      labelNumber = Math.round(payload[0].value / 100) / 10 + "B";
    }

    return (
      <div className="custom-tooltip">
        <p className="label">{`${payload[0].name} : ${labelNumber}`}</p>
        <p className="intro">{getIntroOfPage(payload[0].name)}</p>
      </div>
    );
  }

  return null;
}

const MyComponent = () => {
  return (
    <div className="my-component">
      {window.innerWidth >= 500 ? <DesktopComponent /> : <MobileComponent />}
    </div>
  );
};

export default MyComponent;

function DesktopComponent() {
  return (
    <div className="pie-container">
      <p className="app-body-text-center">Token Distribution, in Millions.</p>
      <PieChart width={400} height={300}>
        <Pie
          data={data01}
          dataKey="value"
          cx="50%"
          cy="50%"
          outerRadius={70}
          stroke="#282c34"
        />
        <Tooltip content={<CustomTooltip />} />
        <Pie
          data={data02}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={90}
          paddingAngle={1}
          label
          stroke="#282c34"
        />
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
      <p className="app-body-text-center">Hover for details.</p>
    </div>
  );
}

function MobileComponent() {
  return (
    <div className="pie-container">
      <p className="app-body-text-center">Token Distribution, in Millions.</p>
      <PieChart width={250} height={250}>
        <Pie
          data={data01}
          dataKey="value"
          cx="50%"
          cy="50%"
          outerRadius={50}
          stroke="#282c34"
        />
        <Tooltip content={<CustomTooltip />} />
        <Pie
          data={data02}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={70}
          paddingAngle={1}
          stroke="#282c34"
          label
        />
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
      <p className="app-body-text-center">Click for details.</p>
    </div>
  );
}
