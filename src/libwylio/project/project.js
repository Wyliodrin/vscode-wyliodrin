const fs = require ('fs-extra');
const mustache = require ('mustache');
const path = require ('path');
const semver = require ('semver');
const _ = require ('lodash');
const socketService = require ('../socket');

const projectLanguages = {
    js: 'nodejs',
    javascript: 'nodejs',
    nodejs: 'nodejs',
    py: 'python',
    python: 'python',
    e10: 'e10',
    msp432: 'msp432'
};

function build(projectSettings, settings, appId, version, cb){
    //Run make
    console.log ('make');
    let make = child_process.spawn ('make', {
        env: _.assign ({}, process.env, settings.PLATFORM[projectSettings.platform].options)
    });
    make.stdout.on ('data', (data)=>{
        process.stdout.write (data.toString());
    });
    make.stderr.on ('data', (data)=>{
        process.stderr.write (data.toString());
    })
    make.on ('exit', async (code)=>{
        if (code === 0){
            await projectApi.build (projectSettings.id);
        }
        if (code === 0 && settings.PLATFORM[projectSettings.platform].docker.platform !== 'none'){
            //Generate dockerfile
            let docker = fs.readFileSync (path.join (process.cwd(), 'dockerfile'), 'utf8');
            let dockerFile;
            if (docker.substring (0, 7) != '#MANUAL'){
                let libraries = fs.readFileSync (path.normalize (__dirname + '/../utils/docker/libraries/' + projectSettings.language), 'utf8');
                let dockerData = {
                    REPOSITORY: settings.REPOSITORY,
                    DEPLOYER_DOMAIN: settings.DEPLOYER,
                    project: projectSettings,
                    arm: (settings.PLATFORM[projectSettings.platform].docker.platform === 'arm')? true: false,
                    dockerfile: docker,
                    libraries: libraries
                }
                let dockerTemplate = fs.readFileSync (path.normalize (__dirname + '/../utils/docker/project_template'), 'utf8');
                dockerFile = mustache.render (dockerTemplate, dockerData);
            }
            else{
                dockerFile = docker;
            }
            let buildFolder = path.join(process.cwd(), 'build');
            fs.writeFileSync (path.join(buildFolder, 'dockerfile'), dockerFile);
            // Build docker image
            console.log ('Building docker image.');
            let dockerBuild = child_process.spawn ('docker', ['build', '-t', settings.REPOSITORY+'/'+appId+':'+version, '.'], {cwd: buildFolder});
            dockerBuild.stdout.on ('data', (data)=>{
                process.stdout.write (data.toString());
            });
            dockerBuild.stderr.on ('data', (data)=>{
                process.stderr.write (data.toString());
            });
            dockerBuild.on ('exit', (code)=>{
                cb (code);
            });
        }
        else{
            process.exit (code);
        }
    });
}

function searchSettings (myPath){
    let files = fs.readdirSync (myPath);
    if (files.indexOf('wylioproject.json') != -1)
        return fs.readFileSync (path.join (myPath, 'wylioproject.json'), 'utf8');
    else if (myPath === path.join (myPath, '..'))
        return null;
    else
        search (path.join (myPath, '..'));
}

async function getProjectSettings (sourceFolder){
    try{
        let tempProjectSettings = searchSettings (sourceFolder);
        tempProjectSettings = JSON.parse (tempProjectSettings);
        if (tempProjectSettings.id){
            projectSettings = await projectApi.get (tempProjectSettings.id);
            if (!projectSettings){
                projectSettings = tempProjectSettings;
            }
            else{
                fs.writeFileSync (path.join(process.cwd(), 'wylioproject.json'), JSON.stringify(projectSettings));
            }
        }
        else{
            projectSettings = tempProjectSettings;
        }
        return projectSettings;
    }
    catch (e){
        console.error (e.message)
        console.error ('Could not parse project settings file.');
        console.error ('Run wylio project init.');
        return null;
    }
}

