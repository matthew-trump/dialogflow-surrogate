const config = require('./config');
const DEBUG = process.env.DEBUG;
const DEBUG_REQUESTS = DEBUG || process.env.DEBUG_REQUESTS;
const DEBUG_DATA = DEBUG || process.env.DEBUG_DATA;
const DEBUG_INTENT = DEBUG || process.env.DEBUG_INTENT;
const DEBUG_SPEECH = DEBUG || process.env.DEBUG_SPEECH;

const INVOCATION = "take me to";
const APP_DATA_CONTEXT = '_actions_on_google';

const ACTIONS_CAPABILITY_CUSTOM_STAGE = "actions_capability_custom_stage";
const ACTIONS_CAPABILITY_SCREEN_OUTPUT = "actions_capability_screen_output";
const ACTIONS_CAPABILITY_AUDIO_OUTPUT = "actions_capability_audio_output";
const GOOGLE_ASSISTANT_INPUT_TYPE_KEYBOARD = "google_assistant_input_type_keyboard";
const ACTIONS_CAPABILITY_WEB_BROWSER = "actions_capability_web_browser";
const ACTIONS_CAPABILITY_MEDIA_RESPONSE_AUDIO = "actions_capability_media_response_audio";

const LANGUAGE_CODE = "en-us";

class dialogflow {

    constructor() {
        this.intentIdMap = {};
        this.dataMap = {}
        Object.keys(config.projects).map(id => {
            this.initializeDataMap(id);
            this.initializeIntentMapIds(id);
        })
    }
    initializeDataMap(projectId) {
        this.dataMap[projectId] = {};
        Object.keys(config.targets).map(targetId => {
            this.dataMap[projectId][targetId] = {};
        })
    }
    initializeIntentMapIds(projectId) {
        const map = config.projects[projectId].intents;
        this.intentIdMap[projectId] = {};
        Object.values(map).map(name => {
            if (!this.intentIdMap[projectId].hasOwnProperty(name)) {
                this.intentIdMap[projectId][name] = this.generateIdString();
            }
        });
        this.intentIdMap[projectId][config.projects[projectId].fallback] = this.generateIdString();
    }

    getSessionId(projectId, conversationId) {
        return "projects/" + projectId + "/agent/sessions/" + conversationId;
    }


    generateIdString() {
        const length = 16;
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-';
        let result = '';
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }
    getIntent(projectId, query, noMap) {
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
                    const invocation = INVOCATION + " " + config.projects[projectId].name.toLowerCase();
                    if (query.toLowerCase() === invocation) {
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
    getFulfillmentRequest(target, projectId, assistantRequest, options) {


        let query = assistantRequest.inputs[0].rawInputs[0].query;

        const intent = this.getIntent(projectId, query, options.noMap);
        if (query.startsWith("$any:")) {
            query = query.substring(5).trim();
        }

        const conversation = assistantRequest.conversation;
        const conversationId = conversation.conversationId
        const sessionId = this.getSessionId(projectId, conversationId);

        const dataMap = this.dataMap[projectId][target];

        if (!dataMap[conversationId]) {
            dataMap[conversationId] = {};
        }
        const conversationData = dataMap[conversationId];
        let dataString = "";
        if (options.withData) {
            dataString = conversationData[APP_DATA_CONTEXT];
            if (dataString) {
                let data = JSON.parse(conversationData[APP_DATA_CONTEXT]);
                dataString = JSON.stringify(data);
                if (options.data) {
                    data = Object.assign({}, data, options.data);
                }
            } else if (options.data) {
                let data = options.data;
                dataString = JSON.stringify(data);
            }
        }
        if (DEBUG_DATA) console.log("");
        if (DEBUG_DATA) console.log("=data sent");
        if (DEBUG_DATA) console.log(dataString);

        const queryText = options.queryText || query;
        const user = assistantRequest.user;
        const inputs = assistantRequest.inputs;
        const isInSandbox = assistantRequest.isInSandbox;
        const capabilities = assistantRequest.surface.capabilities;
        const requestType = assistantRequest.requestType;
        const availableSurfaces = assistantRequest.availableSurfaces

        assistantRequest.inputs[0].rawInputs[0].query = queryText;
        assistantRequest.inputs[0].arguments[0].rawText = queryText;
        assistantRequest.inputs[0].arguments[0].textValue = queryText;

        const canvas = assistantRequest.surface.capabilities.filter(c => c.name === "actions.capability.CUSTOM_STAGE").length > 0


        const responseId = this.generateIdString();



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
}

module.exports = new dialogflow()