import * as React from "react";
import Timeline from "@mui/lab/Timeline";
import TimelineItemComponent from "./TimelineItemComponent";
import {
  timelineOppositeContentClasses,
} from '@mui/lab/TimelineOppositeContent';
import RedditIcon from '@mui/icons-material/Reddit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import LaunchIcon from '@mui/icons-material/Launch';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import Diversity1Icon from '@mui/icons-material/Diversity1';

export default function CustomizedTimeline() {
  return (
    <Timeline  sx={{
      [`& .${timelineOppositeContentClasses.root}`]: {
        flex: 0.2,
      },
    }}>
      <TimelineItemComponent date="Feb 2023" title="Community Engagement" description="Engage community and get feedback for improvements." icon={<RedditIcon sx={{ color: '#282c34'}}/>} />
    <TimelineItemComponent date="Mar 2023" title="Team Building" description="Hire additional developers and create multisig to own contracts." icon={<GroupAddIcon sx={{ color: '#282c34'}}/>} />
    <TimelineItemComponent date="Apr 2023" title="Testnet launch" description="Launch Eth Club 7 on test net." icon={<LaunchIcon sx={{ color: '#282c34'}}/>} />
    <TimelineItemComponent date="May 2023" title="Whitelist Auction starts" description="Start the NFT auction to find our founding members." icon={<GavelIcon sx={{ color: '#282c34'}}/>} />
    <TimelineItemComponent date="Jun 2023" title="Whitelist auction finishes" description="Close the auction, add ONE and DAOLE to LP, and prepare for launch." icon={<CheckCircleOutlineIcon sx={{ color: '#282c34'}}/>} />
    <TimelineItemComponent date="Jul 2023" title="Launch of Eth Club 7" description="Launch Eth Club 7 to the mainnet" icon={<RocketLaunchIcon sx={{ color: '#282c34'}}/>} />
    <TimelineItemComponent date="Beyond" title="Development taken over by DAO" description="The DAO will be responsible for allocating further development funds." icon={<Diversity1Icon sx={{ color: '#282c34'}}/>} />
      
    </Timeline>
  );
}
