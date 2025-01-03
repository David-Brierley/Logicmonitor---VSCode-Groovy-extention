const axios = require('axios');
const vscode = require('vscode');
const settings = require('./settings.js');
const { ensureCredentials } = require('./utils');

const fetchDevices = async (context) => {
    /**
     * Fetches devices from the LogicMonitor API based on the user's search criteria.
     * - Asks the user how they want to search for devices (by IP or by name).
     * - Prompts for the search term.
     * - Makes an API request and displays the devices to the user for selection.
     * - Stores the selected device in the global state.
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

    try {
        // Step 3: Ask the user how they want to search
        const searchBy = await vscode.window.showQuickPick(
            ['By IP', 'By Name'],
            { placeHolder: 'Select how you want to search devices' }
        );

        if (!searchBy) {
            vscode.window.showErrorMessage('Search method not selected!');
            return;
        }

        // Step 4: Ask the user to enter the search term based on their choice
        const searchTerm = await vscode.window.showInputBox({
            prompt: `Enter the ${searchBy === 'By IP' ? 'IP address' : 'device name'} to search`,
            placeHolder: `Search by ${searchBy === 'By IP' ? 'IP' : 'name'}`
        });

        if (!searchTerm) {
            vscode.window.showErrorMessage('Search term is required!');
            return;
        }

        // Step 5: Build the query based on the search method (API V3 needs strings in double quotes)
        const queryParam = searchBy === 'By IP' ? `name~"${searchTerm}"` : `displayName~"${searchTerm}"`;

        // Step 6: Make the API request with the appropriate query
        const response = await axios.get(`${settings.apiProtocol}://${companyName}.${settings.apiDomain}/${settings.apiPath}/device/devices`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-Version': settings.apiVersion
            },
            params: {
                filter: queryParam,
                size: settings.sizeValue
            }
        });

        const devices = response.data.items.map(device => ({
            label: device.displayName,
            id: device.id,
            collectorId: device.currentCollectorId
        }));

        // Step 7: If no devices are found, show a message and restart the process
        if (devices.length === 0) {
            vscode.window.showInformationMessage('No devices found matching your criteria. Please try again.');
            return fetchDevices(context); // Restart the process
        }

        // Step 8: Display the devices for the user to select from
        const selectedDevice = await vscode.window.showQuickPick(devices, {
            placeHolder: 'Select a device to run the script on'
        });

        if (selectedDevice) {
            vscode.window.showInformationMessage(`You selected: ${selectedDevice.label}`);
            context.globalState.update('selectedDevice', selectedDevice);
        }
    } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage(`Error fetching devices: ${error.message}`);
    }
};

// New method to clear the selected device
const clearSelectedDevice = async (context) => {
    /**
     * Clears the selected device from the global state.
     * - Resets the `selectedDevice` in the global state to null.
     * - Informs the user that the selected device has been cleared.
     *
     * @param {vscode.ExtensionContext} context The extension context
     * @returns {Promise<void>}
     */
    try {
        await context.globalState.update('selectedDevice', null);
        vscode.window.showInformationMessage('Selected device has been cleared.');
    } catch (error) {
        console.error('Error clearing the selected device:', error);
        vscode.window.showErrorMessage('Failed to clear the selected device.');
    }
};

/**
 * Displays the details of the currently selected device in a custom webview.
 *
 * @param {vscode.ExtensionContext} context The extension context
 * @returns {Promise<void>}
 */
const displaySelectedDevice = async (context) => {
    const selectedDevice = context.globalState.get('selectedDevice');

    if (!selectedDevice) {
        vscode.window.showWarningMessage('No device is currently selected.');
        return;
    }

    // Create a new Webview panel
    const panel = vscode.window.createWebviewPanel(
        'selectedDevice',
        'Selected Device Details',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            localResourceRoots: [],
        }
    );

    const htmlContent = `
<html>
    <head>
        <style>
            body {
                background-color: #2e3436;
                color: #dcdcdc;
                font-family: 'Courier New', monospace;
                font-size: 16px;
                line-height: 1.6;
                padding: 20px;
            }
            h1 {
                color: #f8f8f2;
                font-size: 32px;
                margin-bottom: 20px;
            }
            .device-info {
                margin-top: 20px;
                font-size: 18px;
                background-color: #1e2222;
                padding: 15px;
                border-radius: 5px;
                box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
            }
            .device-info p {
                margin: 5px 0;
                font-size: 16px;
            }
            .device-info .label {
                font-weight: bold;
                color: #f8f8f2;
            }
        </style>
    </head>
    <body>
        <h1>Device Details</h1>
        <div class="device-info">
            <p><span class="label">Device Name:</span> ${selectedDevice.label}</p>
            <p><span class="label">Device ID:</span> ${selectedDevice.id}</p>
            <p><span class="label">Collector ID:</span> ${selectedDevice.collectorId}</p>
        </div>
    </body>
</html>
`;

    // Set the HTML content for the webview
    panel.webview.html = htmlContent;
};



module.exports = {
    fetchDevices,
    clearSelectedDevice,
    displaySelectedDevice
};
