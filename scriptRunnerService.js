const axios = require('axios');
const vscode = require('vscode');
const settings = require('./settings.js');
const { ensureCredentials } = require('./utils');
const { fetchDevices } = require('./deviceService');

const runScriptOnDevice = async (context) => {
    /**
     * Runs a Groovy script on a selected device using LogicMonitor API.
     * - Ensures credentials are set using SecretStorage.
     * - Retrieves and validates the script from the active editor.
     * - Sends the script execution request to the API and polls for the output.
     *
     * @param {vscode.ExtensionContext} context The extension context
     * @returns {Promise<void>}
     */
    
    // Step 1: Ensure credentials are set
    if (!(await ensureCredentials(context))) return;

    // Step 2: Retrieve credentials from SecretStorage
    const secretStorage = context.secrets;
    const companyName = await secretStorage.get('logicmonitor.companyName');
    const apiKey = await secretStorage.get('logicmonitor.apiKey');

    if (!companyName || !apiKey) {
        vscode.window.showErrorMessage('Credentials are missing. Please configure them again.');
        return;
    }

    // Step 3: Retrieve the active editor and validate the script
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor. Please open a file to run the script.');
        return;
    }

    const script = editor.document.getText();
    if (!script) {
        vscode.window.showErrorMessage('No script found in the active editor!');
        return;
    }

    // Step 4: Retrieve the selected device from the global state
    let selectedDevice = context.globalState.get('selectedDevice');

    // If no device is selected, run fetchDevices to select one
    if (!selectedDevice) {
        await fetchDevices(context);
        selectedDevice = context.globalState.get('selectedDevice'); // Try fetching the newly selected device

        if (!selectedDevice) {
            vscode.window.showErrorMessage('No device selected. Please select a device to run the script on.');
            return; // Exit if no device is selected after prompting
        }
    }

    try {
        // Step 5: Send the script execution request
        const response = await axios.post(
            `${settings.apiProtocol}://${companyName}.${settings.apiDomain}/${settings.apiPath}/debug/?collectorId=${selectedDevice.collectorId}`,
            {
                cmdline: `!groovy hostId=${selectedDevice.id} \n ${script}` // Format script execution command
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'X-Version': settings.apiVersion
                }
            }
        );

        // Step 6: Handle the response and poll for output
        if (response.data.sessionId) {
            vscode.window.showInformationMessage('Script is running... Waiting for output...');
            await pollForOutput(response.data.sessionId, selectedDevice.collectorId, apiKey, companyName, context);
        } else {
            vscode.window.showErrorMessage('Failed to retrieve sessionId for script execution.');
        }
    } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage(`Error running script: ${error.message}`);
    }
};

// run script on new device
const runScriptOnNewDevice = async (context) => {
    /**
     * Runs a Groovy script on a selected device using LogicMonitor API.
     * - forces the user to select a device from the list of devices regardless of the selected device in the global state (new device basically)
     * - Ensures credentials are set using SecretStorage.
     * - Retrieves and validates the script from the active editor.
     * - Sends the script execution request to the API and polls for the output.
     *
     * @param {vscode.ExtensionContext} context The extension context
     * @returns {Promise<void>}
     */
    
    // Step 1: Ensure credentials are set
    if (!(await ensureCredentials(context))) return;

    // Step 2: Retrieve credentials from SecretStorage
    const secretStorage = context.secrets;
    const companyName = await secretStorage.get('logicmonitor.companyName');
    const apiKey = await secretStorage.get('logicmonitor.apiKey');

    if (!companyName || !apiKey) {
        vscode.window.showErrorMessage('Credentials are missing. Please configure them again.');
        return;
    }

    // Step 3: Retrieve the active editor and validate the script
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor. Please open a file to run the script.');
        return;
    }

    const script = editor.document.getText();
    if (!script) {
        vscode.window.showErrorMessage('No script found in the active editor!');
        return;
    }

    // Step 4: Retrieve the selected device from the global state
    let selectedDevice = context.globalState.get('selectedDevice');

    // Fetch new device
    await fetchDevices(context);
    selectedDevice = context.globalState.get('selectedDevice'); // Try fetching the newly selected device

    if (!selectedDevice) {
        vscode.window.showErrorMessage('No device selected. Please select a device to run the script on.');
        return; // Exit if no device is selected after prompting
    }

    try {
        // Step 5: Send the script execution request
        const response = await axios.post(
            `${settings.apiProtocol}://${companyName}.${settings.apiDomain}/${settings.apiPath}/debug/?collectorId=${selectedDevice.collectorId}`,
            {
                cmdline: `!groovy hostId=${selectedDevice.id} \n ${script}` // Format script execution command
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'X-Version': settings.apiVersion
                }
            }
        );

        // Step 6: Handle the response and poll for output
        if (response.data.sessionId) {
            vscode.window.showInformationMessage('Script is running... Waiting for output...');
            await pollForOutput(response.data.sessionId, selectedDevice.collectorId, apiKey, companyName, context);
        } else {
            vscode.window.showErrorMessage('Failed to retrieve sessionId for script execution.');
        }
    }
    catch (error) {
        console.error(error);
        vscode.window.showErrorMessage(`Error running script: ${error.message}`);
    }
};

