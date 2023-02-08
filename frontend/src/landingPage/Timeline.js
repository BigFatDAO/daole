import React from "react";
import RoadmapItem from "./RoadmapItem";

function Flowchart() {
    // this component has a date in a circle on the left, and a description on the right, with a line connecting them
    return (
        <div className="flowchart">
            <RoadmapItem date="Feb" 
            description="Community Engagement and feedback" />
            <RoadmapItem date="Mar"
            description="Hire additional developers" />
            <RoadmapItem date="Apr"
            description="Test net launch" />
            <RoadmapItem date="May"
            description="Whitelist Auction starts" />
            <RoadmapItem date="Jun"
            description="Whitelist auction finishes" />
            <RoadmapItem date="Jul"
            description="Launch of Eth Club 7" />
            <RoadmapItem date="Beyond"
            description="Developer bounties controlled by the DAO" />
        </div>
    );
  }
  
  export default Flowchart;