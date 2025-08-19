import LogsViewer from "../components/LogsViewer";
import { Activity } from "lucide-react";
import InfoCard from "../components/info-card.component";
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "../components/ui/table";
const dataArray=[
    {"Timestamp":"2025-08-19T16:43:37.3230197+05:30","EventType":"ProcessStop","ProcessName":"","Pid":7592,"FilePath":null,"Extra":null},
{"Timestamp":"2025-08-19T16:43:37.3257062+05:30","EventType":"ProcessStop","ProcessName":"","Pid":17024,"FilePath":null,"Extra":null},
{"Timestamp":"2025-08-19T16:43:37.3308326+05:30","EventType":"ProcessStop","ProcessName":"","Pid":8828,"FilePath":null,"Extra":null},
{"Timestamp":"2025-08-19T16:43:38.5893663+05:30","EventType":"ProcessStart","ProcessName":"git","Pid":14960,"FilePath":null,"Extra":{"ParentPid":4108,"ImageFileName":"git.exe"}},
{"Timestamp":"2025-08-19T16:43:38.596973+05:30","EventType":"ProcessStart","ProcessName":"git","Pid":18828,"FilePath":null,"Extra":{"ParentPid":4108,"ImageFileName":"git.exe"}},
{"Timestamp":"2025-08-19T16:43:38.597585+05:30","EventType":"ProcessStart","ProcessName":"conhost","Pid":1532,"FilePath":null,"Extra":{"ParentPid":14960,"ImageFileName":"conhost.exe"}}
]
const Home = () => {
    return ( 
        <div className="p-6 flex flex-col gap-3">
            <div className="flex w-full border justify-between">
                <div className="flex flex-col gap-2 p-2">
                    <h2 className="text-4xl">System Logs Dashboard</h2>
                    <p>Real-time monitoring of system processes </p>
                </div>
                <div className="flex gap-1 border  p-2 h-fit my-[auto] mr-2 rounded-[4px]">   
                    <Activity /> Live
                </div>
            </div>
            <div className="border p-2 flex justify-evenly">
               <InfoCard name={'Total Events'} val={10} Icon={Activity} />
               <InfoCard name={'Process Start'} val={10} Icon={Activity} />
               <InfoCard name={'Process Stop'} val={10} Icon={Activity} />
               <InfoCard name={'Active PIDs'} val={10} Icon={Activity} />
            </div>
            <div className="border p-3">
                <Table className={'border'}>
                    <TableHeader className={'bg-[gray] '}>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Time</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
            </div>
        </div>
     );
}
 
export default Home;