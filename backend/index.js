import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.resolve(__dirname, "../logs/SysWatch.jsonl");
const wss = new WebSocketServer({port:8080});
console.log("WebSocket server running on ws://localhost:8080");

const historyBuffer = [];
const MAX_HISTORY=100;

function addToHistory(log){
  historyBuffer.push(log);
  if(historyBuffer.length>MAX_HISTORY){
    historyBuffer.shift()
  }
}

function tailFile(filePath, onLine) {
  let fileSize = 0;
  // Poll for changes every second
  setInterval(() => {
    fs.stat(filePath, (err, stats) => {
      if (err) return;
      if (stats.size > fileSize) {
        const stream = fs.createReadStream(filePath, {
          start: fileSize,
          end: stats.size,
          encoding: "utf8",
        });
      // console.log("stats lower: ",stats.size,"fileSize: ",fileSize)
        stream.on("data", (chunk) => {
          const lines = chunk.trim().split("\n");
          for (const line of lines) {
            if (line.trim()) {
              try {
                const json = JSON.parse(line);
                onLine(json);
              } catch (e) {
                console.error("Failed to parse line:", line);
              }
            }
          }
        });
        fileSize = stats.size;
      }
    });
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
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
