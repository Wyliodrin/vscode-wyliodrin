module.exports = function (httpService, logoutCalls)
{
    let http = httpService.http;
    
    return {
        logout: async function (){
            let response = await http.get ('/user/logout');
            if (response.data && response.data.err === 0){
                logoutCalls ();
                return true;
            }
            else{
                return false;
            }
        },

        login: async function (params){
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