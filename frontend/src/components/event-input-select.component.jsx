import { Fragment } from "react";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '../components/ui/select';
import {Input} from '../components/ui/input';
import { useLogsContext } from "../contexts/logs-context.context";


const EventInputSelect = ({currentLogType}) => {
    const {processSearchQuery,handleSetProcessSearchQuery,processFilterType,handleSetProcessFilterType,fileIOSearchQuery,handleSetFileIOSearchQuery,fileIOFilterType,handleSetFileIOFilterType}=useLogsContext();
    return ( 
        <Fragment>
            {currentLogType === 0 && <Fragment>
                <Input type="search" placeholder='Search logs...' value={processSearchQuery} onChange={(e)=>handleSetProcessSearchQuery(e.target.value)} className={'flex-grow w-auto'} />
                <Select value={processFilterType} onValueChange={handleSetProcessFilterType} >
                    <SelectTrigger>
                        <SelectValue placeholder='Select type'></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Logs">All Logs</SelectItem>
                        <SelectItem value="Process Start">Process Start</SelectItem>
                        <SelectItem value="Process Stop">Process Stop</SelectItem>
                    </SelectContent>
                </Select>
            </Fragment>}
            {currentLogType === 1 && <Fragment>
                <Input type="search" placeholder='Search FileIO...' value={fileIOSearchQuery} onChange={(e)=>handleSetFileIOSearchQuery(e.target.value)} className={'flex-grow w-auto'} />
                <Select value={fileIOFilterType} onValueChange={handleSetFileIOFilterType} >
                    <SelectTrigger>
                        <SelectValue placeholder='Select type'></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Logs">All Logs</SelectItem>
                        <SelectItem value="File Read">File Read</SelectItem>
                        <SelectItem value="File Write">File Write</SelectItem>
                        <SelectItem value="File Rename">File Rename</SelectItem>
                    </SelectContent>
                </Select>
            </Fragment>}
        </Fragment>
     );
}
 
export default EventInputSelect;