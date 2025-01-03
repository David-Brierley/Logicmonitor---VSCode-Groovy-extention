const vscode = require('vscode');

const getSettings = () => {
  const config = vscode.workspace.getConfiguration('logicmonitor');
  return {
    //companyName: config.get('companyName'), // ** stored in secret storage **
    //apiKey: config.get('apiKey'), // ** stored in secret storage **
    apiVersion: config.get('apiVersion'), // should be version 3 but can be changed e.g. for future compatibility
    apiProtocol: config.get('apiProtocol'), // should always be https really but here as option
    apiDomain: config.get('apiDomain'), // should be logicmonitor.com but here as option
    apiPath: config.get('apiPath'), // should be 'santaba/rest' but here as option
    pollEvery: config.get('pollEvery'), // in milliseconds in case of long running scripts
    clearDeviceOnRestart: config.get('clearDeviceOnRestart'), // clear selected device on extension restart
    clearApiKeyOnRestart: config.get('clearApiKeyOnRestart'), // clear API key on extension restart
    sizeValue: config.get('sizeValue'), // value for size parameter in API calls (GET Requests)
  };
};

const settings = getSettings();

module.exports = settings;