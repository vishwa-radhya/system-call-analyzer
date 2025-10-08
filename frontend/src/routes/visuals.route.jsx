import EventTimelineChart from "../components/visual-components/event-timeline-chart.component";
import EventCountBarChart from "../components/visual-components/event-count-bar-chart.component";
import { useLogsContext } from "../contexts/logs-context.context";
const Visuals = () => {
    const {filteredProcessLogs,filteredFileIOLogs,filteredNetworkLogs}=useLogsContext();
    return ( 
        <div className="border min-h-[100vh] p-2 m-1.5 flex flex-col gap-1">
            <h1 className="text-3xl text-center">Data Visualization</h1>
            <div className="p-2 border">
                <EventTimelineChart processLogs={filteredProcessLogs} fileIOLogs={filteredFileIOLogs} networkLogs={filteredNetworkLogs} />
                <EventCountBarChart processLogs={filteredProcessLogs} fileIOLogs={filteredFileIOLogs} networkLogs={filteredNetworkLogs} />
            </div>
        </div>
     );
}
 
export default Visuals;