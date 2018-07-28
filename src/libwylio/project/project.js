const fs = require ('fs-extra');
const mustache = require ('mustache');
const path = require ('path');
module.exports = function (userApi, appApi, projectApi){
    return {
        init: async function (contentFolder, params){
            let contents = fs.readdirSync (contentFolder);
            if (contents.length === 0 || (contents.length === 1 && contents[0] === 'project.log')){
                let project;
                if (process.env.WYLIODRIN_PROJECT_ID){
                    console.log ('Using environment configurations');
                    let onlineProject = await projectApi.get (process.env.WYLIODRIN_PROJECT_ID);
                    if (onlineProject){
                        project = {
                            name: onlineProject.name,
                            appId: onlineProject.appId,
                            language: projectLanguages[onlineProject.language],
                            id: onlineProject.projectId,
                            platform: onlineProject.platform,
                            ui: onlineProject.ui
                        };
                    }
                    else{
                        return -1;
                    }
                }
                else{
                    let projectName = params.name;
                    let projectPlatform = params.platform;
                    let projectAppId = params.appId;
                    let projectUi = params.ui;
                    let projectLanguage = params.language;
                    project = {
                        name: projectName,
                        appId: projectAppId,
                        language:projectLanguage,
                        platform: projectPlatform,
                        ui: projectUi
                    };
                }
                        
                if (project.appId.substring (0, 5) !== 'local'){
                    let app = await appApi.get (project.appId);
                    if (!app){
                        return {
                            err: 1,
                            error: 'Please provide a valid application id'
                        }
                    }
                }
                //Generate project structure
                fs.writeFileSync (path.join(contentFolder, 'wylioproject.json'), JSON.stringify(project));
                console.log ('copied');
                console.log (__dirname);
                fs.copySync(path.normalize (__dirname + '/./project_templates/' + project.language), contentFolder);
                //Generate package.json for js projects
                if (project.language === 'nodejs'){
                    let user = await userApi.get();
                    if (user){
                        let package = fs.readFileSync (path.normalize (__dirname + '/./project_templates/package.json'), 'utf8');
                        let packageData = {
                            project: project,
                            user: user
                        }
                        package = mustache.render (package, packageData);
                        fs.writeFileSync (path.join(contentFolder, 'package.json'), package);
                    }
                    else{
                        return {
                            err: 1,
                            error: 'Cannot get user information from the server.'
                        }
                    }
                }
            }
            else{
                return {
                    err: 1,
                    error: 'Folder not empty. Please run command in an empty folder.'
                };
            }
        }
    };
}