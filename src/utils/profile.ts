import * as vscode from 'vscode';


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
    private static prefix = 'wylio_profile_';
    private static currentProfile = 'wylio_current_profile';
    private static profiles = 'wylio_profiles';

    public static setContext (context: vscode.ExtensionContext){
        ProfileService.context = context;
    }

    public static getCurrentProfile (): Profile|undefined{
        let currentProfileName: string|undefined = ProfileService.context.globalState.get (ProfileService.currentProfile);
        if (currentProfileName && currentProfileName.length > 0){
            return ProfileService.context.globalState.get (currentProfileName, undefined);
        }
        else{
            return undefined;
        }
    }

    public static newProfile (name: string, username: string, token: string, host: string){
        let profile = new Profile (name, username, token, host);
        ProfileService.context.globalState.update (ProfileService.prefix + name, profile);
        let existingProfiles = ProfileService.getProfiles();
        existingProfiles.push (name);
        ProfileService.context.globalState.update (ProfileService.profiles, existingProfiles);

    }

    public static updateToken (profile: Profile, token: string){
        profile.token = token;
        ProfileService.context.globalState.update (ProfileService.prefix + profile.name, profile);
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

    public static getProfile (name: string): Profile | undefined{
        // let profile: Profile | undefined = ProfileService.context.globalState.get (ProfileService.prefix + name);
        // if (profile){
        //     return new Profile (profile.name, profile.username, profile.token, profile.host);
        // }
        // return undefined;
        return ProfileService.context.globalState.get (ProfileService.prefix + name);
    }

    public static logout (){
        let currentProfile = ProfileService.getCurrentProfile ();
        if (currentProfile){
            currentProfile.token = "";
            ProfileService.context.globalState.update (ProfileService.prefix + currentProfile.name, currentProfile);
            ProfileService.context.globalState.update (ProfileService.currentProfile, "");
        }
    }

    public static delete (profileName: string){
        let currentProfile = ProfileService.getCurrentProfile ();
        if (currentProfile &&  currentProfile.name === profileName){
            ProfileService.context.globalState.update (ProfileService.currentProfile, "");
        }
        ProfileService.context.globalState.update (ProfileService.prefix + profileName, undefined);
        let profiles: string[] | undefined = ProfileService.context.globalState.get (ProfileService.profiles);
        if (profiles){
            let index = profiles.indexOf (profileName);
            profiles.splice (index, 1);
            ProfileService.context.globalState.update (ProfileService.profiles, profiles);
        }
    }
}