import * as vscode from 'vscode';
import {Libwylio} from '../utils/libwylio';
const uuid = require ('uuid');
vscode.commands.registerCommand ('wylio.project_init', async ()=>{
    Libwylio.get (async (api)=>{
        let workspace = vscode.workspace.rootPath;
        if (!workspace){
            let a = await vscode.window.showOpenDialog({canSelectFiles: false, canSelectMany: false, canSelectFolders: true});
            if (a && a.length > 0){
                let result = await vscode.workspace.updateWorkspaceFolders(0, null, {uri:a[0]});
                if (result)
                    workspace = vscode.workspace.rootPath;
            }
        }
        if (workspace){
            console.log ('we have workspace');
            let name = await vscode.window.showInputBox ({prompt: 'Project name.'});
            if (name && name.length > 0){
                let settings = await api.settings.get();
                if (settings){
                    let platforms = Object.keys (settings.PLATFORM);
                    let platform = await vscode.window.showQuickPick(platforms, {placeHolder: 'Project platform', canPickMany: false});
                    console.log (platform);
                    if (platform){
                        console.log ('in if');
                        let language;
                        console.log (api.firmwarePlatforms.indexOf (platform));
                        api.firmarePlatforms
                        if (api.firmwarePlatforms.indexOf (platform) === -1){
                            console.log ('language');
                            language = await vscode.window.showQuickPick(api.languages, {placeHolder: 'Project language', canPickMany: false});
                        }
                        else{
                            language = platform;
                        }
                        if (language){
                            let ui = await vscode.window.showQuickPick(api.projectUI, {placeHolder: 'Project ui', canPickMany: false});
                            if (ui){
                                let appId = await vscode.window.showInputBox ({prompt: 'Application id. If left blank a local id will be generated.'});
                                if (appId === undefined || appId.length === 0){
                                    appId = 'local.'+uuid.v4();
                                }
                                let params = {
                                    name: name,
                                    appId: appId,
                                    platform: platform,
                                    ui: ui,
                                    language: language
                                };

                                console.log (await api.project.init (workspace, params));
                            }
                        }
                    }
                }
                else{
                    vscode.window.showErrorMessage ('Cannot get settings from server.');
                }
            }
            api.project.init (workspace);
        }
        else{
            vscode.window.showErrorMessage ('Command required a workspace folder. Please select a folder and try again.');
        }
    });
});