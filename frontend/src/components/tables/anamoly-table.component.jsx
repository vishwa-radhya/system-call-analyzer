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
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Process</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Severity</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Count</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Duration (ms)</TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-gray-600">Reason</TableHead>
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
              {anom.timestamp ? formatTime(anom.timestamp) : "—"}
            </TableCell>

            <TableCell className="px-3 py-2 text-gray-900">{anom.process || "—"}</TableCell>

            <TableCell
              className={`px-3 py-2 font-semibold ${
                anom.severity === "Critical"
                  ? "text-red-700"
                  : anom.severity === "High"
                  ? "text-red-500"
                  : anom.severity === "Medium"
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {anom.severity}
            </TableCell>

            <TableCell className="px-3 py-2 text-gray-900 font-mono">{anom.count}</TableCell>

            <TableCell className="px-3 py-2 text-gray-900 font-mono">
              {anom.durationMs} ms
            </TableCell>

            <TableCell className="px-3 py-2 text-gray-700 break-words whitespace-pre-wrap">
              {anom.reasons?.[0]?.reason || anom.reasons?.[0] || "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
export default AnomalyTable;
