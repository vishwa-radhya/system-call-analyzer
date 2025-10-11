import { Fragment } from "react";
import OptionButton from "./option-button.component";
import { Trash } from "lucide-react";

const AnamolyControlOptions = () => {
    const handleClearAnomalyLogs=()=>{

    }
    return ( 
        <Fragment>
            <OptionButton Icon={Trash} text='Clear' handleClick={handleClearAnomalyLogs} />
        </Fragment>
     );
}
 
export default AnamolyControlOptions;