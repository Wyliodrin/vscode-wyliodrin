module.exports = function (httpService)
{
    let http = httpService.http;
    
    return {
        logout: async function (){
            let response = await http.get ('/user/logout');
            if (response.data && response.data.err === 0){
                return true;
            }
            else{
                return false;
            }
        },

        login: async function (params){
            console.log ('api');
            httpService.setEndpoint (params.host);
            let response = await http.post ('/user/login', params);
            if (response.data && response.data.token){
                httpService.setToken (response.data.token);
                return response.data.token;
            }
            return null;
        },

        get: async function (){
            let response = await http.get ('/user');
            if (response.data && response.data.err === 0)
                return response.data.user;
            return null;
        }
    };
}