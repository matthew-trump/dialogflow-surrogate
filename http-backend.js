const http = require('http');
const https = require('https');
const config = require("./config");

const DEBUG = process.env.DEBUG;
const DEBUG_REQUESTS = DEBUG || process.env.DEBUG_REQUESTS;

class httpBackend {

    constructor() { }

    getClientRequest(target, projectId, postData) {
        const targetConfig = config.targets[target];
        const projectConfig = config.projects[projectId];

        const backendUrl = targetConfig.url;
        console.log("targetConfig.secretKey", targetConfig, targetConfig.secretKey)
        const secretKey = process.env[targetConfig.secretKey];
        console.log("secretKey", secretKey)
        const path = projectConfig.path;

        const url = new URL(backendUrl + path);
        const hostname = url.hostname;
        const pathname = url.pathname;
        const protocol = url.protocol;
        const port = url.port ? url.port : protocol.startsWith('https') ? 443 : 80;
        const client = protocol.startsWith('https') ? https : http;

        if (DEBUG_REQUESTS) console.log("BACKEND URL", url)
        return {
            client: client,
            request: {
                host: hostname,
                port: port,
                path: pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'Authorization': 'Bearer ' + secretKey
                }
            }
        };
    }

    async post(target, projectId, body) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(body);
            const { client, request } = this.getClientRequest(target, projectId, postData);
            const postRequest = client.request(request, (response) => {
                var responseString = "";
                response.setEncoding('utf8');
                response.on("data", function (data) {
                    responseString += data;
                });
                response.on('error', function (err) {
                    reject(err);
                });
                response.on("end", function () {
                    try {
                        resolve(JSON.parse(responseString));
                    } catch (err) {
                        console.log("ERROR parsing JSON:", responseString);
                        reject(err);
                    }
                });
            });
            postRequest.on('error', (error) => {
                const message = "Unable to contact Fulfillment service at " + url;
                console.log("ERROR " + message, error)
                return reject(error);
            })
            postRequest.write(postData);
            postRequest.end();
        })
    }
}
module.exports = new httpBackend();