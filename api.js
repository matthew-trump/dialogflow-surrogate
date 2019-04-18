const express = require('express');
//const http = require('http');
//const https = require('https');
//const url = require('url');
const router = express.Router();
//const fs = require('fs');
const config = require("./config");

//const requireYaml = require("require-yaml");
//const crypto = require('crypto');
//const textToSpeech = require('@google-cloud/text-to-speech');
//const speech = require('@google-cloud/speech');
//const { Storage } = require('@google-cloud/storage');
//const format = require('util').format;
//const multer = require('multer');
//const stream = require('stream');
// //const upload          = multer({ dest: 'upload/'});
/** 
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
    }
});
*/


const URL = require('url').URL;

const LANGUAGE_CODE = "en-us";

const INVOCATION = "Take me to test app";

const DEBUG = process.env.DEBUG;
const DEBUG_REQUESTS = DEBUG || process.env.DEBUG_REQUESTS;
const DEBUG_DATA = DEBUG || process.env.DEBUG_DATA;
const DEBUG_INTENT = DEBUG || process.env.DEBUG_INTENT;
const DEBUG_SPEECH = DEBUG || process.env.DEBUG_SPEECH;


//const BUCKET_NAME = process.env.BUCKET_NAME;


//const storage = new Storage();
//const bucket = storage.bucket(BUCKET_NAME);
const CONFIG_PATH = process.env.CONFIG_PATH;
const CONFIG = require(CONFIG_PATH);

/**
 * 
const TARGET = config.targets[CONFIG.default_target];

const intentIdMap = {};
const dataMap = {};

 */
router.get('/', function (req, res) {
    res.json({ message: "OK" });
});

router.post('/', function (req, res) {
    const message = req.body.message;
    const object = req.body.object;
    const id = object ? object.id : null;
    res.json(config);
})

router.get('/config', function (req, res) {
    res.json(CONFIG);
});
/** 
router.get('/config', function (req, res) {
    res.json(config);
})



router.post('/project/:projectId', function (req, res) {

    const projectId = req.params.projectId;
    const conversationId = req.body.conversation.conversationId;
    const target = req.body.target || TARGET;
    const extra = req.body.extra;

    if (DEBUG_REQUESTS) console.log("");
    if (DEBUG_REQUESTS) console.log("= from Assistant");
    if (DEBUG_REQUESTS) console.log(JSON.stringify(req.body));
    const options = { withData: true, noMap: req.body.noMap };
    if (extra) {
        options.data = {
            quiz: {
                load: {
                    options: extra
                }
            }
        }
    }

    const message = getFulfillmentPostObject(projectId, req.body, options)
    postToBackend(req, res, { target: target, projectId: projectId, conversationId: conversationId, message: message });
});

router.put('/project/:projectId', function (req, res) {

    const projectId = req.params.projectId;
    const conversationId = req.body.conversationId;
    const target = req.body.target;


    if (DEBUG_REQUESTS) console.log("");
    if (DEBUG_REQUESTS) console.log("=============");
    if (DEBUG_REQUESTS) console.log(conversationId);
    if (DEBUG_REQUESTS) console.log("= from Assistant");
    if (DEBUG_REQUESTS) console.log(JSON.stringify(req.body));

    const body = getIncomingRequest(projectId, {
        projectId: projectId,
        conversationId: conversationId,
        target: target,
        query: req.body.query,
        conversationType: req.body.conversationType,
        canvas: req.body.canvas,
        intent: req.body.intent,
        inputType: req.body.inputType
    });
    const noMap = req.query.noMap || req.body.noMap

    const message = getFulfillmentPostObject(
        projectId,
        body,
        { withData: true, data: req.body.data, noMap: noMap, queryText: req.body.queryText }
    );

    postToBackend(req, res, { target: target, projectId: projectId, conversationId: conversationId, message: message });
});

router.get('/project/:projectId', function (req, res) {
    const projectId = req.params.projectId;
    const query = req.query.query;
    const queryText = req.query.queryText;
    const canvas = parseInt(req.query.canvas);
    const conversationId = req.query.conversationId || "101-TEST";
    const conversationType = req.query.conversationType;

    const intent = req.query.intent;
    const inputType = req.query.inputType


    res.json(getFulfillmentPostObject(
        projectId,
        getIncomingRequest(projectId, {
            projectId: projectId,
            query: query,
            canvas: canvas,
            conversationId: conversationId,
            conversationType: conversationType,
            intent: intent,
            inputType: inputType
        }),
        { withData: false, noMap: req.query.noMap, queryText: queryText }
    )
    );
});

*/



