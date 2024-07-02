const fs = require('fs');
const path = require('path');
const logError = require('../src/utils/logError');

jest.mock('fs');

describe('logError', () => {
  const originalDate = Date;

  beforeAll(() => {
    global.Date = jest.fn(() => new originalDate('2024-07-02T01:18:16.977Z'));
  });

  afterAll(() => {
    global.Date = originalDate;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should write the error message to the log file', () => {
    const error = new Error('Test error');
    const commandName = 'testCommand';
    const username = 'testUser';
    const logFilePath = path.join(__dirname, '../src/utils/logs/error.log');
    const logMessage = `[2024-07-02T01:18:16.977Z] Command: ${commandName}, User: ${username}, Error: ${error}\n`;

    logError(error, commandName, username);

    expect(fs.appendFile).toHaveBeenCalledWith(logFilePath, logMessage, expect.any(Function));
  });

  it('should log an error if writing to the log file fails', () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Test error');
    const commandName = 'testCommand';
    const username = 'testUser';
    fs.appendFile.mockImplementation((path, data, callback) => callback(new Error('Failed to write')));

    logError(error, commandName, username);

    expect(consoleErrorMock).toHaveBeenCalledWith('Failed to write to log file:', expect.any(Error));

    consoleErrorMock.mockRestore();
  });
});
