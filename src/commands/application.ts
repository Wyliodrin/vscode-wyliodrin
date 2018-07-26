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

vscode.commands.registerCommand ('wylio.application_deploy', async ()=>{
    async function addParameter (params: any){
        let add = await vscode.window.showQuickPick (['add parameter', 'finish'], {canPickMany: false});
        if (add && add === 'add parameter'){
            let parameterName = await vscode.window.showInputBox ({prompt: 'Name of the parameter used to start the application container'});
            if (parameterName && parameterName.length > 0){
                let parameterValue = await vscode.window.showInputBox ({prompt: 'Parameter values, Separated by ;'});
                if (parameterValue){
                    params[parameterName] = parameterValue.split (';');
                }
            }
            await addParameter(params);
        }
    }
    Libwylio.get (async (api)=>{
        let apps = await api.apps.list();
        if (apps){
            let appList = _.map (apps, 'appId');
            let id = await vscode.window.showQuickPick (appList, {canPickMany: false});
            if (id){
                let clusters = await api.clusters.list ();
                if (clusters){
                    let clusterList: vscode.QuickPickItem[] = _.map (clusters, (c: any)=> {
                        return {
                            label: c.name,
                            description: c.clusterId}
                    });
                    let cluster = await vscode.window.showQuickPick (clusterList, {canPickMany: false});
                    if (cluster){
                        let clusterId = cluster.description;
                        let type = await vscode.window.showQuickPick (api.deploymentTypes, {canPickMany: false});
                        if (type){
                            let version = await vscode.window.showInputBox ({prompt: 'Application version', value: '1'});
                            if (version){
                                let rollback = await vscode.window.showInputBox ({prompt: 'Rollback versions', value: '0'});
                                if (rollback){
                                    let network = await vscode.window.showQuickPick (api.deploymentNetwork, {canPickMany: false});
                                    if (network){
                                        let privileged = await vscode.window.showQuickPick (['yes', 'no'], {placeHolder: 'Run as privileged application?',canPickMany: false});
                                        if (privileged){
                                            let parameters = {};
                                            await addParameter(parameters);
                                            let params = {
                                                appId: id,
                                                clusterId: clusterId,
                                                version: version,
                                                network: network,
                                                rollback: (rollback === '0')? null: rollback,
                                                privileged: (privileged === 'yes')? true: false,
                                                type: type,
                                                parameters: parameters
                                            };
                                            let response = api.apps.deploy (params);
                                            if (response)
                                                vscode.window.showInformationMessage ('Application deployed successfully.');
                                            else
                                                vscode.window.showErrorMessage ('Could not deploy application');
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
});

vscode.commands.registerCommand ('wylio.application_undeploy', async ()=>{
    Libwylio.get (async (api)=>{
        let apps = await api.apps.list();
        if (apps){
            let appList = _.map (apps, 'appId');
            let id = await vscode.window.showQuickPick (appList, {canPickMany: false});
            if (id){
                let deployments = await api.deploy.list (id);
                if (deployments){
                    let deployList: vscode.QuickPickItem[] = _.map (deployments, (d: any)=> {
                        return {
                            label: d.appId + ':' + d.type + ':' + d.version,
                            detail: d.target + ':' + d.id,
                            description: d.deployId
                        };
                    });
                    let deploy = await vscode.window.showQuickPick (deployList, {canPickMany: false});
                    if (deploy){
                        let deployId = deploy.description;
                        let response = api.apps.undeploy (deployId);
                        if (response)
                            vscode.window.showInformationMessage ('Application undeployed successfully.');
                        else
                            vscode.window.showErrorMessage ('Could not undeploy application');
                    }
                }
            }
        }
    });
});

// vscode.commands.registerCommand ('wylio.application_version_update', async ()=>{
//     Libwylio.get (async (api)=>{
//         let apps = await api.apps.list();
//         if (apps){
//             let appList = _.map (apps, 'appId');
//             let id = await vscode.window.showQuickPick (appList, {canPickMany: false});
//             if (id){
//                 let versions = await api.apps.versions (id);
//                 if (versions){
//                     console.log (versions);
//                 }
//             }
//         }
//     });
// });