export const data=[
  {
    "Timestamp": "2025-08-23T19:08:06.3339642+05:30",
    "EventType": "ProcessStart",
    "ProcessName": "dllhost",
    "Pid": 21200,
    "FilePath": null,
    "Extra": {
      "ParentPid": 1988,
      "ImageFileName": "dllhost.exe"
    }
  },
  {
    "Timestamp": "2025-08-23T19:08:06.4847506+05:30",
    "EventType": "ProcessStart",
    "ProcessName": "WhatsApp",
    "Pid": 7300,
    "FilePath": null,
    "Extra": {
      "ParentPid": 1988,
      "ImageFileName": "WhatsApp.exe"
    }
  },
  {
    "Timestamp": "2025-08-23T19:08:06.9295448+05:30",
    "EventType": "ProcessStart",
    "ProcessName": "svchost",
    "Pid": 1924,
    "FilePath": null,
    "Extra": {
      "ParentPid": 1792,
      "ImageFileName": "svchost.exe"
    }
  },
  {
    "Timestamp": "2025-08-23T19:08:07.586459+05:30",
    "EventType": "ProcessStart",
    "ProcessName": "svchost",
    "Pid": 23612,
    "FilePath": null,
    "Extra": {
      "ParentPid": 1792,
      "ImageFileName": "svchost.exe"
    }
  },
  {
    "Timestamp": "2025-08-23T19:08:08.231772+05:30",
    "EventType": "ProcessStart",
    "ProcessName": "svchost",
    "Pid": 22388,
    "FilePath": null,
    "Extra": {
      "ParentPid": 1792,
      "ImageFileName": "svchost.exe"
    }
  },
  {
    "Timestamp": "2025-08-23T19:08:11.3982588+05:30",
    "EventType": "ProcessStop",
    "ProcessName": "WhatsApp",
    "Pid": 7300,
    "FilePath": null,
    "Extra": null
  },
  {
    "Timestamp": "2025-08-23T19:08:11.4470924+05:30",
    "EventType": "ProcessStop",
    "ProcessName": "dllhost",
    "Pid": 21200,
    "FilePath": null,
    "Extra": null
  },
  {
    "Timestamp": "2025-08-23T19:08:27.9766333+05:30",
    "EventType": "ProcessStart",
    "ProcessName": "git",
    "Pid": 19992,
    "FilePath": null,
    "Extra": {
      "ParentPid": 17912,
      "ImageFileName": "git.exe"
    }
  },
  {
    "Timestamp": "2025-08-23T19:08:27.9978712+05:30",
    "EventType": "ProcessStart",
    "ProcessName": "conhost",
    "Pid": 23008,
    "FilePath": null,
    "Extra": {
      "ParentPid": 19992,
      "ImageFileName": "conhost.exe"
    }
  },
  {
    "Timestamp": "2025-08-23T19:08:28.0829919+05:30",
    "EventType": "ProcessStart",
    "ProcessName": "git",
    "Pid": 23136,
    "FilePath": null,
    "Extra": {
      "ParentPid": 19992,
      "ImageFileName": "git.exe"
    }
  },
  {
    "Timestamp": "2025-08-23T19:17:02.0707972+05:30",
    "EventType": "ProcessStart",
    "ProcessName": "chrome",
    "Pid": 23024,
    "FilePath": null,
    "Extra": {
      "ParentPid": 23396,
      "ImageFileName": "chrome.exe"
    }
  },
  {
    "Timestamp": "2025-08-23T19:17:32.2037123+05:30",
    "EventType": "ProcessStop",
    "ProcessName": "chrome",
    "Pid": 23024,
    "FilePath": null,
    "Extra": null
  },
  {
    "Timestamp": "2025-08-23T19:17:32.2047614+05:30",
    "EventType": "ProcessStart",
    "ProcessName": "chrome",
    "Pid": 13884,
    "FilePath": null,
    "Extra": {
      "ParentPid": 23396,
      "ImageFileName": "chrome.exe"
    }
  },
  {
    "Timestamp": "2025-08-23T19:18:02.3604853+05:30",
    "EventType": "ProcessStop",
    "ProcessName": "chrome",
    "Pid": 13884,
    "FilePath": null,
    "Extra": null
  },
  {
    "Timestamp": "2025-08-23T19:18:02.36268+05:30",
    "EventType": "ProcessStart",
    "ProcessName": "chrome",
    "Pid": 22964,
    "FilePath": null,
    "Extra": {
      "ParentPid": 23396,
      "ImageFileName": "chrome.exe"
    }
  }
]
function build(targetlog){
    // let logmap={}
    // let flag=false
    // function recursive(targetlog){
    //     if(!flag) return
    //     const pid = targetlog.Pid;
    //     let start,stop=null
    //     let children=[]
    //     for(let i=0;i<data.length;i++){
    //         const currentLog = data[i]
    //         if(currentLog.Pid===pid){
    //             if(currentLog.EventType==="ProcessStart") start=i
    //             else if(currentLog.EventType==="ProcessStop"){
    //                 stop=i
    //                 break
    //             }
    //         }
    //     }
    //     //finding children
    //     if(start && stop && (start<stop)){
    //         for(let i=start+1;i<stop;i++){
    //             let currentLog = data[i]
    //             if(currentLog?.Extra?.ParentPid === pid){
    //                 children.push(data[i])
    //             }
    //         }
    //     }
    //     logmap["start"]= start!==null ? data[start] : null
    //     logmap["stop"]= stop!==null ? data[stop] : null
    //     if(children.length){
    //         logmap["start"]["children"]=[]
    //         flag=true
    //         children.forEach(c=>{
    //             logmap["start"]["children"].push(c)
    //             recursive(c)
    //         })
    //     }else{
    //         flag=false
    //     }
    // }
    // recursive(targetlog)
    // console.log(logmap)
    //pre-processing for efficient lookup
}
// build({"Timestamp":"2025-08-23T19:08:27.9766333+05:30","EventType":"ProcessStart","ProcessName":"git","Pid":19992,"FilePath":null,"Extra":{"ParentPid":17912,"ImageFileName":"git.exe"}})
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