/** 

const escapeDoubleQuotes = function (str) {
    return str.replace(/\\([\s\S])|(")/g, "\\$1$2"); // thanks @slevithan!
}
const getSessionId = function (projectId, conversationId) {
    return "projects/" + projectId + "/agent/sessions/" + conversationId;
}
const initializeDataMap = function (projectId) {
    dataMap[projectId] = {};
}

const generateIdString = function () {
    const length = 16;
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-';
    let result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
const initializeIntentMapIds = function (projectId) {
    const map = config.projects[projectId].intents;
    intentIdMap[projectId] = {};
    Object.values(map).map(name => {
        if (!intentIdMap[projectId].hasOwnProperty(name)) {
            intentIdMap[projectId][name] = generateIdString();
        }
    });
    intentIdMap[projectId][config.projects[projectId].fallback] = generateIdString();
}



const getIncomingRequest = function (projectId, params) {



    const userId = 1;
    const locale = "en-US";
    const lastSeen = "";
    const userStorage = JSON.stringify({ data: {} });
    const conversationToken = "[\"_actions_on_google\"]";

    const obj = {
        user: {
            userId: userId,
            locale: locale,
            lastSeen: lastSeen,
            userStorage: userStorage
        },
        conversation: {
            conversationId: params.conversationId,
            conversationToken: conversationToken,
            type: params.conversationType //ACTIVE or NEW
        },
        inputs: [
            {
                intent: params.intent,
                rawInputs: [
                    {
                        inputType: params.inputType,
                        query: params.query
                    }
                ],
                arguments: [
                    {
                        "name": "text",
                        "rawText": params.queryText || params.query,
                        "textValue": params.queryText || params.query
                    }
                ]
            }
        ],
        surface: {
            capabilities: [
                {
                    name: "actions.capability.SCREEN_OUTPUT"
                },
                {
                    name: "actions.capability.MEDIA_RESPONSE_AUDIO"
                },
                {
                    name: "actions.capability.WEB_BROWSER"
                },
                {
                    name: "actions.capability.AUDIO_OUTPUT"
                }
            ]
        },
        isInSandbox: true,
        availableSurfaces: [
            {
                capabilities: [
                    {
                        name: "actions.capability.SCREEN_OUTPUT"
                    },
                    {
                        name: "actions.capability.WEB_BROWSER"
                    },
                    {
                        name: "actions.capability.AUDIO_OUTPUT"
                    }
                ]
            }
        ],
        requestType: "SIMULATOR"
    }

    if (params.canvas) {

        obj.surface.capabilities.push({
            name: "actions.capability.CUSTOM_STAGE"
        });
    }

    if (obj.inputs[0].rawInputs[0].inputType === INPUT_TYPE_KEYBOARD) {
        obj.inputs[0].arguments = [
            {
                "name": "text",
                "rawText": params.queryText || params.query,
                "textValue": params.queryText || params.query
            }
        ]
    } else if (obj.inputs[0].rawInputs[0].inputType === INPUT_TYPE_VOICE) {

    }
    return obj;
}

*/
/**
const getIntent = function (projectId, query, noMap) {
    let displayName;
    if (DEBUG_INTENT) console.log("INTENT", projectId, query, noMap);
    const intentsMap = config.projects[projectId].intents;
    if (DEBUG_INTENT) console.log("INTENT", intentsMap)
    if (query.startsWith('$any:')) {
        displayName = intentsMap['$any'];
    }
    if (!displayName) {
        if (noMap) {
            displayName = query;
        } else {
            displayName = intentsMap[query.toLowerCase()]
            if (!displayName) {
                if (query === INVOCATION) {
                    displayName = config.projects[projectId].welcome;
                } else {
                    displayName = config.projects[projectId].fallback;
                }
            }
        }
    }

    if (DEBUG_INTENT) console.log("INTENT ->", displayName);
    const name = "projects/" + projectId + "/agent/intents/" + displayName;
    return {
        displayName: displayName,
        name: name
    };
}


const getFulfillmentPostObject = function (projectId, body, options) {


    let query = body.inputs[0].rawInputs[0].query;

    const intent = getIntent(projectId, query, options.noMap);
    if (query.startsWith("$any:")) {
        query = query.substring(5).trim();
    }

    const conversation = body.conversation;
    const conversationId = conversation.conversationId
    const sessionId = getSessionId(projectId, conversationId);


    if (!dataMap[projectId][conversationId]) {
        dataMap[projectId][conversationId] = {};
    }
    let dataString = "";
    if (options.withData) {
        dataString = dataMap[projectId][conversationId][APP_DATA_CONTEXT];
        if (dataString) {
            let data = JSON.parse(dataMap[projectId][conversationId][APP_DATA_CONTEXT]);
            dataString = JSON.stringify(data);
            if (options.data) {
                data = Object.assign({}, data, options.data);
            }
        } else if (options.data) {
            data = options.data;
            dataString = JSON.stringify(data);
        }
    }
    if (DEBUG_DATA) console.log("");
    if (DEBUG_DATA) console.log("=data sent");
    if (DEBUG_DATA) console.log(dataString);

    const queryText = options.queryText || query;
    const user = body.user;
    const inputs = body.inputs;
    const isInSandbox = body.isInSandbox;
    const capabilities = body.surface.capabilities;
    const requestType = body.requestType;
    const availableSurfaces = body.availableSurfaces

    body.inputs[0].rawInputs[0].query = queryText;
    body.inputs[0].arguments[0].rawText = queryText;
    body.inputs[0].arguments[0].textValue = queryText;

    const canvas = body.surface.capabilities.filter(c => c.name === "actions.capability.CUSTOM_STAGE").length > 0


    const responseId = generateIdString();



    const obj = {
        responseId: responseId,
        queryResult: {
            queryText: queryText,
            intent: intent,

            outputContexts:
                [
                    {
                        name: sessionId + "/contexts/" + APP_DATA_CONTEXT,
                        parameters: {
                            data: dataString
                        }
                    },

                    { name: sessionId + "/contexts/" + ACTIONS_CAPABILITY_SCREEN_OUTPUT },
                    { name: sessionId + "/contexts/" + ACTIONS_CAPABILITY_AUDIO_OUTPUT },
                    { name: sessionId + "/contexts/" + GOOGLE_ASSISTANT_INPUT_TYPE_KEYBOARD },
                    { name: sessionId + "/contexts/" + ACTIONS_CAPABILITY_WEB_BROWSER },
                    { name: sessionId + "/contexts/" + ACTIONS_CAPABILITY_MEDIA_RESPONSE_AUDIO }
                ],

            intentDetectionConfidence: 1,
            languageCode: LANGUAGE_CODE,
            allRequiredParamsPresent: true,
            parameters: {},
            fulfillmentMessages:
                [{ text: { text: [""] } }]
        },
        originalDetectIntentRequest: {
            source: "google",
            version: "2",
            payload:
            {
                isInSandbox: isInSandbox,
                surface:
                {
                    capabilities: capabilities
                },
                requestType: requestType,
                inputs: inputs,
                user: user,
                conversation: conversation,
                availableSurfaces: availableSurfaces
            }
        },
        session: sessionId
    };

    if (canvas) {

        obj.queryResult.outputContexts.push({ name: sessionId + "/contexts/" + ACTIONS_CAPABILITY_CUSTOM_STAGE });
    }

    //console.log("DATA SENT",obj.queryResult.outputContexts[0].parameters.data);
    return obj;
}
const getAssistantResponseBody = function (projectId, conversationId, responseBody, intent) {

    let data = {};

    if (!responseBody || !responseBody.payload || !responseBody.payload.google) {

        return {};
    }


    const userStorage = responseBody.payload.google.userStorage;
    const responseItem = responseBody.payload.google.richResponse.items[0]
    const expectUserResponse = responseBody.payload.google.expectUserResponse;


    const outputContexts = responseBody.outputContexts.filter(c => {
        return c.name.endsWith(APP_DATA_CONTEXT);
    });

    if (outputContexts && outputContexts[0] && outputContexts[0].parameters) {
        data = outputContexts[0].parameters.data;
    } else {
        data = {};
    }
    if (DEBUG_DATA) console.log("");
    if (DEBUG_DATA) console.log("=data received");
    if (DEBUG_DATA) console.log(JSON.stringify(data));

    dataMap[projectId][conversationId][APP_DATA_CONTEXT] = data;


    return {
        conversationToken: "['" + APP_DATA_CONTEXT + "']",
        expectUserResponse: expectUserResponse,
        expectedInputs: [
            {
                inputPrompt: {
                    richInitialPrompt: {
                        items: [responseItem]
                    }
                },
                possibleIntents: [
                    {
                        intent: "assistant.intent.action.TEXT"
                    }
                ]
            }
        ],
        responseMetadata: {
            status: {
                message: "Success (200)"
            },
            queryMatchInfo: {
                queryMatched: true,
                intent: intent.name.split("/").pop()
            }
        },
        userStorage: userStorage
    }
}


const getYaml = function (req) {
    const projectId = req.params.projectId;
    const id = req.params.id;

    const path = "./artillery/scripts/" + projectId + "/" + id;
    const json = require(path);

    const target = req.query.target || json.config.target;

    yml = "config:\n"
        + "  target: \"" + target + "\"\n"


    if (json.config.phases) {
        yml = yml + "  phases:\n";
        json.config.phases.map((phase) => {
            yml = yml + "    - duration: " + phase.duration + "\n"
                + "      arrivalRate: " + phase.arrivalRate + "\n";
            if (typeof phase.rampTo !== 'undefined') {
                yml = yml + "      rampTo: " + phase.rampTo + "\n";
            }
        })
    }
    if (json.config.defaults) {
        yml = yml + "  defaults:\n";
        if (json.config.defaults.headers) {
            if (json.config.defaults.headers['authorization']) {
                const authorization = json.config.defaults.headers['authorization'];
                if (authorization.endsWith("SECRET_KEY")) {
                    const SECRET_KEY = process.env[config.secret_keys[target]];
                    console.log(SECRET_KEY);
                    json.config.defaults.headers['authorization']
                        = authorization.substring(0, authorization.length - 10)
                        + SECRET_KEY;
                }
            }


            Object.keys(json.config.defaults.headers).map(name => {
                yml = yml + "     " + name + ": '" + json.config.defaults.headers[name] + "'\n";
            })
        }
    }
    if (json.config.payload) {
        yml = yml + "  payload:\n"
            + "    path: \"" + json.config.payload.path + "\"\n"
            + "    fields:\n"
            + "    - \"id\"\n";
    }
    if (json.dialogflow) {
        yml = yml + "scenarios:\n"
            + "  - name: \"" + json.dialogflow.name + "\"\n"
            + "    flow:\n";

        json.dialogflow.flow.map(postEvent => {

            let data = postEvent.data;
            //console.log(0,data);
            if (json.dialogflow.data) {
                data = Object.assign({}, json.dialogflow.data, data);
            }
            const incoming = getIncomingRequest(projectId, {
                projectId: projectId,
                query: postEvent.query,
                queryText: postEvent.queryText,
                canvas: json.dialogflow.canvas,
                conversationId: json.dialogflow.conversationId || postEvent.conversationId || "{{id}}",
                conversationType: postEvent.conversationType,
                intent: postEvent.intent,
                inputType: postEvent.inputType
            });

            //console.log(1,incoming.availableSurfaces);
            const postBody = getFulfillmentPostObject(projectId, incoming, {
                withData: true,
                data: data,
                noMap: postEvent.noMap,
                queryText: postEvent.queryText
            });

            //console.log(2,postBody.originalDetectIntentRequest.payload.availableSurfaces); 
            //console.log(2,1,postBody.queryResult.intent)
            yml = yml
                + "      - post:\n"
                + "         url: \"" + json.dialogflow.url + "\"\n"
                + "         json:\n"
                + "           responseId: \"" + postBody.responseId + "\"\n"
                + "           queryResult:\n"
                + "             queryText: \"" + postBody.queryResult.queryText + "\"\n"
                + "             intent:\n"
                + "               displayName: \"" + postBody.queryResult.intent.displayName + "\"\n"
                + "               name: \"" + postBody.queryResult.intent.name + "\"\n"
                + "             outputContexts:\n";

            postBody.queryResult.outputContexts.map(context => {

                yml = yml
                    + "               - name: \"" + context.name + "\"\n";
                if (typeof context.parameters !== 'undefined') {
                    //console.log(2,2,context.parameters);
                    yml = yml
                        + "                 parameters:\n"
                        + "                   data: \"" + escapeDoubleQuotes(context.parameters.data) + "\"\n";
                }
            })

            yml = yml
                + "             intentDetectionConfidence: " + postBody.queryResult.intentDetectionConfidence + "\n"
                + "             languageCode: \"" + postBody.queryResult.languageCode + "\"\n"
                + "             allRequiredParamsPresent: " + postBody.queryResult.allRequiredParamsPresent + "\n"
                + "             parameters: {}\n"
                + "             fulfillmentMessages:\n"
                + "               - text:\n"
                + "                   text:\n"
                + "                     - \"\"\n";

            //console.log("SESSION",postBody.session);
            yml = yml
                + "           session: \"" + postBody.session + "\"\n";
            yml = yml
                + "           originalDetectIntentRequest: \n"
                + "             source: \"" + postBody.originalDetectIntentRequest.source + "\"\n"
                + "             version: \"" + postBody.originalDetectIntentRequest.version + "\"\n"
                + "             payload: \n"
                + "               isInSandbox: " + postBody.originalDetectIntentRequest.payload.isInSandbox + "\n"
                + "               surface:\n"
                + "                 capabilities:\n";

            postBody.originalDetectIntentRequest.payload.surface.capabilities.map(capability => {
                yml = yml
                    + "                   - name: \"" + capability.name + "\"\n";
            })

            yml = yml
                + "               requestType: \"" + postBody.originalDetectIntentRequest.payload.requestType + "\"\n"
                + "               inputs: \n";
            postBody.originalDetectIntentRequest.payload.inputs.map(input => {
                yml = yml
                    + "                 - rawInputs:\n";
                input.rawInputs.map(rawInput => {
                    yml = yml
                        + "                    - query: \"" + rawInput.query + "\"\n"
                        + "                      inputType: \"" + rawInput.inputType + "\"\n";
                });
                yml = yml
                    + "                   arguments:\n";
                input.arguments.map(argument => {
                    yml = yml
                        + "                    - rawText: \"" + argument.rawText + "\"\n"
                        + "                      textValue: \"" + argument.textValue + "\"\n"
                        + "                      name: \"" + argument.name + "\"\n";
                });
                yml = yml
                    + "                   intent: \"" + input.intent + "\"\n";



            })
            const user = postBody.originalDetectIntentRequest.payload.user;


            yml = yml
                + "               user:\n"
                + "                 userStorage: \"" + escapeDoubleQuotes(user.userStorage) + "\"\n"
                + "                 lastSeen: \"" + user.lastSeen + "\"\n"
                + "                 locale: \"" + user.locale + "\"\n"
                + "                 userId: \"" + user.userId + "\"\n";

            const conversation = postBody.originalDetectIntentRequest.payload.conversation;


            yml = yml
                + "               conversation:\n"
                + "                 conversationId: \"{{id}}\"\n"
                + "                 type: \"" + conversation.type + "\"\n"
                + "                 token: \"" + escapeDoubleQuotes(conversation.conversationToken) + "\"\n";



            yml = yml
                + "               availableSurfaces: \n";
            //console.log(3,postBody.originalDetectIntentRequest.payload.availableSurfaces);
            postBody.originalDetectIntentRequest.payload.availableSurfaces.map(surface => {
                yml = yml
                    + "                 -  capabilities:\n"
                //console.log(4,"SURFACE",surface);
                surface.capabilities.map(capability => {
                    //console.log(5,"CAPABILITY",capability);
                    yml = yml
                        + "                     - name: \"" + capability.name + "\"\n";
                })

            })

        });

    }
    return yml;
}



const postToBackend = function (req, res, options) {
    const projectId = options.projectId;
    const conversationId = options.conversationId;
    const message = options.message;
    const target = options.target || TARGET;
    console.log("target", target);
    const url = new URL(target);
    const hostname = url.hostname;
    let port = url.port;
    const protocol = url.protocol;

    const path = config.projects[projectId].path;

    const client = protocol.startsWith('https') ? https : http;
    if (!port) {
        if (protocol.startsWith('https')) {
            port = 443;
        } else {
            port = 80;
        }
    }
    const intent = message.queryResult.intent;
    const post_data = JSON.stringify(message);

    const secretkey = process.env[config.secret_keys[hostname]];
    if (DEBUG) console.log(protocol, hostname, port, secretkey);
    if (DEBUG_REQUESTS) console.log("");
    if (DEBUG_REQUESTS) console.log("=request");
    if (DEBUG_REQUESTS) console.log(post_data);



    const post_req = client.request({
        host: hostname,
        port: port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(post_data),
            'Authorization': 'Bearer ' + secretkey
        }
    }, function (res2) {

        var responseString = "";
        res2.setEncoding('utf8');

        res2.on("data", function (data) {
            responseString += data;
        });
        res2.on('error', function (err) {
            res.status(500).send({
                error: "Unable to contact Fulfillment service at " + url
            });
        });
        res2.on("end", function () {

            res.status(res2.statusCode);
            const responseBody = JSON.parse(responseString);
            if (DEBUG_REQUESTS) console.log("=response");
            if (DEBUG_REQUESTS) console.log(JSON.stringify(responseBody));
            const assistantResponse = getAssistantResponseBody(projectId, conversationId, responseBody, intent);

            if (DEBUG_REQUESTS) console.log("");
            if (DEBUG_REQUESTS) console.log("=to Assistant");
            if (DEBUG_REQUESTS) console.log(JSON.stringify(assistantResponse));

            res.json(assistantResponse);
        });
    });
    post_req.on('error', (error) => {
        const message = "Unable to contact Fulfillment service at " + url;
        console.log("ERROR " + message, error)
        res.status(500).send(error);
    })
    post_req.write(post_data);
    post_req.end();
}
 */


