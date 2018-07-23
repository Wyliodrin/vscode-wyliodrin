'use strict';
// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import {ProfileService} from './utils/profile';

let api = require ('./libwylio/calls');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    ProfileService.setContext (context);
    let currentProfile = ProfileService.getCurrentProfile ();
    if (currentProfile){
        ProfileService.setActiveProfile (currentProfile.name);
        vscode.window.showInformationMessage ('Using profile ' + currentProfile);
        api.init (currentProfile.host, currentProfile.token);

    }

    require ('./commands/application');
    require ('./commands/user');
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "wylio" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
        //vscode.window.sho
    });
    console.log ('before');
    vscode.commands.registerCommand ('extension.test', async ()=>{
        let data = await vscode.window.showInputBox();
        console.log (data);
    });
    console.log ('after');
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}