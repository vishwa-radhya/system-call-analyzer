import fs from "fs";
import path from "path";
import { WebSocketServer,WebSocket } from "ws";
import { fileURLToPath, pathToFileURL } from "url";
import { Worker } from "worker_threads";
import { spawn } from "child_process";
import express from 'express';
import { GoogleGenAI } from "@google/genai";
import TailFile from "@logdna/tail-file";
import split from "split2";
import dotenv from 'dotenv';
import cors from 'cors';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config()

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

const googleAi = new GoogleGenAI({apiKey:process.env.GOOGLE_GEMINI_API_KEY});
const cacheFile = path.resolve(__dirname,"../logs/ai_explanations.json");
let explanationCache={}

if(fs.existsSync(cacheFile)){
  try{
    explanationCache=JSON.parse(fs.readFileSync(cacheFile,"utf-8"));
  }catch{
    explanationCache={}
  }
}

const getAiExplanation=async(log)=>{
  const key = `${log.ProcessName}:${log.EventType}`;
  if(explanationCache[key]){
    return {cached:true,explanation:explanationCache[key]}
  }
  const prompt=`
    You are an expert Windows system analyst.
  Explain the following system event log in plain English.
  The explanation must be:
  - concise but clear (2-4 sentences),
  - human-friendly (avoid jargon unless needed),
  - highlight what this means for the system/user.
  Return the explanation strictly in this JSON format (no extra text):
  {
    "summary": "one line event summary",
    "details": "key values from the log",
    "insight": "why this event matters or what it means",
    "nextStep": "optional recommendation"
  }
  Here is the log to analyze:
  ${JSON.stringify(log,null,2)}
  `
  try{
    const response = await googleAi.models.generateContent({
      model:'gemini-2.5-flash',
      contents:prompt
    })
    const explanationText = response.text.trim();
    const cleaned = explanationText.replace(/```json\n?|\n?```/g,"");
    let explanation=JSON.parse(cleaned);
    
    explanationCache[key]=explanation;
    fs.writeFileSync(cacheFile,JSON.stringify(explanationCache,null,2));
    return {cached:false,explanation};
  }catch(e){
    console.error(e)
    return {error:"Ai explanation failed"}
  }
}

app.post("/ai_explanation",async(req,res)=>{
  try{
    const log = req.body.log;
    if(!log){
      return res.status(400).json({error:"log object required"});
    }
    const data = await getAiExplanation(log);
    res.json(data);
  }catch(e){
    console.error("AI explanation error:",e);
    res.status(500).json({error:"Ai explanation failed"});
  }
})

app.get("/process-tree",async(req,res)=>{
  let targetLog;
  try {
    targetLog = JSON.parse(req.query.log);
  } catch (e) {
    return res.status(400).json({ error: "invalid log object" });
  }

  if (!targetLog || !targetLog.Pid) {
    return res.status(400).json({ error: "log with Pid required" });
  }
  const logFile = path.resolve(__dirname,'../logs/SysWatch.jsonl');
  let logs=[];
  if(fs.existsSync(logFile)){
    const content = fs.readFileSync(logFile,"utf-8").split("\n").filter(Boolean);
    logs=content.map(line=>{
      try{
        return JSON.parse(line);
      }catch(e){
        return null
      }
    }).filter(Boolean);
  }
    function buildLogMap(data,targetLog){
      const logMap = new Map();
      // Pre-process data for efficient lookup
      for (const log of data) {
          if (!logMap.has(log.Pid)) {
              logMap.set(log.Pid, {
                  start: null,
                  stop: null,
                  children: []
              });
          }
          if (log.EventType === "ProcessStart") {
              logMap.get(log.Pid).start = log;
          } else if (log.EventType === "ProcessStop") {
              logMap.get(log.Pid).stop = log;
          }
      }
      const getChildren = (pid) => {
          const children = [];
          for (const log of data) {
              if (log.Extra?.ParentPid === pid) { // Check if the current log is a child of the target pid
                  const parentNode = logMap.get(pid); 
                  const parentStart = parentNode.start?.Timestamp;
                  const parentStop = parentNode.stop?.Timestamp;

                  if (  parentStart && parentStop && (parentStart<parentStop) &&
                      log.Timestamp > parentStart && log.Timestamp < parentStop) {
                      children.push(log);
                  }
              }
          }
          return children;
      };
      function buildTree(targetLog) {
          if (!targetLog) return null;
          const pid = targetLog.Pid;
          const node = logMap.get(pid);
          const children = getChildren(pid);  // Find children within the parent's timeline
          for (const child of children) { // Recursively build children nodes
              const childNode = buildTree(child);
              if (childNode) {
                  node.children.push(childNode);
              }
          }
          return node;
      }
      const finalNode= buildTree(targetLog);
      const parentPid = targetLog?.Extra?.ParentPid;
      if(parentPid){
          const parentNode = logMap.get(parentPid);
          if(parentNode && parentNode?.start?.Timestamp<finalNode?.start?.Timestamp){
              parentNode.children.push(finalNode);
              return parentNode;
          }
      }
      return finalNode
  }
  const tree = buildLogMap(logs,targetLog);
  res.json({tree:tree} || {error:"Process not found"});
})

const logFilePath = path.resolve(__dirname, "../logs/SysWatch.jsonl");
const wss = new WebSocketServer({port:8080});
const workerPath = path.resolve(__dirname, './anomaly/anomaly-worker.js');
const workerUrl = pathToFileURL(workerPath);
console.log("Worker path:", workerPath);
const anomalyWorker = new Worker(workerUrl);
console.log("WebSocket server running on ws://localhost:8080");

