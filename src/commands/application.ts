import * as vscode from 'vscode';
import {Libwylio} from '../utils/libwylio';
let _ = require ('lodash');
vscode.commands.registerCommand ('wylio.application_new', async ()=>{
    Libwylio.get (async (api)=>{
        let id = await vscode.window.showInputBox ({prompt: 'Application id', placeHolder: 'com.domain.application'});
        if (id && id.length > 0){
            let name = await vscode.window.showInputBox ({prompt: 'Application name'});
            if (name && name.length > 0){
                let author = await vscode.window.showInputBox ({prompt: 'Application author'});
                if (author && author.length > 0){
                    let settings = await api.settings.get();
                    if (settings){
                        let platforms = Object.keys (settings.PLATFORM);
                        let platform = await vscode.window.showQuickPick(platforms, {placeHolder: 'Application platform', canPickMany: false});
                        if (platform){
                            let privileged = await vscode.window.showQuickPick(['Yes', 'No'], {placeHolder: 'Run as a privileged application', canPickMany: false});
                            if (privileged){
                                let params = {
                                    appId: id,
                                    author: author,
                                    platform: platform,
                                    privileged: privileged,
                                    name: name
                                };
                                let response = await api.apps.new (params);
                                if (response)
                                    vscode.window.showInformationMessage ('Application created successfully.');
                                else
                                    vscode.window.showInformationMessage ('Could not create application.');
                            }
                        }
                    }
                    else{
                        vscode.window.showErrorMessage ('Could not get general settings. Server error.');
                    }
                }
            }
        }
    });
});

vscode.commands.registerCommand ('wylio.application_list', async ()=>{
    Libwylio.get (async (api)=>{
        let apps = await api.apps.list();
        if (apps){
            let appList = _.map (apps, 'appId');
            let id = await vscode.window.showQuickPick (appList, {canPickMany: false});
            if (id){
                let application = _.find (apps, (app: any)=>{
                    return app.appId === id;
                });
                vscode.window.showInformationMessage(JSON.stringify(application, null, 3));
            }
        }
    });
});

vscode.commands.registerCommand ('wylio.application_delete', async ()=>{
    Libwylio.get (async (api)=>{
        let apps = await api.apps.list();
        if (apps){
            let appList = _.map (apps, 'appId');
            let id = await vscode.window.showQuickPick (appList, {canPickMany: false});
            if (id){
                let ok = await vscode.window.showQuickPick (['yes', 'no'], {placeHolder: 'Are you sure you wish to delete '+id+' ?',canPickMany: false});
                if (ok && ok === 'yes'){
                    let result = await api.apps.delete (id);
                    if (result){
                        vscode.window.showInformationMessage ('Application successfully deleted.');
                    }
                    else{
                        vscode.window.showErrorMessage ('Could not delete application.');
                    }
                }
            }
        }
    });
});

vscode.commands.registerCommand ('wylio.application_versions', async ()=>{
    Libwylio.get (async (api)=>{
        let apps = await api.apps.list();
        if (apps){
            let appList = _.map (apps, 'appId');
            let id = await vscode.window.showQuickPick (appList, {canPickMany: false});
            if (id){
                let versions = await api.apps.versions (id);
                if (versions){
                    let placeholder = '';
                    if (versions.length == 0)
                        placeholder = 'No versions';
                    vscode.window.showQuickPick (versions, {placeHolder: placeholder});
                }
                else{
                    vscode.window.showErrorMessage ('Could not get versions.');
                }
            }
        }
    });
});