import { Fragment } from "react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useLogsContext } from "../contexts/logs-context.context";

const AnamolyEventInputSelect = () => {
    const {anomalySearchQuery,handleSetAnomalySearchQuery,anomalyFilterType,handleSetAnomalyFilterType}=useLogsContext();
    return ( 
        <Fragment>
            <Input type="search" placeholder='Search anamoly logs...' value={anomalySearchQuery} onChange={(e)=>handleSetAnomalySearchQuery(e.target.value)} className={'flex-grow w-auto'} />
            <Select value={anomalyFilterType} onValueChange={handleSetAnomalyFilterType}>
                <SelectTrigger>
                    <SelectValue placeholder='Select type'>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All Logs">All Logs</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                </SelectContent>
            </Select>
        </Fragment>
     );
}
 
export default AnamolyEventInputSelect;