const historyBuffer = [];
const MAX_HISTORY=100;
let activeClient=null;
let tail = null;


anomalyWorker.on('message',(msg)=>{
  if(activeClient?.readyState === WebSocket.OPEN){
    activeClient.send(
      JSON.stringify({
        type:"anomaly",
        data:msg
      })
    )
  }
  // console.log('anomaly message: ',msg.severity,msg.process,msg.type,msg.count,msg.durationMs)
})

anomalyWorker.on('error', (error) => {
  console.error('Worker error:', error);
});

anomalyWorker.on('exit', (code) => {
  console.log(`Worker exited with code ${code}`);
});

const dotnetProcess=spawn("dotnet",["run"],{
  cwd:path.resolve(__dirname,"../SysWatchETW"),
  stdio:["pipe","pipe","pipe"]
})

dotnetProcess.stdout.on("data",(data)=>{
  console.log(`[SysWatch]: ${data.toString().trim()}`)
})

dotnetProcess.stderr.on("data", (data) => {
  console.error(`[SysWatch ERROR]: ${data.toString().trim()}`);
});

dotnetProcess.on("exit", (code) => {
  console.log(`[SysWatch] exited with code ${code}`);
});

function addToHistory(log){
  historyBuffer.push(log);
  if(historyBuffer.length>MAX_HISTORY){
    historyBuffer.shift()
  }
}

function resetTailPosition(){
  if(tail){
    try { tail.quit(); } catch {}
    tail = null;
  }
}

function tailFile(filePath, onLine) {
  if(tail){
    try{tail.quit();} catch {}
  }
  tail = new TailFile(filePath,{
    startPos:0,
    retryTimeout:100,
  })
  tail.pipe(split()).on('data',line=>{
    if(!line.trim()) return;
    try{
      const json = JSON.parse(line);
      onLine(json);
    }catch(err){
      console.error('Failed to parse JSON:',line)
    }
  }).on('error',err=>{
    console.error('TailFile error:',err);
  });

  tail.start().catch(err=>console.error("Tail start failed:",err))
}

async function handleControlMessage(ws,data,dotnetProcess,logFilePath){
   if (!dotnetProcess.stdin.writable) {
    console.error(".NET process stdin not writable");
    ws.send(JSON.stringify({
      type: "ERROR",
      action: data.action,
      message: "Process stdin not writable"
    }));
    return;
  }
  switch (data.action) {
    case "CLEAR_LOGS":
      dotnetProcess.stdin.write("STOP\n");
      console.log("sent control:", "STOP");
      setTimeout(async () => {
        try {
          await fs.promises.truncate(logFilePath, 0);
          console.log("Logs cleared");
          resetTailPosition();
          // restart tailer fresh
          setTimeout(()=>{
            tailFile(logFilePath,onLineRef)
          },150)
          ws.send(JSON.stringify({ type: "ACK", action: "CLEAR_LOGS" }));
          setTimeout(() => {
            dotnetProcess.stdin.write("START\n");
            ws.send(JSON.stringify({ type: "ACK", action: "START" }));
            console.log("sent control:", "START");
          }, 200);
        } catch (err) {
          console.error("Failed to clear logs:", err);
          ws.send(JSON.stringify({
            type: "ERROR",
            action: "CLEAR_LOGS",
            message: err.message
          }));
        }
      }, 100);
      break;

    default:
      dotnetProcess.stdin.write(data.action + "\n");
      ws.send(JSON.stringify({ type: "ACK", action: data.action }));
      console.log("sent control:", data.action);
  }
}

function setupWebSocketServer(wss,logFilePath,dotnetProcess){
   wss.on("connection", (ws) => {
    console.log("Client connected");
    activeClient = ws;
    ws.send(JSON.stringify({
      type:"history",
      data:historyBuffer
    }));

    const onLine = (jsonLine)=>{
      addToHistory(jsonLine);
      if (activeClient?.readyState === ws.OPEN) {
        activeClient.send(JSON.stringify({
          type: "log",
          data: jsonLine
        }));
      }
      anomalyWorker.postMessage(jsonLine);
    }
    global.onLineRef=onLine;
    tailFile(logFilePath,onLine)
    
    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString().trim());
        if (data.type === "CONTROL") {
          handleControlMessage(ws, data, dotnetProcess, logFilePath);
        }
      } catch (err) {
        console.error("Invalid message:", msg.toString(), err.message);
      }
    });
    ws.on("close", () => {
      console.log("Client disconnected");
      activeClient = null;
    });
  });
}

// shutdown handler to dotnet process
function shutdown(){
  console.log("Shutting down backend..");
  if(dotnetProcess && dotnetProcess.stdin.writable){
    console.log("Sending EXIT to SysWatch..");
    dotnetProcess.stdin.write("EXIT\n");
  }
  // giving syswatch a chance to clean up before force killing
  setTimeout(()=>{
    if(!dotnetProcess.killed){
      console.log("Force killing SysWatch process..");
      dotnetProcess.kill("SIGKILL");
    }
    process.exit(0);
  },2000)
}
process.on("SIGINT",shutdown);
process.on("SIGTERM",shutdown);

const PORT =5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  setupWebSocketServer(wss,logFilePath,dotnetProcess);
});