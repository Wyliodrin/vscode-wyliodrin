import * as vscode from 'vscode';
import {ProfileService} from '../utils/profile';
let apiService = require ('../libwylio/calls');
let api = apiService.get();

vscode.commands.registerCommand ('wylio.login', async ()=>{
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
                            api = apiService.init (host);
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
            let selectedProfile = ProfileService.getProfile (selected);
            if (selectedProfile){
                if (selectedProfile.token.length === 0){
                    api = apiService.init (selectedProfile.host);
                    let password = await vscode.window.showInputBox ({prompt: 'Password', password: true});
                    if (password && password.length > 0){
                        let usersApi = api.users;
                        let params = {
                            username: selectedProfile.username,
                            password: password,
                            host: selectedProfile.host
                        };
                        let token = await usersApi.login (params);
                        if (token){
                            ProfileService.updateToken (selectedProfile, token);
                            ProfileService.setActiveProfile (selectedProfile.name);
                            vscode.window.showInformationMessage ('Logged in and selected profile.');
                        }
                        else{
                            vscode.window.showErrorMessage ('Could not login.');
                        }  
                    }
                }
                else{
                    api = apiService.init (selectedProfile.host, selectedProfile.token);
                    ProfileService.setActiveProfile (selected);
                    vscode.window.showInformationMessage ('Profile selected.');
                }
            }
            else{
                vscode.window.showErrorMessage ('Profile does not exist.');
            }
        }
    }
});

vscode.commands.registerCommand ('wylio.logout', async ()=>{
    if (api){
        let usersApi = api.users;
        let response = await usersApi.logout ();
        if (response){
            ProfileService.logout();
            vscode.window.showInformationMessage ('Logout successful.')
        }
        else
            vscode.window.showErrorMessage ('Could not logout');
    }
    else{
        vscode.window.showErrorMessage ('You are not logged in.');
    }
});

vscode.commands.registerCommand ('wylio.profile_delete', async ()=>{
    let existingProfiles: string[] = ProfileService.getProfiles ();
    let selected = await vscode.window.showQuickPick (existingProfiles, {canPickMany: false});
    if (selected){
        ProfileService.delete (selected);
        vscode.window.showInformationMessage ('Profile deleted successfully.');
    }
});