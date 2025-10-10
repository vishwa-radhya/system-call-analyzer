import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import express from 'express';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import cors from 'cors';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config()
import { detectAnomalies } from "./anomaly-detector.js";

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
// cache file
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
      model:'gemini-2.0-flash',
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
              // Check if the current log is a child of the target pid
              if (log.Extra?.ParentPid === pid) {
                  // Ensure the child's start event is within the parent's start and stop
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
          // Find children within the parent's timeline
          const children = getChildren(pid);
          // Recursively build children nodes
          for (const child of children) {
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
console.log("WebSocket server running on ws://localhost:8080");

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

const historyBuffer = [];
const MAX_HISTORY=100;
let position = 0;
let buffer = "";
let activeClient=null;

function addToHistory(log){
  historyBuffer.push(log);
  if(historyBuffer.length>MAX_HISTORY){
    historyBuffer.shift()
  }
}

function resetTailPosition(){
  position=0;
  buffer="";
}

async function readNewLines(filePath,onLine){
  try {
    const stats = await fs.promises.stat(filePath);

    if (stats.size > position) {
      const fd = await fs.promises.open(filePath, "r");
      const { bytesRead, buffer: chunk } = await fd.read({
        buffer: Buffer.alloc(stats.size - position),
        position,
      });
      await fd.close();

      position += bytesRead;
      buffer += chunk.toString("utf8");

      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // keep partial line

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          onLine(JSON.parse(line));
        } catch {
          console.error("Failed to parse line:", line);
        }
      }
    }
  } catch (err) {
    console.log("Waiting for log file...", err.message);
  }
}


function tailFile(filePath, onLine,interval=500) {
  setInterval(()=>readNewLines(filePath,onLine),interval);
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
    ws.send(JSON.stringify(historyBuffer));
    tailFile(logFilePath, (jsonLine) => {
      addToHistory(jsonLine);
      const anomalies = detectAnomalies(jsonLine);
      if(anomalies.length){
        console.log(anomalies);
      }
      // if(anomalies.length && activeClient?.readyState === ws.OPEN){
      //   for(const anomaly of anomalies){
      //   activeClient.send(JSON.stringify(anomaly));
      //   }
      // }
      if (activeClient?.readyState === ws.OPEN) {
        activeClient.send(JSON.stringify(jsonLine));
      }
    });
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

// graceful shutdown handler to dotnet process
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