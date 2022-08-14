const http = require('http');
const path = require('path');

let pathToServiceAccount = path.resolve(`projectConfig.json`);
let serviceAccount = JSON.stringify(require(pathToServiceAccount));
console.log({msg: "getAccountConfig", serviceAccount: serviceAccount});

const requestListener = function (req, res) {
    console.log({msg: "received response", req: req});
    res.writeHead(200);
    res.write(serviceAccount);
    res.end();
}

const server = http.createServer(requestListener);
server.listen(8085, "127.0.0.1");
console.log("server listen on 8085")