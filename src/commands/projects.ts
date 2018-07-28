import * as vscode from 'vscode';
import {Libwylio} from '../utils/libwylio';
vscode.commands.registerCommand ('wylio.project_init', async ()=>{
    Libwylio.get (async (api)=>{
        let workspace = vscode.workspace.rootPath;
        if (!workspace){
            let a = await vscode.window.showOpenDialog({canSelectFiles: false, canSelectMany: false, canSelectFolders: true});
            if (a && a.length > 0){
                let result = vscode.workspace.updateWorkspaceFolders(0, null, {uri:a[0]});
                if (result)
                    workspace = vscode.workspace.rootPath;
            }
        }
        if (workspace){
            
        }
        else{
            vscode.window.showErrorMessage ('Command required a workspace folder. Please select a folder and try again.');
        }
    });
});