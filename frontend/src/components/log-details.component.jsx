
import { Terminal } from "lucide-react";
import { Fragment } from "react";

const LogDetails = ({currentLog}) => {
    function formatTimestamp(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    }
    return ( 
        <div className="p-2 flex flex-col gap-4">
            <div className="flex gap-2 items-center">
                <Terminal/>
                <h3>{currentLog?.EventType || 'UNKNOWN'}</h3>
            </div>
            <div className="flex flex-col gap-1">
                <p>TIMESTAMP</p>
                <div className="border p-3 rounded">
                    {formatTimestamp(currentLog?.Timestamp) || "UNKWOWN"}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <p>PROCESS NAME</p>
                <div className="border p-3 rounded">
                    {currentLog?.ProcessName || 'UNKNOWN'}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <p>PROCESS ID</p>
                <div className="border p-3 rounded">
                    {currentLog?.Pid || 'UNKNOWN'}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <p>EVENT TYPE</p>
                <div className="border p-3 rounded">
                    {currentLog?.EventType || 'UNKNOWN'}
                </div>
            </div>
            {currentLog?.Extra && <Fragment>
                <div className="flex flex-col gap-1">
                <p>PARENT PID</p>
                <div className="border p-3 rounded">
                    {currentLog?.Extra?.ParentPid || 'UNKNOWN'}
                </div>
            </div>
                <div className="flex flex-col gap-1">
                <p>IMAGE FILE NAME</p>
                <div className="border p-3 rounded">
                    {currentLog?.Extra?.ImageFileName || 'UNKNOWN'}
                </div>
            </div>
            </Fragment>}
        </div>
     );
}
 
export default LogDetails;