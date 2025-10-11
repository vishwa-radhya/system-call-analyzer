import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "../ui/table";
import { useLogsContext } from "../../contexts/logs-context.context";
/**
 * {"Timestamp":"2025-10-07T11:06:45.0390734+05:30","EventType":"NetworkConnect","ProcessName":"helper","Pid":2692,"FilePath":null,"Extra":{"Operation":"Connect","Protocol":"TCP","LocalAddress":"10.2.25.106","LocalPort":52064,"RemoteAddress":"54.84.250.105","RemotePort":443}}
{"Timestamp":"2025-10-07T11:06:45.7608458+05:30","EventType":"NetworkDisconnect","ProcessName":"helper","Pid":2692,"FilePath":null,"Extra":{"Operation":"Disconnect","Protocol":"TCP","LocalAddress":"10.2.25.106","LocalPort":52064,"RemoteAddress":"54.84.250.105","RemotePort":443}}
 */
const NetworkTable = ({filteredLogs,handleLogClick}) => {
     const { formatTime } = useLogsContext();
    return ( 
        <Table>
      <TableHeader className="sticky top-0 bg-gray-50 text-[15px]">
        <TableRow>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">No</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Time</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Event</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Process</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">PID</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Local Address</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Remote Address</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Protocol</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredLogs.map((log, index) => (
          <TableRow
            key={index}
            className="hover:bg-blue-50 transition-colors text-[16px]"
            onClick={() => handleLogClick(log)}
          >
            <TableCell className="px-3 py-2 text-gray-600 font-mono">{index + 1}</TableCell>
            <TableCell className="px-3 py-2 text-gray-600 font-mono">
              {formatTime(log.Timestamp)}
            </TableCell>
            <TableCell className="px-3 py-2">
              <div className="flex items-center">
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    log.EventType === "NetworkConnect"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                ></span>
                <span className="text-gray-900">{log.EventType}</span>
              </div>
            </TableCell>

            <TableCell className="px-3 py-2 text-gray-900 break-all whitespace-pre-wrap">
              {log.ProcessName || "—"}
            </TableCell>

            <TableCell className="px-3 py-2 text-gray-600 font-mono">{log.Pid || "-"}</TableCell>

            <TableCell className="px-3 py-2 text-gray-600 font-mono break-all whitespace-pre-wrap">
              {log.Extra?.LocalAddress
                ? `${log.Extra.LocalAddress}:${log.Extra.LocalPort || "-"}`
                : "—"}
            </TableCell>

            <TableCell className="px-3 py-2 text-gray-600 font-mono break-all whitespace-pre-wrap">
              {log.Extra?.RemoteAddress
                ? `${log.Extra.RemoteAddress}:${log.Extra.RemotePort || "-"}`
                : "—"}
            </TableCell>

            <TableCell className="px-3 py-2 text-gray-600 font-mono">
              {log.Extra?.Protocol || "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
     );
}
 
export default NetworkTable;