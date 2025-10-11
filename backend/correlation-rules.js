
/**
 * Helper to check if a process's recent activity matches a file-access-followed-by-network pattern.
 * @param {Array<Object>} history - All recent logs for the current PID.
 * @param {Object} currentLog - The log that just arrived.
 * @returns {boolean} - True if the correlation is found.
 */
function checkDataExfiltration(history, currentLog) {
    if (currentLog.EventType?.startsWith("Network")) {
        // Look for a suspicious file event (FileRename/FileWrite) in the history
        const suspiciousFileAccess = history.find(entry => {
            return (
                entry.EventType?.startsWith("File") &&
                /\.(zip|7z|rar|bak|sql)$/i.test(entry.FilePath || "") // Targeting compressed/backup files
            );
        });

        // If a suspicious file access was found, check if the current network log is external
        if (suspiciousFileAccess) {
            // Re-use the ExternalConnection logic from your atomic rules
            const addr = currentLog.Extra?.RemoteAddress;
            const isExternal = (
                addr &&
                !addr.startsWith("192.168.") &&
                !addr.startsWith("10.") &&
                !addr.startsWith("127.")
            );

            // If the connection is external, we have a hit!
            if (isExternal) {
                // Check time sequence: file access must precede network connect
                const fileTime = new Date(suspiciousFileAccess.Timestamp).getTime();
                const networkTime = new Date(currentLog.Timestamp).getTime();
                
                // For a more powerful presentation, let's limit the time window
                if (networkTime - fileTime > 0 && networkTime - fileTime < 5000) { // 5-second window
                    return true;
                }
            }
        }
    }
    return false;
}

export const correlationRules = [
  {
    name: "DataExfiltrationSequence",
    severity: "critical", // Highest severity for a multi-stage attack
    check: (history, currentLog) => checkDataExfiltration(history, currentLog),
    reason: (log) => `High-risk sequence detected: A process accessed a sensitive file type and then immediately connected to an external address (${log.Extra?.RemoteAddress}).`
  },
  // We can add more correlation rules here later
];