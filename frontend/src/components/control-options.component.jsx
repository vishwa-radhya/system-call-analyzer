import { Fragment, useState } from "react";
import OptionButton from "./option-button.component";
import { Play,Pause,Trash,Download,X,LayoutPanelLeft } from "lucide-react";
import { useLogsContext } from "../contexts/logs-context.context";
import { toast } from "sonner";

const ControlOptions = ({isLogAnalyzerOpen,setIsLogAnalyzerOpen}) => {
    const [isPaused,setIsPaused]=useState(false);
    const {sendControlCommand,filteredLogs}=useLogsContext();
    const handlePlayPause=()=>{
        const command = isPaused ? "START" : "STOP";
        sendControlCommand(command);
        setIsPaused(prev=>!prev)
      }
      const handleClearLogs=()=>{
        if(filteredLogs.length===0){
            toast.info('The log table is already cleared.')
        }
        sendControlCommand("CLEAR_LOGS")
      }
      const handleLogAnalyzerButton=()=>{
        setIsLogAnalyzerOpen(!isLogAnalyzerOpen);
      }
    return ( 
        <Fragment>
            <OptionButton Icon={isPaused ?Play : Pause} text={isPaused?'Resume':'Stop'} handleClick={handlePlayPause} />
            <OptionButton Icon={Trash} text='Clear' handleClick={handleClearLogs} />
            <OptionButton Icon={isLogAnalyzerOpen ? X : LayoutPanelLeft} text={'Log analyzer'} handleClick={handleLogAnalyzerButton} />
        </Fragment>
     );
}
 
export default ControlOptions;