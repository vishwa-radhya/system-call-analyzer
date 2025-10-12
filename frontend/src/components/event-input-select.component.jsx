import { Fragment } from "react";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '../components/ui/select';
import {Input} from '../components/ui/input';
import { useLogsContext } from "../contexts/logs-context.context";


const EventInputSelect = ({currentLogType}) => {
    const {processSearchQuery,handleSetProcessSearchQuery,processFilterType,handleSetProcessFilterType,fileIOSearchQuery,handleSetFileIOSearchQuery,fileIOFilterType,handleSetFileIOFilterType,networkSearchQuery,handleSetNetworkSearchQuery,networkFilterType,handleSetNetworkFilterType}=useLogsContext();
    return ( 
        <Fragment>
            {currentLogType === 0 && <Fragment>
                <Input type="search" placeholder='Search logs by name...' value={processSearchQuery} onChange={(e)=>handleSetProcessSearchQuery(e.target.value)} className={'flex-grow w-auto'} />
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
                <Input type="search" placeholder='Search FileIO by name...' value={fileIOSearchQuery} onChange={(e)=>handleSetFileIOSearchQuery(e.target.value)} className={'flex-grow w-auto'} />
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
            {
                currentLogType===2 && <Fragment>
                    <Input type="search" placeholder='Search Network by name...' value={networkSearchQuery} onChange={(e)=>handleSetNetworkSearchQuery(e.target.value)} className={'flex-grow w-auto'} />
                     <Select value={networkFilterType} onValueChange={handleSetNetworkFilterType} >
                    <SelectTrigger>
                        <SelectValue placeholder='Select type'></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Logs">All Logs</SelectItem>
                        <SelectItem value="Network Connect">Netowrk Connect</SelectItem>
                        <SelectItem value="Network Disconnect">Network Disconnect</SelectItem>
                    </SelectContent>
                </Select>
                </Fragment>
            }
        </Fragment>
     );
}
 
export default EventInputSelect;