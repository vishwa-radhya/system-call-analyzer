import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "../components/ui/table";
import { useLogsContext } from "../contexts/logs-context.context";
/**
 * {"Timestamp":"2025-09-13T15:06:19.4009587+05:30","EventType":"FileRead","ProcessName":"explorer","Pid":9552,"FilePath":"D:\\mongo URI.txt","Extra":null}
 */
const FileTable = ({filteredLogs,handleLogClick}) => {
    const {formatTime}=useLogsContext();
    // console.log('h')
    return ( 
         <Table>
            <TableHeader className="sticky top-0 bg-gray-50 text-[15px]">
                <TableRow>
                    <TableHead className="px-3 py-2 text-left font-medium text-gray-600">No</TableHead>
                    <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Time</TableHead>
                    <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Event</TableHead>
                    <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Process</TableHead>
                    <TableHead className="px-3 py-2 text-left font-medium text-gray-600">PID</TableHead>
                    <TableHead className="px-3 py-2 text-left font-medium text-gray-600">File Path</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody >
                {filteredLogs.map((log, index) => (
                    <TableRow key={index} className="hover:bg-blue-50 transition-colors text-[16px]" onClick={()=>handleLogClick(log)}>
                        <TableCell className='px-3 py-2 text-gray-600 font-mono'>
                            {index+1}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-gray-600 font-mono ">
                            {formatTime(log.Timestamp)}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                            <div className="flex items-center">
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${log.EventType==='FileRead' ? 'bg-green-500' : log.EventType==='FileWrite' ? 'bg-red-500' : 'bg-violet-500'}`}></span>
                                <span className="text-gray-900 ">{log.EventType}</span>
                            </div>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-gray-900 break-all whitespace-pre-wrap">
                            {log.ProcessName || '—'}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-gray-600 font-mono">
                            {log.Pid || '-'}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-gray-600 font-mono break-all whitespace-pre-wrap">
                            {log.FilePath || '—'}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
     );
}
 
export default FileTable;