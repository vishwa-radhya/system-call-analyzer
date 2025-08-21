import { Fragment, useState } from "react";
import OptionButton from "./option-button.component";
import { Play,Pause,Trash,Download } from "lucide-react";
import { useLogsContext } from "../contexts/logs-context.context";

const ControlOptions = () => {
    const [isPaused,setIsPaused]=useState(false);
    const {sendControlCommand}=useLogsContext();
    const handlePlayPause=()=>{
        const command = isPaused ? "START" : "STOP";
        sendControlCommand(command);
        setIsPaused(prev=>!prev)
      }
    return ( 
        <Fragment>
            <OptionButton Icon={isPaused ?Play : Pause} text={isPaused?'Resume':'Stop'} handleClick={handlePlayPause} />
            <OptionButton Icon={Trash} text='Clear' />
            <OptionButton Icon={Download} text='Export' />
        </Fragment>
     );
}
 
export default ControlOptions;