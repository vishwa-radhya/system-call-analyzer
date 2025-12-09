import { Fragment } from "react";
import OptionButton from "./option-button.component";
import { LayoutPanelLeft, Trash, X } from "lucide-react";
import { useLogsContext } from "../contexts/logs-context.context";

const AnamolyControlOptions = ({isAnomalyAnalyzerOpen,setIsAnomalyAnalyzerOpen}) => {
    const {handleClearAnomalyData}=useLogsContext();
    const handleClearAnomalyLogs=()=>{
        handleClearAnomalyData();
    }
    return ( 
        <Fragment>
            <OptionButton Icon={Trash} text='Clear' handleClick={handleClearAnomalyLogs} />
            <OptionButton Icon={isAnomalyAnalyzerOpen ? X : LayoutPanelLeft} text={'Anomaly analyzer'} handleClick={()=>setIsAnomalyAnalyzerOpen(!isAnomalyAnalyzerOpen)} />
        </Fragment>
     );
}
 
export default AnamolyControlOptions;