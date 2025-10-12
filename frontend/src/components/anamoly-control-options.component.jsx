import { Fragment } from "react";
import OptionButton from "./option-button.component";
import { Trash } from "lucide-react";
import { useLogsContext } from "../contexts/logs-context.context";

const AnamolyControlOptions = () => {
    const {handleClearAnomalyData}=useLogsContext();
    const handleClearAnomalyLogs=()=>{
        handleClearAnomalyData();
    }
    return ( 
        <Fragment>
            <OptionButton Icon={Trash} text='Clear' handleClick={handleClearAnomalyLogs} />
        </Fragment>
     );
}
 
export default AnamolyControlOptions;