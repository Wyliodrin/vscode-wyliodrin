import * as vscode from 'vscode';
import {ProfileService} from '../utils/profile';
let api = require ('../libwylio/calls');

vscode.commands.registerCommand ('wylio.login', async ()=>{
    console.log ('login');
    let existingProfiles: string[] = ProfileService.getProfiles ();
    let display = [ 'Create new profile', ...existingProfiles];
    let selected = await vscode.window.showQuickPick (display, {canPickMany: false});
    if (selected){
        if (selected == 'Create new profile'){
            let username = await vscode.window.showInputBox ({prompt: 'Username'});
            if (username && username.length > 0)
            {
                let password = await vscode.window.showInputBox ({prompt: 'Password', password: true});
                if (password && password.length > 0){
                    let host = await vscode.window.showInputBox ({prompt: 'Host'});
                    if (host && host.length){
                        if (host.substring (0, 4) != 'http')
                            host = 'https://'+host;
                        let profile = await vscode.window.showInputBox ({prompt: 'Profile name.'});
                        if (profile)
                        {
                            profile = (profile.length > 0)? profile: 'default';
                            api = api.get ();
                            if (!api){
                                api = api.init (host);
                            }
                            let usersApi = api.users;
                            let params = {
                                username: username,
                                password: password,
                                host:host
                            };

                            let token = await usersApi.login (params);
                            if (token){
                                ProfileService.newProfile (profile, username, token, host);
                                ProfileService.setActiveProfile (profile);
                                vscode.window.showInformationMessage ('Logged in. Profile saved.');
                            }
                            else{
                                vscode.window.showErrorMessage ('Could not login.');
                            }  
                        }
                    }
                }
            }
        }
        else{
            ProfileService.setActiveProfile (selected);
        }
    }
});

vscode.commands.registerCommand ('wylio.logout', async ()=>{
    api = api.get();
    if (api){
        
    }
    let existingProfiles: string[] = ProfileService.getProfiles ();
    let selected = await vscode.window.showQuickPick (existingProfiles, {canPickMany: false});
    if (selected){

        let index = existingProfiles.indexOf (selected);
        existingProfiles.splice (index, 1);
        ProfileService.deleteProfile (selected);
    }
});