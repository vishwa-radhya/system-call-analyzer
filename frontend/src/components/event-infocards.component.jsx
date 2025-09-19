import { Fragment } from "react";
import { Activity,CirclePlay,CircleX,Cpu,FileBox,FileOutput,FileInput,FilePen } from "lucide-react";
import { useLogsContext } from "../contexts/logs-context.context";
import InfoCard from "./info-card.component";

const EventInfoCards = ({currentLogType}) => {
    const {eventCounts,activePids}=useLogsContext();
    return ( 
         <Fragment>
            {currentLogType===0 && <Fragment>
            <InfoCard name='Total Process Events' val={(eventCounts?.ProcessStart+eventCounts?.ProcessStop) || 0} Icon={Activity} content={'Total Process events logged by System'} iconColor={'blue'}  />
            <InfoCard name='Process Start' val={eventCounts?.ProcessStart || 0} Icon={CirclePlay} content={'Total number of process starts'} iconColor={'green'} />
            <InfoCard name='Process Stop' val={eventCounts?.ProcessStop || 0} Icon={CircleX} content={'Total number of process stops'} iconColor={'red'} />
            <InfoCard name='Active PIDs' val={activePids.size} Icon={Cpu} content={'Total number of active processes'}  iconColor={'purple'} />
            </Fragment>}
            {currentLogType===1 && <Fragment>
            <InfoCard name='Total FileIO Events' val={((eventCounts?.FileRead || 0)+(eventCounts?.FileWrite || 0)+(eventCounts?.FileRename || 0)) || 0} Icon={FileBox} content={'Total FileIO events logged by System'} iconColor={'blue'}  />
            <InfoCard name='File Reads' val={eventCounts?.FileRead || 0} Icon={FileOutput} content={'Total number of file reads'} iconColor={'green'} />
            <InfoCard name='File Writes' val={eventCounts?.FileWrite || 0} Icon={FileInput} content={'Total number of file writes'} iconColor={'red'} />
            <InfoCard name='File Renames' val={eventCounts?.FileRename || 0} Icon={FilePen} content={'Total number of file renames'}  iconColor={'purple'} />
            </Fragment>}
        </Fragment>
     );
}
 
export default EventInfoCards;