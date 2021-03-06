let calls = null;

function logout (){
    calls = null;
}
module.exports.init = function (endpoint, token){
    endpoint = endpoint + '/api/v1';
    let httpService = require ('./api-calls/http')(endpoint);
    let users = require ('./api-calls/users')(httpService, logout);
    let clusters = require ('./api-calls/clusters')(httpService.http);
    let products = require ('./api-calls/products')(httpService.http);
    let apps = require ('./api-calls/applications')(httpService.http);
    let deploy = require ('./api-calls/deploy')(httpService.http);
    let settings = require ('./api-calls/settings')(httpService.http);
    let projectApi = require ('./api-calls/settings')(httpService.http);
    let projects = require ('./project/project')(users, apps, projectApi, settings, products);
    //EXISTA DACA E NEVOIE let projects = require ('./api-calls/projects')(httpService.http);
    if (token){
        httpService.setToken (token);
    }
    calls =  {
        users: users,
        clusters: clusters,
        products: products,
        apps: apps,
        deploy: deploy,
        settings: settings,
        deploymentTypes: ['beta', 'production', 'development'],
        deploymentNetwork: ['default', 'host'],
        project: projects,
        firmwarePlatforms: ['e10', 'msp432'],
        languages: ['nodejs', 'python'],
        projectUI: ['noui', 'Xorg', 'electron']
    };
    return calls;
}

module.exports.get = function (){
    return calls;
}