// Poll for script output
const pollForOutput = async (sessionId, collectorId, apiKey, companyName, context) => {
    /**
     * Polls LogicMonitor API for the output of the script execution.
     * - Sends a request every `pollEvery` seconds to check for script output.
     * - Displays the output in a new editor tab when ready.
     *
     * @param {string} sessionId The session ID of the script execution
     * @param {string} collectorId The collector ID of the selected device
     * @param {string} apiKey The API key from SecretStorage
     * @param {string} companyName The company name from SecretStorage
     * @param {vscode.ExtensionContext} context The extension context
     * @returns {Promise<void>}
     */
    try {
        const intervalId = setInterval(async () => {
            try {
                const result = await axios.get(
                    `${settings.apiProtocol}://${companyName}.${settings.apiDomain}/${settings.apiPath}/debug/${sessionId}?collectorId=${collectorId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'X-Version': settings.apiVersion
                        }
                    }
                );

                if (result.data.output && result.data.output.trim() !== "") {
                    // Output is ready, stop polling
                    clearInterval(intervalId);

                    // Show the output in a new editor tab
                    await showOutputInNewTab(context, result.data.output);
                } else {
                    console.log('Output not ready yet, continuing to poll...');
                }
            } catch (error) {
                clearInterval(intervalId);
                console.error('Error polling for output:', error);
                vscode.window.showErrorMessage(`Error polling for script output: ${error.message}`);
            }
        }, settings.pollEvery); // Poll every few seconds as defined in settings
    } catch (error) {
        console.error('Error starting the polling process:', error);
        vscode.window.showErrorMessage(`Error starting polling: ${error.message}`);
    }
};

/**
 * Opens a new webview panel and displays the script output in a console-like style.
 *
 * @param {vscode.ExtensionContext} context The extension context to access global state
 * @param {string} output The script output to display
 */
const showOutputInNewTab = async (context, output) => {
    const selectedDevice = context.globalState.get('selectedDevice');
    // Create a new Webview panel
    const panel = vscode.window.createWebviewPanel(
        'scriptOutput', // ID
        `Script Output - ${selectedDevice.label}`, // Title
        vscode.ViewColumn.One, 
        {
            enableScripts: true,
            localResourceRoots: [], 
        }
    );

    // terminal-like styling
    const htmlContent = `
<html>
    <head>
        <style>
            body {
                background-color: #2e3436;
                color: #dcdcdc;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                padding: 20px;
                margin: 0;
                line-height: 1.5;
                overflow-y: auto;
            }
            .header {
                font-size: 18px;
                font-weight: bold;
                color: #f8f8f2;
                margin-bottom: 10px;
            }
            .description {
                font-size: 14px;
                color: #aaa;
                margin-bottom: 20px;
            }
            .device-details {
                font-size: 14px;
                color: #f8f8f2;
                margin-bottom: 20px;
                background-color: #1e2222;
                padding: 10px;
                border-radius: 5px;
                box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
            }
            .console {
                white-space: pre-wrap;
                word-wrap: break-word;
                overflow-wrap: break-word;
                max-height: 500px;
                padding: 10px;
                border-radius: 5px;
                background-color: #1e2222;
                color: #f8f8f2;
                box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
                font-size: 13px;
                font-family: 'Courier New', monospace;
                overflow-y: auto;
                height: 100%;
            }
        </style>
    </head>
    <body>
        <!-- Title Section -->
        <div class="header">Script Output - Device: ${selectedDevice.label}</div>
        
        <!-- Device Details Section -->
        <div class="device-details">
            <strong>Device Details:</strong><br/>
            <strong>Label:</strong> ${selectedDevice.label}<br/>
            <strong>ID:</strong> ${selectedDevice.id}<br/>
            <strong>Collector ID:</strong> ${selectedDevice.collectorId}<br/>
        </div>

        <!-- Description Section -->
        <div class="description">Here is the output of your script execution. Scroll through the results below:</div>
        
        <!-- Console Section -->
        <div class="console">
${output.replace(/\n/g, '<br/>')} <!-- replace newlines in output with br -->
        </div>
    </body>
</html>
`;
    
    // Set the HTML content for the webview
    panel.webview.html = htmlContent;

    // show a success message sayings its ready
    vscode.window.showInformationMessage('Script output is ready!');
};

module.exports = {
    runScriptOnDevice,
    runScriptOnNewDevice
};