const targetLog={"Timestamp":"2025-08-23T19:08:27.9766333+05:30","EventType":"ProcessStart","ProcessName":"git","Pid":19992,"FilePath":null,"Extra":{"ParentPid":17912,"ImageFileName":"git.exe"}}
// const targetLog={
//     "Timestamp": "2025-08-23T19:07:48.0521448+05:30",
//     "EventType": "ProcessStop",
//     "ProcessName": "",
//     "Pid": 17012,
//     "FilePath": null,
//     "Extra": null
//   }
const res=buildLogMap(data,targetLog)
// console.log(res.children)
    const dat={
        start: {
            Timestamp: '2025-08-23T19:10:57.707226+05:30',
            EventType: 'ProcessStart',
            ProcessName: 'git',
            Pid: 19992,
            FilePath: null,
            Extra: { ParentPid: 10728, ImageFileName: 'git.exe' }
        },
        stop: {
            Timestamp: '2025-08-23T19:10:57.8015369+05:30',
            EventType: 'ProcessStop',
            ProcessName: 'git',
            Pid: 19992,
            FilePath: null,
            Extra: null
        },
        children: [
                    {
            start: {
            Timestamp: '2025-08-23T19:10:57.7165954+05:30',
            EventType: 'ProcessStart',
            ProcessName: 'conhost',
            Pid: 8340,
            FilePath: null,
            Extra: [Object]
            },
            stop: {
            Timestamp: '2025-08-23T19:10:57.8041197+05:30',
            EventType: 'ProcessStop',
            ProcessName: 'conhost',
            Pid: 8340,
            FilePath: null,
            Extra: null
            },
            children: []
        },
        {
            start: {
            Timestamp: '2025-08-23T19:10:57.7606111+05:30',
            EventType: 'ProcessStart',
            ProcessName: 'git',
            Pid: 11960,
            FilePath: null,
            Extra: [Object]
            },
            stop: {
            Timestamp: '2025-08-23T19:10:57.798217+05:30',
            EventType: 'ProcessStop',
            ProcessName: 'git',
            Pid: 11960,
            FilePath: null,
            Extra: null
            },
            
            children: []
        }
        ]
    }
/**
 [{
  "includePaths": ["C:\\Users", "C:\\Projects"],
  "excludePaths": ["C:\\Windows", "C:\\Program Files"],
  "eventTypes": ["ProcessStart", "ProcessStop","FileIO"]
}]
"includePorts": [80, 443],
"excludeIPs": ["127.0.0.1"]
[
  {
    "includePaths": ["C:\\Users", "C:\\Projects"],
    "excludePaths": ["C:\\Windows", "C:\\Program Files"],
    "eventTypes": ["ProcessStart", "ProcessStop", "FileIO", "Network"]
  }
]
[{
  "includePaths": ["C:\\users\\vishu\\Downloads","D:\\"],
  "excludePaths": ["C:\\Windows", "C:\\Program Files"],
  "eventTypes": ["FileRead","FileWrite","FileRename", "ProcessStart", "ProcessStop"]
}]

 */