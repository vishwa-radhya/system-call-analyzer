import { Fragment, useEffect, useState } from "react";
import {MousePointerClick} from 'lucide-react';
import LogDetails from "./log-details.component";
import LogAIAnalysis from "./log-ai-analysis.component";
import LogTree from "./log-tree.component";


const selectionArray=['Log','AI Analysis','Tree']
const LogAnalyzer = ({isLogAnalyzerOpen,currentLog}) => {
    const [currentSelection,setCurrentSelection]=useState(0); // Log, AI Analysis, Tree
    const [aiResult,setAiResult]=useState('');
    const [treeResult,setTreeResult]=useState(null);

    const handleSetAiResult=(res)=>{
        setAiResult(res)
    }
    const handleSetTreeResult=(res)=>{
        setTreeResult(res)
    }
    useEffect(()=>{
        handleSetAiResult('')
        handleSetTreeResult(null)
    },[currentLog])

    return ( 
        <div className={`border rounded flex flex-col gap-1 p-1 overflow-hidden h-[700px] transition-all duration-300 ease-in-out ${isLogAnalyzerOpen ? 'w-[540px]' : 'w-0'}`}>
            {isLogAnalyzerOpen && <Fragment>
            <h3 className="text-center border p-1">Log Analyzer</h3>
            {!currentLog ? <div className="border grow flex flex-col items-center justify-center gap-3">
                <MousePointerClick size={150} color="lightgray" />
                <p className="text-[lightgray] text-2xl">Select a log to start analysis</p>
            </div>:<div className="border grow flex flex-col gap-2 items-center min-h-0">
                <div className=" flex  p-1 justify-around gap-3 mt-2 rounded cursor-pointer bg-[rgb(246,246,246)]">
                    {selectionArray.map((selection,index)=>{
                       return <div key={`selection-${index}`} onClick={()=>setCurrentSelection(index)} className={`px-6 py-1 rounded font-medium ${currentSelection===index && "bg-[white] shadow text-blue-700"}`}>{selection}</div>
                    })}
                </div>
                <div className=" w-full flex-1 min-h-0 overflow-hidden ">
                        {currentSelection===0 && <LogDetails currentLog={currentLog} />}
                        {currentSelection===1 && <LogAIAnalysis currentLog={currentLog} aiResult={aiResult} handleSetAiResult={handleSetAiResult}  />}
                        {currentSelection===2 && <LogTree currentLog={currentLog} treeResult={treeResult} handleSetTreeResult={handleSetTreeResult} />}
                </div>
            </div>}
            </Fragment>}
        </div>
     );
}
 
export default LogAnalyzer;