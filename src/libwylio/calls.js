let calls;
exports.init = function (endpoint, token){
    endpoint = endpoint + '/api/v1';
    let httpService = require ('./http')(endpoint);
    const users = require ('./users')(httpService);
    const clusters = require ('./clusters')(httpService.http);
    const products = require ('./products')(httpService.http);
    const apps = require ('./applications')(httpService.http);
    const deploy = require ('./deploy')(httpService.http);
    const settings = require ('./settings')(httpService.http);
    const projects = require ('./projects')(httpService.http);
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

exports.get = function (){
    return calls;
}