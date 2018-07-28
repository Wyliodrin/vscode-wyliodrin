import * as vscode from 'vscode';
import {Libwylio} from '../utils/libwylio';
const _ = require ('lodash');

vscode.commands.registerCommand ('wylio.product_provision', async ()=>{
    Libwylio.get (async (api)=>{
        let name = await vscode.window.showInputBox ({prompt: 'Product name'});
        if (name && name.length > 0){
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
                    let settings = await api.settings.get();
                    if (settings){
                        let platforms = Object.keys (settings.PLATFORM);
                        let platform = await vscode.window.showQuickPick(platforms, {placeHolder: 'Products platform', canPickMany: false});
                        if (platform){
                            let type = await vscode.window.showQuickPick (api.deploymentTypes, {placeHolder: 'Deployment type',canPickMany: false});
                            if (type){
                                let productId = await vscode.window.showInputBox ({prompt: 'Product id, automatically generated if left blank.'});
                                if (productId && productId.length === 0)
                                    productId = undefined;
                                let shell = await vscode.window.showQuickPick (['yes', 'no'], {placeHolder: 'Allow shell?',canPickMany: false});
                                if (shell){
                                    let serial = await vscode.window.showInputBox ({prompt: 'Product serial', value: ''});
                                    if (serial){
                                        if (serial.length === 0)
                                            serial = undefined;
                                    }
                                    let latitude = await vscode.window.showInputBox ({prompt: 'Product latitude'});
                                    let longitude = await vscode.window.showInputBox ({prompt: 'Product longitude'});
                                    let altitude = await vscode.window.showInputBox ({prompt: 'Product altitude'});
                                    let params = {
                                        clusterId: clusterId,
                                        type: type,
                                        shell: (shell === 'yes')? true: false,
                                        name: name,
                                        platform: platform,
                                        serial: serial,
                                        location: {}
                                    };
                                    if (altitude || longitude || latitude){
                                        params.location = {
                                            lon: longitude,
                                            lat: latitude,
                                            alt: altitude
                                        }
                                    }
                                    else{
                                        delete params.location;
                                    }
                                    let result = await api.products.provision (params);
                                    if (result){
                                        vscode.window.showInformationMessage ('Product provisioned.');
                                    }
                                    else{
                                        vscode.window.showErrorMessage ('Could not provision product.');
                                    }
                                }
                            }
                        }
                    }
                    else{
                        vscode.window.showErrorMessage ('Cannot get server settings.');
                    }
                }
            }
        }
    });
});

vscode.commands.registerCommand ('wylio.product_list', async ()=>{
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
                        let prod = product;
                        let productInfo = _.find (products, (p: any)=>{
                            return p.productId === prod.description;
                        });
                        vscode.window.showInformationMessage(JSON.stringify(productInfo, null, 3));
                    }
                }
            }
        }
    });
});

vscode.commands.registerCommand ('wylio.product_delete', async ()=>{
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
                        let response = await api.products.delete (product.description);
                        if (response)
                            vscode.window.showInformationMessage ('Product deleted successfully.');
                        else
                            vscode.window.showErrorMessage ('Could not delete product.');
                    }
                }
            }
        }
    });
});

vscode.commands.registerCommand ('wylio.product_activate', async ()=>{
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
                        let value = await vscode.window.showQuickPick (['yes', 'no'], {placeHolder: 'Allow product to connect?', canPickMany: false});
                        if (value){
                            let params = {
                                productId: product.description,
                                value: (value === 'yes')? true: false
                            }
                            let response = await api.products.activate (params);
                            if (response)
                                vscode.window.showInformationMessage ('Product deleted successfully.');
                            else
                                vscode.window.showErrorMessage ('Could not delete product.');
                        }
                    }
                }
            }
        }
    });
});

vscode.commands.registerCommand ('wylio.product_schedule', async ()=>{
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
                        let action = await vscode.window.showQuickPick (api.products.actions, {placeHolder: 'Choose action', canPickMany: false});
                        if (action){
                            let params = {
                                productId: product.description,
                                action: action
                            }
                            let response = await api.products.schedule (params);
                            if (response)
                                vscode.window.showInformationMessage ('Action scheduled successfully.');
                            else
                                vscode.window.showErrorMessage ('Could not schedule action.'); 
                        }
                    }
                }
            }
        }
    });
});

vscode.commands.registerCommand ('wylio.product_unschedule', async ()=>{
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
                        let action = await vscode.window.showQuickPick (api.products.actions, {placeHolder: 'Choose action', canPickMany: false});
                        if (action){
                            let params = {
                                productId: product.description,
                                action: action
                            }
                            let response = await api.products.unschedule (params);
                            if (response)
                                vscode.window.showInformationMessage ('Action unscheduled successfully.');
                            else
                                vscode.window.showErrorMessage ('Could not unschedule action.'); 
                        }
                    }
                }
            }
        }
    });
});