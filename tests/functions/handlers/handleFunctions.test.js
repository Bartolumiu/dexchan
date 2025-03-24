const fs = require('fs');
const loadFunctions = require('../../../src/functions/handlers/handleFunctions');
const getChalk = require('../../../src/functions/tools/getChalk');

jest.mock('fs');

jest.mock('chalk', () => ({
  default: {
    blueBright: (msg) => msg,
    greenBright: (msg) => msg,
    redBright: (msg) => msg,
  }
}), { virtual: true });

// Setup virtual file structure for functions
const fsMockData = {
  './src/functions': ['folderA', 'folderB', 'folderC', 'folderError', 'folderSkip', 'folderEmpty', 'folderSkipNonFunction'],
  './src/functions/folderA': ['dummyFunction.js'],
  './src/functions/folderB': ['notAFunction.js'],
  './src/functions/folderC': ['handleFunctions.js'],
  './src/functions/folderError': ['errorFunction.js'],
  './src/functions/folderSkip': ['checkUpdates.js'],
  // folderEmpty returns an empty array to simulate no .js files.
  './src/functions/folderEmpty': [],
  './src/functions/folderSkipNonFunction': ['urlParser.js']
};

fs.readdirSync.mockImplementation((path) => {
  return fsMockData[path] || [];
});

// Create virtual modules for test cases:
jest.mock('../../../src/functions/folderA/dummyFunction.js', () => {
  return (client) => {
    client.calledDummy = true;
  };
}, { virtual: true });

jest.mock('../../../src/functions/folderB/notAFunction.js', () => {
  return {};
}, { virtual: true });

jest.mock('../../../src/functions/folderError/errorFunction.js', () => {
  throw new Error('Require error');
}, { virtual: true });

jest.mock('../../../src/functions/folderSkip/checkUpdates.js', () => {
  return (client) => {
    client.calledCheckUpdates = true;
  };
}, { virtual: true });

jest.mock('../../../src/functions/folderSkipNonFunction/urlParser.js', () => {
  return {};
}, { virtual: true });

describe('handleFunctions', () => {
  let logSpy;
  let errorSpy;
  let client;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    client = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load functions from folderA and execute the function, log successfully, and log errors for non-functions', async () => {
    const chalk = await getChalk();
    await loadFunctions(client);

    // Verify that the dummy function was executed.
    expect(client.calledDummy).toBe(true);

    // Verify that the initial loading message was logged.
    expect(logSpy).toHaveBeenNthCalledWith(1, chalk.blueBright('[Function Loader] Loading functions...'));

    // Verify that the successful load log for dummyFunction.js was printed.
    expect(logSpy).toHaveBeenNthCalledWith(2, chalk.greenBright('[Function Loader] Loaded dummyFunction.js in folderA.'));

    // Verify that non-function error in folderB was logged.
    expect(errorSpy).toHaveBeenCalledWith(chalk.redBright('Error: notAFunction.js in folderB is not exporting a function.'));
  });

  it('should not execute functions if they are in the skipCheck list', async () => {
    const chalk = await getChalk();
    await loadFunctions(client);

    // client should only be modified by dummyFunction.js from folderA.
    expect(client.calledDummy).toBe(true);
    // The skipCheck file (checkUpdates.js) should not execute.
    expect(client.calledCheckUpdates).toBeUndefined();

    // Also verify that no log indicating successful load for checkUpdates.js is present.
    expect(logSpy).not.toEqual(expect.arrayContaining([
      expect.stringContaining(chalk.greenBright('Loaded checkUpdates.js in folderSkip.')),
    ]));
  });

  it('should log error when require fails in loadFunction', async () => {
    await loadFunctions(client);

    // Expect that console.error is called with the error message from the thrown error.
    const errorCalls = errorSpy.mock.calls.map(call => call[0]);
    const errorFound = errorCalls.some(msg => msg.includes('Error requiring errorFunction.js in folderError:'));
    expect(errorFound).toBe(true);
  });

  it('should return early and not log for non-function modules in skipCheck list', async () => {
    await loadFunctions(client);

    const logCalls = logSpy.mock.calls.map(call => call[0]);
    const errorCalls = errorSpy.mock.calls.map(call => call[0]);
    const urlParserLogged = logCalls.some(msg => msg.includes('urlParser.js'));
    const urlParserErrored = errorCalls.some(msg => msg.includes('urlParser.js'));

    expect(urlParserLogged).toBe(false);
    expect(urlParserErrored).toBe(false);
  });
});
