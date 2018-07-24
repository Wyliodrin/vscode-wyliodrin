let calls = require ('../libwylio/calls');
import * as vscode from 'vscode';
export class Libwylio {
    public static get(cb: (_:any)=>void){
        if (calls.get()){
            cb (calls.get());
        }
        else{
            vscode.window.showErrorMessage ('No profile selected. Log in or select a profile.');
        }
    }
}