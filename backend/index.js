import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

function tailFile(filePath, onLine) {
  let buffer = "";
  let position = 0;
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
  ws.on('message',(msg)=>{
    try{
      const str = msg.toString().trim();
      const data = JSON.parse(str);
      if(data.type==="CONTROL"){
        if(dotnetProcess.stdin.writable){
          dotnetProcess.stdin.write(data.action+"\n");
          ws.send(JSON.stringify({type:"ACK",action:data.action}));
          console.log("sent control:",data.action)
        }else{
          console.error(".NET process stdin not writable")
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
