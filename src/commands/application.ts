import * as vscode from 'vscode';
let api = require ('../libwylio/calls').get();
vscode.commands.registerCommand ('wylio.application_new', async ()=>{
    console.log ('in function');
//     let id = await vscode.window.showInputBox ({prompt: 'Application id'});
//     let author = await vscode.window.showInputBox ({prompt: 'Application author'});
//     let platform = await vscode.window.showQuickPick(['x86', 'arm'], {placeHolder: 'Application platform'});
//     let privileged = await vscode.window.showQuickPick(['Yes', 'No'], {placeHolder: 'Run as a privileged application'});
//     let name = await vscode.window.showInputBox ({prompt: 'Application name'});

//     let params = {
//         appId: id,
//         author: author,
//         platform: platform,
//         privileged: privileged,
//         name: name
//     };

//     let response = await api.apps.new (params);
//     if (response)
//         vscode.window.showInformationMessage ('Application created successfully.');
//     else
//         vscode.window.showInformationMessage ('Could not create application.');
});

vscode.commands.registerCommand ('wylio.application_list', async ()=>{
    console.log ('list');
    if (api){
        let apps = await api.apps.list ();
        console.log (apps);
    }
    else{
        vscode.window.showErrorMessage ('No profile selected. Log in or select a profile.');
    }
});