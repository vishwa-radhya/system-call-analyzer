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

function addToHistory(log){
  historyBuffer.push(log);
  if(historyBuffer.length>MAX_HISTORY){
    historyBuffer.shift()
  }
}

let position = 0;
function tailFile(filePath, onLine) {
  let buffer = "";
  setInterval(async () => {
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.size > position) {
        const fd = await fs.promises.open(filePath, "r");
        const { bytesRead, buffer: chunk } = await fd.read({
          buffer: Buffer.alloc(stats.size - position),
          position,
        });
        fd.close();
        position += bytesRead;
        buffer += chunk.toString("utf8");
        let lines = buffer.split("\n");
        buffer = lines.pop() || ""; // keep partial line
        for (const line of lines) {
          if (line.trim()) {
            try {
              onLine(JSON.parse(line));
            } catch (e) {
              console.error("Failed to parse line:", line);
            }
          }
        }
      }
    } catch (err) {
      console.log("file might not exist yet",err);
    }
  }, 500);
}

function resetTailPosition(){
  position=0;
}

wss.on("connection", (ws) => {
  console.log("Client connected");
    if(ws.readyState===ws.OPEN){
      ws.send(JSON.stringify(historyBuffer))
    }
  tailFile(logFilePath, (jsonLine) => {
    addToHistory(jsonLine)
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(jsonLine));
    }
  });
  ws.on('message',async(msg)=>{
    try{
      const str = msg.toString().trim();
      const data = JSON.parse(str);
      if(data.type==="CONTROL"){
        if(!dotnetProcess.stdin.writable){
          console.error(".NET process stdin not writable");
          ws.send(JSON.stringify({type:"ERROR",action:data.action,message:"Process stdin not writable"}));
          return;
        }
        switch(data.action){
          case "CLEAR_LOGS":
            dotnetProcess.stdin.write("STOP\n");
            console.log("sent control:","STOP");
            // waiting 100ms for .NET to pause
            await new Promise((res)=>setTimeout(res,100));
            // clear log file
            await new Promise((resolve,reject)=>{
              fs.truncate(logFilePath,0,(err)=>{
                if(err){
                  console.error("Failed to clear logs:",err);
                  reject(err);
                }else{
                  console.log("Logs cleared");
                  resolve();
                  resetTailPosition();
                }
              })
            })
            // ACK to frontend
            ws.send(JSON.stringify({type:"ACK",action:"CLEAR_LOGS"}));
            // resuming .NET after delay
            setTimeout(()=>{
              dotnetProcess.stdin.write("START\n");
              console.log("sent control:","START");
            },200);
            break;

          default:
            dotnetProcess.stdin.write(data.action+"\n");
            ws.send(JSON.stringify({type:"ACK",action:data.action}));
            console.log("sent control:",data.action)
        }
      }
    }catch(e){
      console.error("invalid message",msg.toString(),e.message);
    }
  })
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

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
process.on("exit",shutdown);

const PORT =5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});