/** 
Object.keys(config.projects).map(id => {
    initializeDataMap(id);
    initializeIntentMapIds(id);

})
*/
/**
loadTargetConfigs = function (target) {

    const url = new URL(target);
    const hostname = url.hostname;
    let port = url.port;
    const protocol = url.protocol;
    const secretkey = process.env[config.secret_keys[hostname]];
    const path = '/api/config';

    const get_req = http.request({
        host: hostname,
        port: port,
        path: path,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + secretkey
        }
    }, function (res) {

        var responseString = "";
        res.setEncoding('utf8');

        res.on("data", function (data) {
            responseString += data;
        });
        res.on('error', function (err) {
            console.log("Unable to contact config target " + target, err)
        });
        res.on("end", function () {
            try {
                const response = JSON.parse(responseString);
                config.extra = response;
                console.log("CONFIG EXTRA", config.extra);
                //res.json({message:"OK", dialogflow: response });
            } catch (err) {
                console.log("Unable to parse JSON from config target", err, responseString)

                //res.json({message:"OK",dialogflow: { message: responseString }});
            }

        });
    });
    get_req.on('error', (error) => {
        const message = "Unable to contact config target (2)" + target;
        console.log("ERROR " + message, error)
        //res.json({message: "OK", dialogflow: { message : message }});
    })
    get_req.end();

}
 */



module.exports = router;