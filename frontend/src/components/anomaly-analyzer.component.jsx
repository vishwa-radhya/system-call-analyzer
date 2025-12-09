import { MousePointerClick } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import AnomalyAiAnalysis from "./anomaly-ai-analysis.component";
import AnomalyDetails from "./anomaly-details.component";

const selectionArray=['Anomaly','AI Analysis']
const AnomalyAnalyzer =({isAnomalyAnalyzerOpen,currentAnomaly})=>{
    const [aiResult,setAiResult]=useState('');
    const [currentSelection,setCurrentSelection]=useState(0); 
    const handleSetAiResult=(res)=>{
        setAiResult(res)
    }
    useEffect(()=>{
        handleSetAiResult('')
    },[currentAnomaly])
    return(
        <div className={`border rounded flex flex-col gap-1 p-1 overflow-hidden h-[700px] transition-all duration-300 ease-in-out ${isAnomalyAnalyzerOpen ? 'w-[540px]' : 'w-0'}`}>
            {isAnomalyAnalyzerOpen && <Fragment>
                <h3 className="text-center border p-1">Anomaly Analyzer</h3>
                {!Object.keys(currentAnomaly).length ? <div className="border grow flex flex-col items-center justify-center gap-3">
                    <MousePointerClick size={150} color="lightgray" />
                <p className="text-[lightgray] text-2xl">Select a log to start analysis</p>
                </div>:<div className="w-full flex-1 min-h-0 overflow-auto ">
                <div className="flex  p-1 justify-around gap-3 mt-2 rounded cursor-pointer bg-[rgb(246,246,246)]">
                    {selectionArray.map((selection,index)=>{
                       return <div key={`selection-${index}`} onClick={()=>setCurrentSelection(index)} className={`px-6 py-1 rounded font-medium ${currentSelection===index && "bg-[white] shadow text-blue-700"}`}>{selection}</div>
                    })}
                </div>
                    <div className="w-full flex-1 h-[90%] overflow-auto">
                        {currentSelection ===0 && <AnomalyDetails currentLog={currentAnomaly} />}
                        {currentSelection===1 && <AnomalyAiAnalysis currentLog={currentAnomaly} aiResult={aiResult} handleSetAiResult={handleSetAiResult} /> }
                    </div>
                </div>}
            </Fragment>}
        </div>
    )
}
export default AnomalyAnalyzer;