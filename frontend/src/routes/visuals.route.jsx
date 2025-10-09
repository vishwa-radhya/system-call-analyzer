import EventTimelineChart from "../components/visual-components/event-timeline-chart.component";
import EventCountBarChart from "../components/visual-components/event-count-bar-chart.component";
import { useLogsContext } from "../contexts/logs-context.context";
import AnomalyDonutChart from "../components/visual-components/anomaly-donut-chart.component";
import TopProcessesBarChart from "../components/visual-components/top-processes-bar-chart.component";
import EventDensityAreaChart from "../components/visual-components/event-density-area-chart.component";
import EventDistributionDonutChart from "../components/visual-components/event-distribution-donut-chart.component";
import AnomalyDensityAreaChart from "../components/visual-components/anomaly-density-area-chart.component";
const Visuals = () => {
    const {filteredProcessLogs,filteredFileIOLogs,filteredNetworkLogs}=useLogsContext();
    return ( 
        <div className="border min-h-[100vh] p-2 m-1.5 flex flex-col gap-1">
            <h1 className="text-3xl text-center">Data Visualization</h1>
            <div className="p-2 border">
                <EventTimelineChart processLogs={filteredProcessLogs} fileIOLogs={filteredFileIOLogs} networkLogs={filteredNetworkLogs} />
                <EventCountBarChart processLogs={filteredProcessLogs} fileIOLogs={filteredFileIOLogs} networkLogs={filteredNetworkLogs} />
                <AnomalyDonutChart />
                <TopProcessesBarChart/>
                <EventDensityAreaChart/>
                <EventDistributionDonutChart/>
                <AnomalyDensityAreaChart/>
            </div>
        </div>
     );
}
 
export default Visuals;