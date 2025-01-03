const vscode = require('vscode'); // Import vscode API
const fs = require('fs').promises;
const path = require('path');


// Key names for the secrets
const COMPANY_NAME_KEY = 'logicmonitor.companyName';
const API_KEY_KEY = 'logicmonitor.apiKey';


/*******************************************************************************************************************************************
 * Ensure credentials are set (used in deviceService.js and scriptRunnerService.js, essentially prompting users if missing)
 *******************************************************************************************************************************************/

// Ensure credentials are set (companyName and apiKey)
const ensureCredentials = async (context) => {
    const secretStorage = context.secrets;

    // Retrieve stored credentials
    let companyName = await secretStorage.get(COMPANY_NAME_KEY);
    let apiKey = await secretStorage.get(API_KEY_KEY);

    if (!companyName) {
        companyName = await vscode.window.showInputBox({
            prompt: 'Enter your LogicMonitor company name (e.g., example for your url example.logicmonitor.com)',
            placeHolder: 'example'
        });
        if (companyName) {
            await secretStorage.store(COMPANY_NAME_KEY, companyName);
        } else {
            vscode.window.showErrorMessage('Company name is required!');
            return false;
        }
    }

    if (!apiKey) {
        apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your LogicMonitor API key (Only supports Bearer Tokens, NOT LMv1)',
            placeHolder: 'API Key',
            password: true
        });
        if (apiKey) {
            await secretStorage.store(API_KEY_KEY, apiKey);
        } else {
            vscode.window.showErrorMessage('API key is required!');
            return false;
        }
    }

    return true; // Credentials are set
};

/*******************************************************************************************************************************************
 * Configure command - prompts for new company name and API key regardless of existing values
 *******************************************************************************************************************************************/

// Configure company name and API key
const configure = async (context) => {
    const secretStorage = context.secrets;

    const companyName = await vscode.window.showInputBox({
        prompt: 'Enter your LogicMonitor company name (e.g., example for example.logicmonitor.com)',
        placeHolder: 'example'
    });
    if (companyName) {
        await secretStorage.store(COMPANY_NAME_KEY, companyName);
    } else {
        vscode.window.showErrorMessage('Company name is required!');
        return;
    }

    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your LogicMonitor API key (Only supports Bearer Tokens, NOT LMv1)',
        placeHolder: 'API Key',
        password: true
    });
    if (apiKey) {
        await secretStorage.store(API_KEY_KEY, apiKey);
    } else {
        vscode.window.showErrorMessage('API key is required!');
        return;
    }

    vscode.window.showInformationMessage('Configuration successful!');
};



/*******************************************************************************************************************************************
 * Allow individual updates to the company name and API key
 *******************************************************************************************************************************************/

// Update company name
const updateCompanyName = async (context) => {
    const secretStorage = context.secrets;

    const companyName = await vscode.window.showInputBox({
        prompt: 'Enter your new LogicMonitor company name (e.g., example.logicmonitor.com)',
        placeHolder: 'example'
    });
    if (companyName) {
        await secretStorage.store(COMPANY_NAME_KEY, companyName);
        vscode.window.showInformationMessage('Company name updated successfully!');
    } else {
        vscode.window.showErrorMessage('Company name update canceled.');
    }
};

// Update API key
const updateApiKey = async (context) => {
    const secretStorage = context.secrets;

    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your new LogicMonitor API key',
        placeHolder: 'API Key',
        password: true
    });
    if (apiKey) {
        await secretStorage.store(API_KEY_KEY, apiKey);
        vscode.window.showInformationMessage('API key updated successfully!');
    } else {
        vscode.window.showErrorMessage('API key update canceled.');
    }
};

/*******************************************************************************************************************************************
 * Allow clearing stored credentials as a whole or individually
 *******************************************************************************************************************************************/

// Clear stored credentials
const clearConfig = async (context) => {
    const secretStorage = context.secrets;

    await secretStorage.delete(COMPANY_NAME_KEY);
    await secretStorage.delete(API_KEY_KEY);

    vscode.window.showInformationMessage('Credentials cleared successfully!');
};

// Clear API key
const clearApiKey = async (context) => {
    const secretStorage = context.secrets;

    await secretStorage.delete(API_KEY_KEY);

    vscode.window.showInformationMessage('API key cleared successfully!');
};

// Clear company name
const clearCompanyName = async (context) => {
    const secretStorage = context.secrets;

    await secretStorage.delete(COMPANY_NAME_KEY);

    vscode.window.showInformationMessage('Company name cleared successfully!');
};


module.exports = {
    ensureCredentials,
    configure,
    updateCompanyName,
    updateApiKey,
    clearConfig,
    clearApiKey,
    clearCompanyName
};
