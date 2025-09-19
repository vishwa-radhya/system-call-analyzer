import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Loader,Network } from "lucide-react";
import Tree from "react-d3-tree";
import { toast } from "sonner";
import { useLogsContext } from "../contexts/logs-context.context";

const LogTree = ({currentLog,handleSetTreeResult,treeResult}) => {
    const [loading,setLoading]=useState(false);
    const {sendControlCommand}=useLogsContext();
    const treeContainer = useRef(null);
    const [translate,setTranslate]=useState({x:0,y:0});

    useEffect(()=>{
        if(treeContainer.current){
            const dimensions = treeContainer.current.getBoundingClientRect();
            setTranslate({
                x:dimensions.width/2, // center horizontally
                y:50,
            });
        }
    },[treeResult])

    const handleProcessTreeGeneration=async()=>{
        if(currentLog?.EventType !=='ProcessStart' && currentLog?.EventType !== 'ProcessStop'){
            toast.info("Log tree only works for processes.")
            return
        }
        setLoading(true)
        handleSetTreeResult(null)
        sendControlCommand("STOP")
        await new Promise((res)=>setTimeout(res,200));
        try{
            const res = await fetch(`http://localhost:5000/process-tree?log=${JSON.stringify(currentLog)}`);
            const data = await res.json();
            if(data.error){
                toast.error("Error occured while construting process tree");
            }else{
                handleSetTreeResult(data.tree)
                toast.success('Successfully fetched process tree');
            }
        }catch(e){
            console.error("Error fetching process tree:",e);
        }finally{
            await new Promise((res)=>setTimeout(res,200));
            sendControlCommand("START")
            setLoading(false)
        }
    }
    const formatTimestamp = (ts) => {
        if (!ts) return "N/A";
        try {
            const d = new Date(ts);
            // Format: YYYY-MM-DD HH:MM:SS
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
            ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes()
            ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
        } catch {
            return ts; 
        }
        };
    const orgChart=useMemo(()=>{
        const convertToTreeData=(node)=>{
        return {
            name: `${node.start?.ProcessName || "Unknown"} (PID: ${node.start?.Pid || "?"})`,
            children: [
            {
                name: `Start: ${formatTimestamp(node.start?.Timestamp) || "N/A"}`,
                attributes: {
                Image: node.start?.Extra?.ImageFileName || "N/A",
                ParentPid: node.start?.Extra?.ParentPid || "N/A",
                },
            },
            node.stop
                ? {
                    name: `Stop: ${formatTimestamp(node.stop?.Timestamp) || "N/A"}`,
                }
                : null,
            ...(node.children || []).map(convertToTreeData),
            ].filter(Boolean),
        };
    }
        if(!treeResult) return null;
        if(treeResult?.parent){
            return [
                {
                    name:`${treeResult?.parent?.ProcessName || "Parent"} (PID: ${treeResult?.parent?.Pid || "?"})`,
                    attributes:{
                        Timestamp:formatTimestamp(treeResult?.parent?.Timestamp) || "N/A",
                        Type:treeResult?.parent?.EventType || "N/A",
                    },
                    children:[convertToTreeData(treeResult)],
                }
            ]
        }
        return [convertToTreeData(treeResult)]
    },[treeResult])

    return ( 
        <div className="flex flex-col h-full items-center py-3 gap-4">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 w-full max-h-full" ref={treeContainer}>
                {(loading && !treeResult) && <div className='flex items-center justify-center h-full'>
                    <Loader size={'60'} />
                </div>}
                {(treeResult && !loading) && <div className="h-full">
                    <Tree data={orgChart} orientation="vertical" collapsible={true} zoomable={true} draggable={true} enableLegacyTransitions={true} nodeSize={{x:290,y:200}}  translate={translate} />
                </div>}
                {(!treeResult && !loading) && <div className='flex h-full flex-col items-center justify-center gap-3'>
                    <Network size={'130'} color='lightgray' />
                    <p className='text-[19px] text-[gray]'>Get process tree for the selected log</p>
                </div>}
            </div>
            <Button className={'mt-1'} onClick={handleProcessTreeGeneration}>Process Tree</Button>
        </div>
     );
}
 
export default LogTree;