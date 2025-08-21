import { Activity,CirclePlay, CircleX, Cpu } from "lucide-react";
import InfoCard from "../components/info-card.component";
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "../components/ui/table";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '../components/ui/select';
import {Input} from '../components/ui/input';
import Header from "../components/header.component";
import ControlOptions from "../components/control-options.component";
import { useLogsContext } from "../contexts/logs-context.context";

const Home = () => {
    const {filterType,handleSetFilterType,filteredLogs,totalEvents,processStartCount,processStopCount,activePids,searchQuery,handleSetSearchQuery}=useLogsContext();

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    };

    return ( 
        <div className="p-2 flex flex-col gap-2">
            <Header/>
            <div className=" p-1 flex">
                <div className="w-[71%]  p-1 flex flex-col">
                    <div className=" h-[520px]">
                    <div className="flex gap-2">
                        <ControlOptions  />
                        <Input type="search" placeholder='Search logs...' value={searchQuery} onChange={(e)=>handleSetSearchQuery(e.target.value)} />
                        <Select value={filterType} onValueChange={handleSetFilterType} >
                            <SelectTrigger>
                                <SelectValue placeholder='Select type'></SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All Logs">All Logs</SelectItem>
                                <SelectItem value="Process Start">Process Start</SelectItem>
                                <SelectItem value="Process Stop">Process Stop</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                        <div className="p-2 h-[450px] overflow-y-auto ">
                        <Table>
                        <TableHeader className="sticky top-0 bg-gray-50 text-[18px]">
                            <TableRow>
                                <TableHead className="px-3 py-2 text-left font-medium text-gray-600">No</TableHead>
                                <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Time</TableHead>
                                <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Event</TableHead>
                                <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Process</TableHead>
                                <TableHead className="px-3 py-2 text-left font-medium text-gray-600">PID</TableHead>
                                <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Parent PID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody >
                            {filteredLogs.map((log, index) => (
                                <TableRow key={index} className="hover:bg-blue-50 transition-colors text-[20px]">
                                    <TableCell className='px-3 py-2 text-gray-600 font-mono'>
                                        {index+1}
                                    </TableCell>
                                    <TableCell className="px-3 py-2 text-gray-600 font-mono ">
                                        {formatTime(log.Timestamp)}
                                    </TableCell>
                                    <TableCell className="px-3 py-2">
                                        <div className="flex items-center">
                                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                                log.EventType === 'ProcessStart' ? 'bg-green-500' : 'bg-red-500'
                                            }`}></span>
                                            <span className="text-gray-900 ">{log.EventType}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-3 py-2 text-gray-900">
                                        {log.ProcessName || '—'}
                                    </TableCell>
                                    <TableCell className="px-3 py-2 text-gray-600 font-mono ">
                                        {log.Pid}
                                    </TableCell>
                                    <TableCell className="px-3 py-2 text-gray-600 font-mono">
                                        {log.Extra?.ParentPid || '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                        </div>
                    </div>
                    <div className=" grow p-1 grid gap-2 grid-cols-[repeat(auto-fit,minmax(270px,1fr))]">
                        <InfoCard name='Total Events' val={totalEvents} Icon={Activity} content={'Total events logged by System'} iconColor={'blue'}  />
                        <InfoCard name='Process Start' val={processStartCount} Icon={CirclePlay} content={'Total number of process starts'} iconColor={'green'} />
                        <InfoCard name='Process Stop' val={processStopCount} Icon={CircleX} content={'Total number of process stops'} iconColor={'red'} />
                        <InfoCard name='Active PIDs' val={activePids.size} Icon={Cpu} content={'Total number of active processes'}  iconColor={'purple'} />
                    </div>
                </div>
                <div className="border grow rounded flex flex-col gap-1 p-1">
                    <h3 className="text-center border p-1">Log Analyzer</h3>
                    <div className="border grow">

                    </div>
                </div>
            </div>
        </div>
     );
}
 
export default Home;