import React from "react";

function RoadmapItem(props) {
  return (
    <div className="flowchart-item">
      <div className="flowchart-item-date">
        <div className="flowchart-item-date-circle">{props.date}</div>
      </div>
      <div className="flowchart-item-description">{props.description}</div>
    </div>
  );
}

export default RoadmapItem;
