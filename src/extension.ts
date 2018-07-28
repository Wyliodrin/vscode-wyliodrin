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
        vscode.window.showInformationMessage ('Using profile ' + currentProfile.name);
        api.init (currentProfile.host, currentProfile.token);
    }
    require ('./commands/application');
    require ('./commands/user');
    require ('./commands/clusters');
    require ('./commands/product');
    require ('./commands/projects');
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "wylio" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {
}