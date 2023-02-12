import * as React from "react";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import TimelineDot from "@mui/lab/TimelineDot";
import Typography from "@mui/material/Typography";

export default function TimelineItemComponent(props) {
  return (
    <TimelineItem>
      <TimelineOppositeContent
        sx={{ m: "auto 0"}}
        variant="body2"
        color="#a7bea9"
        fontSize={"calc(9px + 1.1vmin)"}
        fontWeight={1}
      >
        {props.date}
      </TimelineOppositeContent>
      <TimelineSeparator >
        <TimelineConnector />
        <TimelineDot>
          {props.icon}
        </TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent sx={{ py: "12px", px: 2, width: "70vw", maxWidth: "900px" }}
      >
        <Typography variant="h6" fontSize={"calc(12px + 1.1vmin)"}  color='#61dafb' >
          {props.title}
        </Typography>
        <Typography color='#ddf8ff' fontSize={"calc(10px + 1.1vmin)"}>
          {props.description}
        </Typography>
      </TimelineContent>
    </TimelineItem>
  );
}
