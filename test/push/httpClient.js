const http = require('http');


var accountId = "account";
let appSid = "app";

const options = {
    hostname: '127.0.0.1',
    port: 8085,
    //url:"http://127.0.0.1:8085/restcomm/2012-04-24/Accounts/" + accountSid + "/Applications/" + appSid,
    path: "/restcomm/2012-04-24/Accounts/" + accountId + "/Applications/" + appSid,
    method: 'GET',
    headers: {
        //'Content-Type': 'application/json'
        //'Content-Length': data.length,
    },
};

const req = http.request(options, res => {
    console.info(`statusCode: ${res.statusCode}`);
    let body =''
    res.on('data', function(chunk) {
        body += chunk;
    });
    res.on('end', function() {
        console.info({msg: "body", body: body});
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();