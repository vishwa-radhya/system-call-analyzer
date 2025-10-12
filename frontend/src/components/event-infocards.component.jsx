import { Fragment } from "react";
import { Activity,CirclePlay,CircleX,Cpu,FileBox,FileOutput,FileInput,FilePen,ArrowUpDown,Cloud,CloudOff,ShieldOff, SignalLow, SignalMedium, SignalHigh } from "lucide-react";
import { useLogsContext } from "../contexts/logs-context.context";
import InfoCard from "./info-card.component";

const EventInfoCards = ({currentLogType,isAnamolyInfoCards=false}) => {
    const {eventCounts,activePids,filteredAnomalies}=useLogsContext();
    return ( 
         <Fragment>
            { (currentLogType===0 && !isAnamolyInfoCards) && <Fragment>
            <InfoCard name='Total Process Events' val={(eventCounts?.ProcessStart+eventCounts?.ProcessStop) || 0} Icon={Activity} content={'Total Process events logged by System'} iconColor={'blue'}  />
            <InfoCard name='Process Start' val={eventCounts?.ProcessStart || 0} Icon={CirclePlay} content={'Total number of process starts'} iconColor={'green'} />
            <InfoCard name='Process Stop' val={eventCounts?.ProcessStop || 0} Icon={CircleX} content={'Total number of process stops'} iconColor={'red'} />
            <InfoCard name='Active PIDs' val={activePids.size} Icon={Cpu} content={'Total number of active processes'}  iconColor={'purple'} />
            </Fragment>}
            {(currentLogType===1 && !isAnamolyInfoCards) && <Fragment>
            <InfoCard name='Total FileIO Events' val={((eventCounts?.FileRead || 0)+(eventCounts?.FileWrite || 0)+(eventCounts?.FileRename || 0)) || 0} Icon={FileBox} content={'Total FileIO events logged by System'} iconColor={'blue'}  />
            <InfoCard name='File Reads' val={eventCounts?.FileRead || 0} Icon={FileOutput} content={'Total number of file reads'} iconColor={'green'} />
            <InfoCard name='File Writes' val={eventCounts?.FileWrite || 0} Icon={FileInput} content={'Total number of file writes'} iconColor={'red'} />
            <InfoCard name='File Renames' val={eventCounts?.FileRename || 0} Icon={FilePen} content={'Total number of file renames'}  iconColor={'purple'} />
            </Fragment>}
            {(currentLogType===2 && !isAnamolyInfoCards) && <Fragment>
                <InfoCard name='Total Network Events' val={((eventCounts?.NetworkConnect || 0)+(eventCounts?.NetworkDisconnect || 0)) || 0} content={'Total Network events logged by System'} Icon={ArrowUpDown} iconColor={'blue'} />
                <InfoCard name='Network Connect' val={eventCounts?.NetworkConnect || 0} content={'Total number of network connects'} Icon={Cloud} iconColor={'green'} />
                <InfoCard name='Network Disconnect' val={eventCounts?.NetworkDisconnect || 0} content={'Total number of network disconnects'} Icon={CloudOff} iconColor={'red'} />
            </Fragment>}
            {isAnamolyInfoCards && <Fragment>
                <InfoCard name='Total Anomalies' val={filteredAnomalies?.length || 0} content={'Total anomalies recorded by system'} Icon={ShieldOff} iconColor={'blue'} />
                <InfoCard name='Low Severity' val={eventCounts?.low || 0} content={'Total events flagged as low threats'} Icon={SignalLow} iconColor={'green'} />
                <InfoCard name='Medium Severity' val={eventCounts?.medium || 0} content={'Total events flagged as medium threats'} Icon={SignalMedium} iconColor={'orange'} />
                <InfoCard name='High Severity' val={eventCounts?.high || 0} content={'Total events flagged as high threats'} Icon={SignalHigh} iconColor={'red'} />
            </Fragment>}
        </Fragment>
     );
}
 
export default EventInfoCards;