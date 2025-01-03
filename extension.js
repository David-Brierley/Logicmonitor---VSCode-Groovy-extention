const vscode = require('vscode');
const { fetchDevices, clearSelectedDevice, displaySelectedDevice } = require('./deviceService');
const { runScriptOnDevice, runScriptOnNewDevice } = require('./scriptRunnerService');
const { updateApiKey, updateCompanyName, clearConfig, configure, clearApiKey, clearCompanyName } = require('./utils');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Logicmonitor - Groovy Runner');
    // Clean up the selected device and API key on extension restart
    cleanUp(context);
    
    // Register the commands
    registerCommands(context);
}

function cleanUp(context) {
    /*******************************************************************************************************************************************
     * Clean up the selected device and API key on extension restart
     * 
     * clearDeviceOnRestart: Clears the selected device on extension restart
     * clearApiKeyOnRestart: Clears the API key on extension restart
     * 
     * These settings are used to clear the selected device and API key on extension restart.
     * The selected device and API key are stored in the global state and secret storage respectively.
     * 
     *******************************************************************************************************************************************/

    // Check if clearDeviceOnRestart is set to true
    const clearDeviceOnRestart = vscode.workspace.getConfiguration('settings').get('clearDeviceOnRestart');

    if (clearDeviceOnRestart) {
        // Clear the selected device if the setting is enabled
        clearSelectedDevice(context);
        console.log('Cleared selected device on extension restart');
    }

    // Check if clearApiKeyOnRestart is set to true
    const clearApiKeyOnRestart = vscode.workspace.getConfiguration('settings').get('clearApiKeyOnRestart');

    if (clearApiKeyOnRestart) {
        // Clear the API key if the setting is enabled
        clearApiKey(context);
        console.log('Cleared API key on extension restart');
    }
}

function registerCommands(context) {
    // Register the device commands
    registerDeviceCommands(context);

    // Register the script commands
    registerScriptCommands(context);

    // Register the configuration commands
    registerConfigurationCommands(context);
}

function registerDeviceCommands(context) {
    /*******************************************************************************************************************************************
     * Device commands
     * 
     * fetchDevices: Fetches the devices from the LogicMonitor API and displays them in a quick pick menu
     * displaySelectedDevice: Displays the selected device in a quick pick menu
     * clearSelectedDevice: Clears the selected device
     * 
     * These commands are used to manage the selected device.
     * The selected device is stored in the global state.
     * The global state is used to store data that persists across sessions.
     * 
     *******************************************************************************************************************************************/

    // Register the fetch devices command
    const fetchDevicesCommand = vscode.commands.registerCommand('logicmonitor-groovy-runner.fetchDevices', () => fetchDevices(context));
    context.subscriptions.push(fetchDevicesCommand);

    // Register the display selected device command
    const displaySelectedDeviceCommand = vscode.commands.registerCommand('logicmonitor-groovy-runner.displaySelectedDevice', () => displaySelectedDevice(context));
    context.subscriptions.push(displaySelectedDeviceCommand);

    // Register the clear selected device command
    const clearSelectedDeviceCommand = vscode.commands.registerCommand('logicmonitor-groovy-runner.clearSelectedDevice', () => clearSelectedDevice(context));
    context.subscriptions.push(clearSelectedDeviceCommand);
}

function registerScriptCommands(context) {
    /*******************************************************************************************************************************************
     * Script commands
     * 
     * runScript: Runs the selected script on the selected device, if a device is selected, if not, prompts the user to select a device
     * runScriptOnNewDevice: Runs the selected script on a new device, prompting the user to select a device
     * 
     * These commands are used to run the selected script on a device.
     * The script is run on the selected device if a device is selected.
     * If no device is selected, the user is prompted to select a device.
     * 
     *******************************************************************************************************************************************/

    // Register the run script command
    const runScriptCommand = vscode.commands.registerCommand('logicmonitor-groovy-runner.runScript', () => runScriptOnDevice(context));
    context.subscriptions.push(runScriptCommand);

    // Register the run script on new device command
    const runScriptOnNewDeviceCommand = vscode.commands.registerCommand('logicmonitor-groovy-runner.runScriptOnNewDevice', () => runScriptOnNewDevice(context));
    context.subscriptions.push(runScriptOnNewDeviceCommand);
}

function registerConfigurationCommands(context) {
    /*******************************************************************************************************************************************
     * Configuration commands
     * 
     * updateApiKey: Updates the stored API key (uses the secret storage)
     * updateCompanyName: Updates the stored company name (uses the secret storage)
     * configure: Configures the extension with a new company name and API key 
     * clearConfig: Clears the stored company name and API key
     * clearApiKey: Clears the stored API key
     * clearCompanyName: Clears the stored company name
     * 
     * These commands are used to manage the stored company name and API key.
     * The company name and API key are stored in the secret storage.
     * The secret storage is used to store sensitive information securely.
     * 
     *
     *******************************************************************************************************************************************/

    // Register the update API key command
    const updateApiKeyCommand = vscode.commands.registerCommand('logicmonitor-groovy-runner.updateApiKey', () => updateApiKey(context));
    context.subscriptions.push(updateApiKeyCommand);

    // Register the update company name command
    const updateCompanyNameCommand = vscode.commands.registerCommand('logicmonitor-groovy-runner.updateCompanyName', () => updateCompanyName(context));
    context.subscriptions.push(updateCompanyNameCommand);

    // Register the configure command
    const configureCommand = vscode.commands.registerCommand('logicmonitor-groovy-runner.configure', () => configure(context));
    context.subscriptions.push(configureCommand);

    // Register the clear config command
    const clearConfigCommand = vscode.commands.registerCommand('logicmonitor-groovy-runner.clearConfig', () => clearConfig(context));
    context.subscriptions.push(clearConfigCommand);

    // Register the clear API key command
    const clearApiKeyCommand = vscode.commands.registerCommand('logicmonitor-groovy-runner.clearApiKey', () => clearApiKey(context));
    context.subscriptions.push(clearApiKeyCommand);

    // Register the clear company name command
    const clearCompanyNameCommand = vscode.commands.registerCommand('logicmonitor-groovy-runner.clearCompanyName', () => clearCompanyName(context));
    context.subscriptions.push(clearCompanyNameCommand);
}

/**
 * This method is called when your extension is deactivated (Can probably go? ...)
 */
function deactivate() {}

module.exports = {
    activate,
    deactivate
};
