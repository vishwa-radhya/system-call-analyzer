import Header from "../components/header.component";
import ControlOptions from "../components/control-options.component";
import { useLogsContext } from "../contexts/logs-context.context";
import LogAnalyzer from "../components/log-analyzer.component";
import { useState } from "react";
import ProcessTable from "../components/process-table.component";
import FileTable from "../components/file-table.component";
import NetworkTable from "../components/network-table.component";
import LogTypeSelector from "../components/log-type-selector.component";
import EventInfoCards from "../components/event-infocards.component";
import EventInputSelect from '../components/event-input-select.component';

const Home = () => {
    const {filteredProcessLogs,filteredFileIOLogs,filteredNetworkLogs}=useLogsContext();
    const [isLogAnalyzerOpen,setIsLogAnalyzerOpen]=useState(false);
    const [currentLogType,setCurrentLogType]=useState(0);
    const [currentLog,setCurrentLog]=useState(null);
    const handleLogClick=(log)=>{
        setCurrentLog(log);
    }
    const handleSetCurrentLogType=(type)=>{
        setCurrentLogType(type)
    }
    return ( 
        <div className="p-2 flex flex-col gap-2">
            <Header/>
            <div className="p-1 flex border w-full h-full">
                <div className="p-1 flex flex-col transition-all duration-300 flex-grow ease-in-out  ">
                    <div className="h-[520px]">
                    <div className="flex gap-2">
                        <ControlOptions isLogAnalyzerOpen={isLogAnalyzerOpen} setIsLogAnalyzerOpen={setIsLogAnalyzerOpen} />
                        <EventInputSelect currentLogType={currentLogType} />
                    </div>
                        <LogTypeSelector handleSetCurrentLogType={handleSetCurrentLogType} />
                        <div className="p-2 h-[420px] overflow-y-auto">
                            {currentLogType === 0 && <ProcessTable filteredLogs={filteredProcessLogs} handleLogClick={handleLogClick} />}
                            {currentLogType === 1 && <FileTable filteredLogs={filteredFileIOLogs} handleLogClick={handleLogClick} />}
                            {currentLogType === 2 && <NetworkTable filteredLogs={filteredNetworkLogs} handleLogClick={handleLogClick} />}
                        </div>
                    </div>
                    <div className=" grow p-1 grid gap-2 grid-cols-[repeat(auto-fit,minmax(270px,1fr))]">
                        <EventInfoCards currentLogType={currentLogType} />
                    </div>
                </div>
                <LogAnalyzer isLogAnalyzerOpen={isLogAnalyzerOpen} setIsLogAnalyzerOpen={setIsLogAnalyzerOpen} currentLog={currentLog} />
            </div>
        </div>
     );
}
 
export default Home;