import { AlertTriangle, Timer, Terminal } from "lucide-react";

const AnomalyDetails = ({ currentLog }) => {

  function formatTimestamp(isoString) {
    if (!isoString) return "UNKNOWN";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }

  const severityColors = {
    Low: "bg-green-100 text-green-700",
    Medium: "bg-yellow-100 text-yellow-700",
    High: "bg-orange-100 text-orange-700",
    Critical: "bg-red-100 text-red-700",
  };

  if (!currentLog) return null;

  return (
    <div className="p-2 flex flex-col gap-4">

      <div className="flex gap-2 items-center">
        <AlertTriangle />
        <h3>Anomaly Batch</h3>
      </div>

      <div className="flex flex-col gap-1">
        <p>SEVERITY</p>
        <div className={`border p-3 rounded font-semibold ${severityColors[currentLog?.severity] || ""}`}>
          {currentLog?.severity || "UNKNOWN"}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p>PROCESS</p>
        <div className="border p-3 rounded">
          {currentLog?.process || "UNKNOWN"}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p>EVENT COUNT</p>
        <div className="border p-3 rounded">
          {currentLog?.count ?? "0"}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p>BATCH TIMESTAMP</p>
        <div className="border p-3 rounded">
          {formatTimestamp(currentLog?.timestamp)}
        </div>
      </div>

      {/* <div className="flex flex-col gap-1">
        <p>START TIME</p>
        <div className="border p-3 rounded">
          {formatTimestamp(currentLog?.startTime)}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p>END TIME</p>
        <div className="border p-3 rounded">
          {formatTimestamp(currentLog?.endTime)}
        </div>
      </div> */}
      {/* AVERAGE SCORES (dynamic) */}
<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
  {currentLog?.avgScores && (() => {
    const avg = currentLog.avgScores;

    const explicitKeys = ["final", "rule", "behavior"];
    const hasExplicit = explicitKeys.some(k => Object.prototype.hasOwnProperty.call(avg, k));

    if (hasExplicit) {
      return (
        <>
          <div className="flex flex-col gap-1">
            <p>FINAL SCORE (AVG)</p>
            <div className="border p-3 rounded">
              {Number(avg.final ?? 0).toFixed(2)}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p>RULE SCORE (AVG)</p>
            <div className="border p-3 rounded">
              {Number(avg.rule ?? 0).toFixed(2)}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p>BEHAVIOR SCORE (AVG)</p>
            <div className="border p-3 rounded">
              {Number(avg.behavior ?? 0).toFixed(2)}
            </div>
          </div>
        </>
      );
    }

    return Object.entries(avg).map(([key, val]) => {
      const display = (val !== null && typeof val === "object") ? JSON.stringify(val) : Number(val ?? 0).toFixed(2);
      return (
        <div className="flex flex-col gap-1" key={key}>
          <p className="uppercase text-xs">{key}</p>
          <div className="border p-3 rounded">
            {display}
          </div>
        </div>
      );
    });
  })()}
</div>


      <div className="flex flex-col gap-1">
        <p>DURATION</p>
        <div className="border p-3 rounded">
            {(currentLog?.durationMs ?? 0) + " ms"} 
        </div>
      </div>
      {/* {currentLog?.reasons?.length > 0 && (
        <div className="flex flex-col gap-1">
          <p>REASONS</p>
          <div className="border p-3 rounded whitespace-pre-wrap break-all">

            {currentLog.reasons.map((r, i) => (
              <div key={i} className="mb-3">

                <div className="font-medium">{r.reason}</div> */} 

                {/* <div className="text-sm text-gray-600 ml-4">
                  Layer: {r.layer} | Metric: {r.metric} | Score: {r.score}
                </div> */}

                {/* {r.vector && (
                  <div className="mt-2 ml-4 text-sm">
                    <p className="font-semibold">Behavior Vector:</p>
                    <div className="ml-2">
                      {Object.entries(r.vector).map(([key, val]) => (
                        <div key={key}>{key}: {val}</div>
                      ))}
                    </div>
                  </div>
                )} */}

                {/* {r.eventFragment && (
                  <div className="mt-2 ml-4 text-sm">
                    <p className="font-semibold">Event Fragment:</p>
                    <div className="ml-2">
                      {Object.entries(r.eventFragment).map(([k, v]) => (
                        <div key={k}>{k}: {String(v)}</div>
                      ))}
                    </div>
                  </div>
                )} */}

              {/* </div>
            ))} */}

          {/* </div> */}
        {/* </div> */}
      {/* )} */}


    </div>
  );
};
export default AnomalyDetails;
