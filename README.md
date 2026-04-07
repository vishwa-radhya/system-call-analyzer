# SysWatch: Lightweight System Call Logger & Anomaly Detector

SysWatch is a real-time system monitoring and anomaly detection platform designed for Windows environments. It captures low-level system events using Event Tracing for Windows (ETW), processes them through a backend service, and visualizes activity in an interactive frontend.

The project focuses on providing clear visibility into system behavior while enabling detection of suspicious patterns through rule-based and statistical techniques.

---

## Overview

SysWatch is built as a multi-layered system:

- **Event Collection Layer (C# + ETW)**
  - Captures system-level events such as process creation and termination
  - Designed for high-throughput, low-latency logging

- **Backend Layer (Node.js)**
  - Manages communication with the ETW logger
  - Streams events to clients via WebSockets
  - Acts as a bridge between low-level logging and UI

- **Frontend Layer (React)**
  - Displays system activity in real time
  - Provides filtering, visualization, and analysis tools

---

## Key Features

### Real-Time System Monitoring
- Process start and termination tracking
- High-frequency event logging using ETW
- Efficient handling of large event streams

### Interactive Visualization
- Live event feed
- Process tree representation
- Filtering by process name and event type

### Anomaly Detection 
- Rule-based detection for known suspicious behaviors
- Behavioral detection using statistical deviations
- Unified risk scoring system with severity levels:
  - Low, Medium, High, Critical

### AI-Assisted Analysis
- Summarization of system activity
- Contextual insights for detected anomalies

---

## Architecture

| ETW Logger | -----> | Node Backend | -----> | React Frontend |

## Tech Stack

- **System Layer**: C#, ETW (Event Tracing for Windows)
- **Backend**: Node.js, WebSocket
- **Frontend**: React, JavaScript
- **Data Handling**: Real-time streaming (tailing jsonl file)

---

## Getting Started

### Prerequisites

- Windows OS (ETW is required)
- .NET SDK
- Node.js (v18+ recommended)
- npm or yarn

---

### Setup

#### 1. Clone the repository
```bash
git clone https://github.com/vishwa-radhya/system-call-analyzer
cd folder
```
#### 2. Start the Backend
Node.js manages the C# Logger as a child process so, starting node.js starts  logger automatically.

**Note:** Administrator privileges are required to access ETW providers.
```
cd backend
npm install
node index.js
```
#### 3. Start the Frontend
Use another terminal window
```
cd frontend
npm install
npm run dev
```

### Security Considerations
- Requires elevated privileges for system-level monitoring
- Designed for local analysis; production deployment should include:
  - Authentication for backend APIs
  - Secure WebSocket communication (WSS)
  - Access control for sensitive logs

### Use Cases
- Cybersecurity research and experimentation
- System behavior analysis
- Educational tool for OS-level event tracing
- Prototype for anomaly detection systems

### Limitations
- Windows-only (due to ETW dependency)
- Limited event coverage in current version
- Anomaly detection is under active development