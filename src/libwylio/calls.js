let calls = null;

function logout (){
    calls = null;
}
module.exports.init = function (endpoint, token){
    endpoint = endpoint + '/api/v1';
    let httpService = require ('./http')(endpoint);
    let users = require ('./users')(httpService, logout);
    let clusters = require ('./clusters')(httpService.http);
    let products = require ('./products')(httpService.http);
    let apps = require ('./applications')(httpService.http);
    let deploy = require ('./deploy')(httpService.http);
    let settings = require ('./settings')(httpService.http);
    let projects = require ('./projects')(httpService.http);
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
        projects: projects
    };
    return calls;
}

module.exports.get = function (){
    return calls;
}