module.exports = function (userApi, appApi, projectApi, settingsApi, productApi){
    async function checkVersion (appId, version){
        let versions = await appApi.versions (appId);
        if (versions && versions.length === 0){
            let max = Math.max (...versions);
            return version > max;
        }
        return false;
    }

    function dockerLogin (settings, profile, cb){
        let dockerLogin = child_process.spawn ('docker', ['login', settings.REPOSITORY, '-u', profile.username, '-p', profile.token]);
        dockerLogin.stdout.on ('data', (data)=>{
            process.stdout.write (data.toString());
        });
        dockerLogin.stderr.on ('data', (data)=>{
            process.stderr.write (data.toString());
        });
        dockerLogin.on ('exit', (code)=>{
            cb (code);
        });
    }
    async function publish (profile, settings, appId, version, semanticVersion, description, cb){
        if (settings.PLATFORM[projectSettings.platform].docker.platform !== 'none'){
            let buildFolder = path.join(process.cwd(), 'build');
            //Push docker image
            console.log ('Pushing docker image. Please wait.');
            let dockerPush = child_process.spawn ('docker', ['push', settings.REPOSITORY+'/'+appId+':'+version], {cwd: buildFolder});
    
            dockerPush.stdout.on ('data', (data)=>{
                process.stdout.write (data.toString());
            });
            dockerPush.stderr.on ('data', (data)=>{
                process.stderr.write (data.toString());
            });
            dockerPush.on ('exit', async (code)=>{
                if (semanticVersion === undefined){
                    let projectSettings = await getProjectSettings ();
                    if (projectSettings.language === 'nodejs'){
                        let packagePath = path.join(process.cwd(), 'package.json');
                        try{
                            let projectData = require (packagePath);
                            let projectVersion = projectData.version;
                            if (projectVersion)
                                semanticVersion = semver.valid (semver.coerce (projectVersion));
                        }
                        catch (e){
                            semanticVersion = undefined;
                        }
                    }
                }
                if (appApi){
                    await appApi.versions (appId);
                    await appApi.editVersion (appId, version, {
                        semver: semanticVersion,
                        text: description
                    });
                }
                else{
                    cb (-1);
                }
                cb (code);
            });
        }
        else cb(0);
    }

    async function publishDev (profile, settings, appId, version, cb){
        let buildFolder = path.join(process.cwd(), 'build');
        //Push docker image
    
        console.log ('Pushing docker image. Please wait.');
        let dockerPush = child_process.spawn ('docker', ['push', settings.REPOSITORY+'/'+appId+':'+version], {cwd: buildFolder});
    
        dockerPush.stdout.on ('data', (data)=>{
            process.stdout.write (data.toString());
        });
        dockerPush.stderr.on ('data', (data)=>{
            process.stderr.write (data.toString());
        });
        dockerPush.on ('exit', async (code)=>{
            cb (code);
        });
    }

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
                fs.copySync(path.normalize (__dirname + '/project_templates/' + project.language), contentFolder);
                //Generate package.json for js projects
                if (project.language === 'nodejs'){
                    let user = await userApi.get();
                    if (user){
                        let package = fs.readFileSync (path.normalize (__dirname + '/project_templates/package.json'), 'utf8');
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
        },

        build: async function (profile, version, workspace){
            let projectSettings = await getProjectSettings(workspace);
            if (projectSettings){
                if (!version){
                    version = 'dev';
                }
                else if (projectSettings.appId.substring (0, 5) !== 'local' && !await checkVersion (projectSettings.appId, version)){
                    console.log ('The provided version is less or equal to the latest published version.');
                    console.log ('The Docker image will be created but it cannot be published.');
                }
                let settings = await settingsApi.get ();
                if (settings){
                    if (settings.PLATFORM[projectSettings.platform].docker.platform === 'none'){
                        build (projectSettings, settings, projectSettings.appId, version, (code)=>{
                            //Docker logout
                            child_process.spawn ('docker', ['logout', settings.REPOSITORY]);
                            return {
                                err: code,
                            }
                        });
                    }
                    else{
                        //Run docker login
                        dockerLogin (settings, profile, (code)=>{
                            if (code === 0){
                                build (projectSettings, settings, projectSettings.appId, version, (code)=>{
                                    //Docker logout
                                    child_process.spawn ('docker', ['logout', settings.REPOSITORY]);
                                    return {
                                        err: code,
                                        error: 'Could not run docker build'
                                    };
                                });
                            }
                            else{
                                return {
                                    err: code,
                                    error: 'Could not run docker login'
                                };
                            }
                        });
                        }
                }
                else{
                    return {
                        err: 1,
                        error: 'Could not get account settings.'
                    };
                }
            } 
            else{
                return {
                    err: 1,
                    error: 'Could not find project settings. Run init.'
                }
            }
        },

        publish: async function (profile, version, description, semanticVersion, workspace){
            let projectSettings = await getProjectSettings(workspace);
            if (projectSettings){
                if (!await checkVersion (projectSettings.appId, version)){
                    return {
                        err: 1,
                        error: 'The provided version is less or equal to the latest published version. Cannot publish docker image.'
                    }
                }
                let settings = await settingsApi.get ();
                if (settings){
                    let appId = projectSettings.appId;
                    if (appId.substring (0, 5) === 'local'){
                        return {
                            err: 1,
                            error: 'This project has no application assigned.'
                        }
                    }
                    app = await appApi.get (appId);
                    if (!app){
                        return {
                            err: 1,
                            error: 'Application not found. Please provide an existing application id.'
                        }
                    }
                    dockerLogin (settings, profile, async (code)=>{
                        if (code === 0){
                            await publish (profile, settings, projectSettings.appId, version, semanticVersion, description, (code)=>{
                                //Docker logout
                                child_process.spawn ('docker', ['logout', settings.REPOSITORY]);
                                return {
                                    err: code
                                };
                            });

                        }
                        else{
                            return {
                                err: code
                            };
                        }
                    });
                }
                else{
                    return {
                        err: 1,
                        error: 'Could not get server settings.'
                    }
                }
            }
            else{
                return {
                    err: 1,
                    error: 'Could not find project settings. Run init.'
                }
            }
        },

        run: async function (productId, profile, workspace){
            if (productApi){
                let product = await productApi.get (productId);
                if (product){
                    if (product.type === 'development'){
                        if (product.status === 'offline'){
                            console.error ('Device might be offline.');
                        }
                        
                        let projectSettings = await getProjectSettings(workspace);
                        let appId = projectSettings.appId;
                        if (appId.substring (0, 5) !== 'local'){
                            app = await appApi.get (appId);
                            if (!app){
                                return {
                                    err: 1,
                                    error: 'Invalid application id. Please provide an existing application id.'
                                };
                            }
                        }
                        let settings = await settingsApi.get ();
                        if (settings){
                            if (settings.PLATFORM[projectSettings.platform].docker.platform === 'none'){
                                build (projectSettings, settings, appId, 'dev', async (code)=>{
                                    if (code === 0){
                                        await publishDev (profile, settings, appId, 'dev', (code)=>{
                                            if (code === 0){
                                                console.log ('Pinging device...');
                                                let online = false;
                                                let timer = setTimeout (function (){
                                                    if (!online){
                                                        console.error ('Ping timeout. Device offline.');
                                                        process.exit (-1);
                                                    }
                                                }, 10000);
                                                socketService.connect (profile.api, profile.token, ()=>{
                                                    socketService.send ('packet', productId, {
                                                        t: 'r',
                                                        d:{
                                                            a: 'p',
                                                            id: appId
                                                        }
                                                    });
                                                }, async (data)=>{
                                                    if (data.t === 'r' && data.d.id === appId){
                                                        if (data.d.a === 'e'){
                                                            if (data.d.e === 'norun'){
                                                                //TODO
                                                            }
                                                        }
                                                        else if (data.d.a === 'k'){
                                                            process.stdout.write (data.d.t);
                                                        }
                                                        else if (data.d.a === 's'){
                                                            process.exit (0);
                                                        }
                                                        else if (data.d.a === 'p'){
                                                            online = true;
                                                            clearTimeout(timer);
                                                            socketService.send ('packet', productId, {
                                                                t: 'r',
                                                                d: {
                                                                    id: appId,
                                                                    a: 'e',
                                                                    priv: app.privileged,
                                                                    net: app.network,
                                                                    p: app.parameters,
                                                                    c: process.stdout.columns,
                                                                    r: process.stdout.rows
                                                                }
                                                            });
                                                            console.log ('Press Ctrl+q to exit the application.');
                                                            console.log ('Press Ctrl+r to reload application.');
                                                            process.stdin.setRawMode (true);
                                                            process.stdin.setEncoding( 'utf8' );
                                                            readline.emitKeypressEvents(process.stdin);
                                                            process.stdin.on('keypress', async (str, key) => {
                                                                if (key.ctrl && key.name === 'q'){
                                                                    socketService.send ('packet', productId, {
                                                                        t: 'r',
                                                                        d: {
                                                                            id: appId,
                                                                            a:'s'
                                                                        }
                                                                    });
                                                                    console.log ('');
                                                                    console.log ('Disconnected');
                                                                    process.exit (0);
                                                                }
                                                                else if (key.ctrl && key.name === 'r'){
                                                                    let app = await appApi.get (appId);
                                                                    if (app){
                                                                        socketService.send ('packet', productId, {
                                                                            t: 'r',
                                                                            d: {
                                                                                id: appId,
                                                                                a: 'e',
                                                                                priv: app.privileged,
                                                                                net: app.network,
                                                                                p: app.parameters,
                                                                                c: process.stdout.columns,
                                                                                r: process.stdout.rows
                                                                            }
                                                                        });
                                                                    }
                                                                    else{
                                                                        console.error ('Application not found.');
                                                                    }
                                                                }
                                                                else{
                                                                    socketService.send ('packet', productId, {
                                                                        t: 'r',
                                                                        d: {
                                                                            id: appId,
                                                                            a:'k',
                                                                            t:str
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                            process.stdout.on('resize', function() {
                                                                socketService.send ('packet', productId, {
                                                                    t: 'r',
                                                                    d: {
                                                                        id: appId,
                                                                        a: 'r',
                                                                        c: process.stdout.columns,
                                                                        r: process.stdout.rows
                                                                    }
                                                                });
                                                            }); 
                                                        }
                                                    }
                                                });
                                            }
                                            else{
                                                process.exit (code);
                                            }
                                        });
                                    }
                                    else{
                                        process.exit (code);
                                    }
                                });
                            }
                            else{
                                dockerLogin (settings, profile, (code)=>{
                                    if (code === 0){
                                        build (projectSettings, settings, appId, 'dev', async (code)=>{
                                            if (code === 0){
                                                await publishDev (profile, settings, appId, 'dev', (code)=>{
                                                    if (code === 0){
                                                        console.log ('Pinging device...');
                                                        let online = false;
                                                        let timer = setTimeout (function (){
                                                            if (!online){
                                                                console.error ('Ping timeout. Device offline.');
                                                                process.exit (-1);
                                                            }
                                                        }, 10000);
                                                        socketService.connect (profile.api, profile.token, ()=>{
                                                            socketService.send ('packet', productId, {
                                                                t: 'r',
                                                                d:{
                                                                    a: 'p',
                                                                    id: appId
                                                                }
                                                            });
                                                        }, async (data)=>{
                                                            if (data.t === 'r' && data.d.id === appId){
                                                                if (data.d.a === 'e'){
                                                                    if (data.d.e === 'norun'){
                                                                        //TODO
                                                                    }
                                                                }
                                                                else if (data.d.a === 'k'){
                                                                    process.stdout.write (data.d.t);
                                                                }
                                                                else if (data.d.a === 's'){
                                                                    process.exit (0);
                                                                }
                                                                else if (data.d.a === 'p'){
                                                                    online = true;
                                                                    clearTimeout(timer);
                                                                    socketService.send ('packet', productId, {
                                                                        t: 'r',
                                                                        d: {
                                                                            id: appId,
                                                                            a: 'e',
                                                                            priv: app.privileged,
                                                                            net: app.network,
                                                                            p: app.parameters,
                                                                            c: process.stdout.columns,
                                                                            r: process.stdout.rows
                                                                        }
                                                                    });
                                                                    console.log ('Press Ctrl+q to exit the application.');
                                                                    console.log ('Press Ctrl+r to reload application.');
                                                                    process.stdin.setRawMode (true);
                                                                    process.stdin.setEncoding( 'utf8' );
                                                                    readline.emitKeypressEvents(process.stdin);
                                                                    process.stdin.on('keypress', async (str, key) => {
                                                                        if (key.ctrl && key.name === 'q'){
                                                                            socketService.send ('packet', productId, {
                                                                                t: 'r',
                                                                                d: {
                                                                                    id: appId,
                                                                                    a:'s'
                                                                                }
                                                                            });
                                                                            console.log ('');
                                                                            console.log ('Disconnected');
                                                                            process.exit (0);
                                                                        }
                                                                        else if (key.ctrl && key.name === 'r'){
                                                                            let app = await appApi.get (appId);
                                                                            if (app){
                                                                                socketService.send ('packet', productId, {
                                                                                    t: 'r',
                                                                                    d: {
                                                                                        id: appId,
                                                                                        a: 'e',
                                                                                        priv: app.privileged,
                                                                                        net: app.network,
                                                                                        p: app.parameters,
                                                                                        c: process.stdout.columns,
                                                                                        r: process.stdout.rows
                                                                                    }
                                                                                });
                                                                            }
                                                                            else{
                                                                                console.error ('Application not found.');
                                                                            }
                                                                        }
                                                                        else{
                                                                            socketService.send ('packet', productId, {
                                                                                t: 'r',
                                                                                d: {
                                                                                    id: appId,
                                                                                    a:'k',
                                                                                    t:str
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                    process.stdout.on('resize', function() {
                                                                        socketService.send ('packet', productId, {
                                                                            t: 'r',
                                                                            d: {
                                                                                id: appId,
                                                                                a: 'r',
                                                                                c: process.stdout.columns,
                                                                                r: process.stdout.rows
                                                                            }
                                                                        });
                                                                    }); 
                                                                }
                                                            }
                                                        });
                                                    }
                                                    else{
                                                        return {
                                                            err: code
                                                        };
                                                    }
                                                });
                                            }
                                            else{
                                                return {
                                                    err: code
                                                };
                                            }
                                        });
                                    }
                                    else{
                                        return {
                                            err: code
                                        };
                                    }
                                });
                            }
                        }
                        else{
                            return {
                                err: 1,
                                error: 'Could not get account settings.'
                            };
                        }
                    }
                    else{
                        return {
                            err: 1,
                            error: 'The provided product is not in development mode.'
                        };
                    }
                }
                else{
                    return {
                        err: 1,
                        error: 'Invalid product id'
                    };
                }
            }
            else{
                return {
                    err: 1,
                    error: 'No credentials. Please login or select a profile.'
                };
            }
        }
    }
}