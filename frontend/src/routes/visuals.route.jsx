import EventTimelineChart from "../components/visual-components/event-timeline-chart.component";
import EventCountBarChart from "../components/visual-components/event-count-bar-chart.component";
import { useLogsContext } from "../contexts/logs-context.context";
import AnomalyDonutChart from "../components/visual-components/anomaly-donut-chart.component";
import TopProcessesBarChart from "../components/visual-components/top-processes-bar-chart.component";
import AnomalyDensityAreaChart from "../components/visual-components/anomaly-density-area-chart.component";
import { useMemo } from "react";
const Visuals = () => {
    const {filteredProcessLogs,filteredFileIOLogs,filteredNetworkLogs,eventCounts,filteredAnomalies}=useLogsContext();
    // console.log(eventCounts)
    const processCount = useMemo(()=>(eventCounts?.ProcessStart || 0)+(eventCounts?.ProcessStop || 0),[eventCounts]);
    const fileIOCount = useMemo(() =>(eventCounts?.FileRead || 0) +(eventCounts?.FileWrite || 0) +(eventCounts?.FileRename || 0),[eventCounts]);
    const networkCount = useMemo(() => (eventCounts?.NetworkConnect || 0) + (eventCounts?.NetworkDisconnect || 0),[eventCounts]);
    const anomalyCount = useMemo(() => filteredAnomalies.length, [filteredAnomalies]);  
    return ( 
        <div className=" min-h-[100vh] p-2 m-1.5 flex flex-col gap-1">
            <h1 className="text-3xl text-center">Data Visualization</h1>
            <div className="p-2">
                <EventTimelineChart processLogs={filteredProcessLogs} fileIOLogs={filteredFileIOLogs} networkLogs={filteredNetworkLogs} />
                <EventCountBarChart processCount={processCount} fileIOCount={fileIOCount} networkCount={networkCount} />
                <AnomalyDonutChart processCount={processCount} fileIOCount={fileIOCount} networkCount={networkCount} anomalyCount={anomalyCount} />
                <TopProcessesBarChart processLogs={filteredProcessLogs} fileIOLogs={filteredFileIOLogs} networkLogs={filteredNetworkLogs}  />
                <AnomalyDensityAreaChart anomalies={filteredAnomalies} />
            </div>
        </div>
     );
}
 
export default Visuals;