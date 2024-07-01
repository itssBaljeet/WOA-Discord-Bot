const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'logs', 'error.log');

function logError(error) {
  const logMessage = `[${new Date().toISOString()}] ${error}\n`;
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
}

module.exports = logError;
