import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useLogsContext } from "../../contexts/logs-context.context";

const AnomalyTable = ({ anomalyLogs=[], handleLogClick }) => {
  const { formatTime } = useLogsContext();
  // console.log(anomalyLogs)
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-gray-50 text-[15px]">
        <TableRow>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">No</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Time</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Rule</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Severity</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Reason</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">PID</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {anomalyLogs.map((anom, index) => (
          <TableRow
            key={index}
            className="hover:bg-red-50 transition-colors text-[16px]"
            onClick={() => handleLogClick(anom)}
          >
            <TableCell className="px-3 py-2 text-gray-600 font-mono">{index + 1}</TableCell>

            <TableCell className="px-3 py-2 text-gray-600 font-mono">
              {anom.Log?.Timestamp ? formatTime(anom.Log.Timestamp) : "—"}
            </TableCell>

            <TableCell className="px-3 py-2 text-gray-900">{anom.Rule}</TableCell>

            <TableCell
              className={`px-3 py-2 font-semibold ${
                anom.Severity === "High"
                  ? "text-red-600"
                  : anom.Severity === "Medium"
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {anom.Severity}
            </TableCell>

            <TableCell className="px-3 py-2 text-gray-700 break-words whitespace-pre-wrap">
              {anom.Reason}
            </TableCell>

            <TableCell className="px-3 py-2 text-gray-900">
              {anom.Log?.EventType || "—"}
            </TableCell>

            <TableCell className="px-3 py-2 text-gray-900 break-all whitespace-pre-wrap">
              {anom.Log?.ProcessName || "—"}
            </TableCell>

            <TableCell className="px-3 py-2 text-gray-600 font-mono">
              {anom.Log?.Pid || "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
export default AnomalyTable;
