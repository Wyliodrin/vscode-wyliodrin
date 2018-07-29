import * as vscode from 'vscode';
import {Libwylio} from '../utils/libwylio';
import { ProfileService } from '../utils/profile';
const uuid = require ('uuid');
const _ = require ('lodash');
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
            let name = await vscode.window.showInputBox ({prompt: 'Project name.'});
            if (name && name.length > 0){
                let settings = await api.settings.get();
                if (settings){
                    let platforms = Object.keys (settings.PLATFORM);
                    let platform = await vscode.window.showQuickPick(platforms, {placeHolder: 'Project platform', canPickMany: false});
                    if (platform){
                        let language;
                        api.firmarePlatforms
                        if (api.firmwarePlatforms.indexOf (platform) === -1){
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
                                await api.project.init (workspace, params);
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

vscode.commands.registerCommand ('wylio.project_build', async ()=>{
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
            let currentProfile = ProfileService.getCurrentProfile();
            if (currentProfile){
                let version = await vscode.window.showInputBox ({prompt: 'Build version. If left blank, version will be dev.'});
                let result = await api.project.build (currentProfile, version, workspace);
                console.log (result);
            }
            else{
                vscode.window.showErrorMessage ('No profile selected. Select profile or log in and try again.');
            }
        }
        else{
            vscode.window.showErrorMessage ('Command required a workspace folder. Please select a folder and try again.');
        }
    });
});

vscode.commands.registerCommand ('wylio.project_publish', async ()=>{
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
            let currentProfile = ProfileService.getCurrentProfile();
            if (currentProfile){
                let version = await vscode.window.showInputBox ({prompt: 'Application version.'});
            if (version && version.length > 0){
                let semanticVersion = await vscode.window.showInputBox ({prompt: 'Semantic application version.'});
                if (semanticVersion && semanticVersion.length > 0){
                    let description = await vscode.window.showInputBox ({prompt: 'Description of the new published version.'});
                    if (description && description.length > 0){
                        let result = await api.project.publish (currentProfile, version, description, semanticVersion, workspace);
                        console.log (result);
                    }
                }
            }
            }
            else{
                vscode.window.showErrorMessage ('No profile selected. Select profile or log in and try again.');
            }
        }
        else{
            vscode.window.showErrorMessage ('Command required a workspace folder. Please select a folder and try again.');
        }
    });
});

vscode.commands.registerCommand ('wylio.project_run', async ()=>{
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
            let currentProfile = ProfileService.getCurrentProfile();
            if (currentProfile){
                let clusters = await api.clusters.list();
                if (clusters){
                    let clusterList: vscode.QuickPickItem[] = _.map (clusters, (c: any)=>{
                        return {
                            label: c.name,
                            description: c.clusterId
                        }
                    });
                    let cluster = await vscode.window.showQuickPick (clusterList, {canPickMany: false});
                    if (cluster){
                        let clusterId = cluster.description;
                        let products = await api.products.list (clusterId);
                        if (products){
                            let productList: vscode.QuickPickItem[] = _.map (products, (p:any)=>{
                                return {
                                    label: p.name,
                                    detail: p.clusterId+':'+p.platform+':'+p.type,
                                    description: p.productId
                                };
                            });
                            let product = await vscode.window.showQuickPick (productList, {canPickMany: false});
                            if (product){
                                let result = await api.project.run (product.description, currentProfile, workspace);
                                console.log (result);
                            }
                        }
                    }
                }
            }
            else{
                vscode.window.showErrorMessage ('No profile selected. Select profile or log in and try again.');
            }
        }
        else{
            vscode.window.showErrorMessage ('Command required a workspace folder. Please select a folder and try again.');
        }
    });
});

