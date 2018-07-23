import * as vscode from 'vscode';
const api = require ('../libwylio/calls');

class Profile {
    token: string;
    username: string;
    host: string;
    name: string;

    constructor (name: string, username: string, token: string, host: string){
        this.username = username;
        this.token = token;
        this.host = host;
        this.name = name;
    }
}

export class ProfileService {
    private static context: vscode.ExtensionContext;
    private static prefix = 'wylio_profile';
    private static currentProfile = 'wylio_current_profile';
    private static profiles = 'wylio_profiles';

    public static setContext (context: vscode.ExtensionContext){
        ProfileService.context = context;
    }

    public static getCurrentProfile (): Profile|undefined{
        let currentProfileName = ProfileService.context.globalState.get (ProfileService.currentProfile);
        if (currentProfileName){
            return ProfileService.context.globalState.get (ProfileService.prefix + currentProfileName, undefined);
        }
        else{
            return undefined;
        }
    }

    public static newProfile (name: string, username: string, token: string, host: string){
        let profile = new Profile (name, username, token, host);
        ProfileService.context.globalState.update (ProfileService.prefix + name, profile);
        let existingProfiles = ProfileService.getProfiles();
        console.log (existingProfiles);
        existingProfiles.push (name);
        ProfileService.context.globalState.update (ProfileService.profiles, existingProfiles);

    }

    public static exists (name: string){
        if  (ProfileService.context.globalState.get (ProfileService.prefix + name) !== undefined)
            return true;
        return false;
    }

    public static setActiveProfile (name: string){
        ProfileService.context.globalState.update (ProfileService.currentProfile, ProfileService.prefix + name);
    }

    public static getProfiles (): string[]{
        return ProfileService.context.globalState.get (ProfileService.profiles, []);
    }

    public static deleteProfile (name: string){
        ProfileService.context.globalState.update (ProfileService.prefix + name, null);
    }
}