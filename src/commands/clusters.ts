import * as vscode from 'vscode';
import {Libwylio} from '../utils/libwylio';
const _ = require ('lodash');

vscode.commands.registerCommand ('wylio.cluster_new', async ()=>{
    async function addProductId (params: any){
        let add = await vscode.window.showQuickPick (['Add productId', 'Finish'], {canPickMany: false});
        if (add && add === 'add productId'){
            let productId = await vscode.window.showInputBox ({prompt: 'Product Id'});
            if (productId && productId.length > 0){
                params.push (productId);
            }
            await addProductId(params);
        }
    }
    Libwylio.get (async (api)=>{
        let name = await vscode.window.showInputBox ({prompt: 'Cluster name'});
        if (name && name.length > 0){
            let settings = await api.settings.get();
            if (settings){
                let platforms = Object.keys (settings.PLATFORM);
                let platform = await vscode.window.showQuickPick(platforms, {placeHolder: 'Products platform', canPickMany: false});
                if (platform){
                    let deployerVersions = await api.apps.deployerVersions (platform);
                    if (deployerVersions){
                        let deployerVersion = await vscode.window.showQuickPick(deployerVersions, {placeHolder: 'Deployer version', canPickMany: false});
                        if (deployerVersion){
                            let openRegister = await vscode.window.showQuickPick(['yes', 'no'], {placeHolder: 'Open register all products', canPickMany: false});
                            if (openRegister){
                                let productIds: string[] = [];
                                await addProductId (productIds);
                                let registerFilter = false;
                                if (productIds.length > 0)
                                    registerFilter = true;
                                let params = {
                                    name: name,
                                    openRegister: openRegister,
                                    platform: platform,
                                    deployer: deployerVersion,
                                    filterRegister: registerFilter,
                                    filterRegisterProducts: productIds,
                                    authKey: false
                                }
                                let response = api.clusters.new (params);
                                if (response)
                                    vscode.window.showInformationMessage ('Cluster created successfully.');
                                else
                                    vscode.window.showErrorMessage ('Could not create cluster.');
                            }
                        }
                    }
                    else{
                        vscode.window.showErrorMessage ('Could not get data from server.');
                    }
                }
            }
            else{
                vscode.window.showErrorMessage ('Could not get server settings.');
            }
        }
    });
});

vscode.commands.registerCommand ('wylio.cluster_list', async ()=>{
    Libwylio.get (async (api)=>{
        let clusters = await api.clusters.list();
        if (clusters){
            let clusterList: vscode.QuickPickItem[] = _.map (clusters, (c: any)=>{
                return {
                    label: c.name,
                    description: c.clusterId
                }
            });
            let selectedCluster = await vscode.window.showQuickPick (clusterList, {canPickMany: false});
            if (selectedCluster){
                let sc = selectedCluster;
                let clusterInfo = _.find (clusters, (c: any)=>{
                    return c.clusterId === sc.description;
                });
                vscode.window.showInformationMessage(JSON.stringify(clusterInfo, null, 3));
            }
        }
    });
});

vscode.commands.registerCommand ('wylio.cluster_delete', async ()=>{
    Libwylio.get (async (api)=>{
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
                let ok = await vscode.window.showQuickPick (['yes', 'no'], {placeHolder: 'Are you sure you wish to delete '+cluster.label+' ?',canPickMany: false});
                if (ok && ok === 'yes'){
                    let result = await api.clusters.delete (cluster.description);
                    if (result){
                        vscode.window.showInformationMessage ('Cluster successfully deleted.');
                    }
                    else{
                        vscode.window.showErrorMessage ('Could not delete cluster.');
                    }
                }
            }
        }
    });
});
