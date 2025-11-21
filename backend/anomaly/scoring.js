import { Worker } from "worker_threads";
import path from "path";

const anomalyWorker = new Worker(path.resolve('./anomaly-worker.js'));
console.log(anomalyWorker.postMessage({"Timestamp":"2025-10-07T11:06:45.0390734+05:30","EventType":"NetworkConnect","ProcessName":"helper","Pid":2692,"FilePath":null,"Extra":{"Operation":"Connect","Protocol":"TCP","LocalAddress":"10.2.25.106","LocalPort":52064,"RemoteAddress":"54.84.250.105","RemotePort":443}}))

anomalyWorker.on('message',(msg)=>{
//   if(msg.anomalies){
//     for(const anomaly of msg.anomalies){
//       activeClient.send(JSON.stringify({type:"anomaly",data:anomaly}));
//     }
//   }
console.log(msg)
})