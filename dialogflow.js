const config = require('./config');

const SESSION_QUEUE_SIZE = process.env.SESSION_QUEUE_SIZE || 100;

const DEBUG = process.env.DEBUG;
const DEBUG_REQUESTS = DEBUG || process.env.DEBUG_REQUESTS;
const DEBUG_DATA = DEBUG || process.env.DEBUG_DATA;
const DEBUG_INTENT = DEBUG || process.env.DEBUG_INTENT;
const DEBUG_SPEECH = DEBUG || process.env.DEBUG_SPEECH;

const INVOCATION = "take me to";
const APP_DATA_CONTEXT = '_actions_on_google';

const ACTIONS_INTENT_CANCEL = "actions_intent_CANCEL";
const ACTIONS_CAPABILITY_CUSTOM_STAGE = "actions_capability_custom_stage";
const ACTIONS_CAPABILITY_SCREEN_OUTPUT = "actions_capability_screen_output";
const ACTIONS_CAPABILITY_AUDIO_OUTPUT = "actions_capability_audio_output";
const GOOGLE_ASSISTANT_INPUT_TYPE_KEYBOARD = "google_assistant_input_type_keyboard";
const ACTIONS_CAPABILITY_WEB_BROWSER = "actions_capability_web_browser";
const ACTIONS_CAPABILITY_MEDIA_RESPONSE_AUDIO = "actions_capability_media_response_audio";

const LANGUAGE_CODE = "en-us";

const EXIT_COMMANDS = ['quit', 'exit', 'cancel', 'stop', 'nevermind', 'goodbye'];



class dialogflow {

    constructor() {
        this.sessionQueue = Array(SESSION_QUEUE_SIZE);
        this.sessionQueueMarker = 0;

        this.intentIdMap = {};
        this.dataMap = {}
        Object.keys(config.projects).map(id => {
            this.initializeDataMap(id);
            this.initializeIntentMapIds(id);
        })
    }
    initializeDataMap(projectId) {
        this.dataMap[projectId] = {};
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
    getIntent(projectId, assistantRequest, noMap) {
        const query = this.getQuery(assistantRequest, false);


        let intent;
        if (DEBUG_INTENT) console.log("INTENT", projectId, query, noMap);
        const intentsMap = config.projects[projectId].intents;
        if (DEBUG_INTENT) console.log("INTENT", intentsMap);

        if (EXIT_COMMANDS.indexOf(query.toLowerCase()) !== -1) {
            intent = ACTIONS_INTENT_CANCEL;
        } else if (query.startsWith('$any:')) {
            intent = intentsMap['$any'];
        }
        if (!intent) {
            if (noMap) {
                intent = query;
            } else {
                intent = intentsMap[query.toLowerCase()]
                if (!intent) {
                    const invocation = INVOCATION + " " + config.projects[projectId].name.toLowerCase();
                    if (query.toLowerCase() === invocation) {
                        intent = config.projects[projectId].welcome;
                    } else {
                        intent = config.projects[projectId].fallback;
                    }
                }
            }
        }
        const displayName = Array.isArray(intent) ? intent[0] : intent;
        const params = Array.isArray(intent) ? intent[1] : {};

        if (DEBUG_INTENT) console.log("INTENT ->", displayName);
        if (DEBUG_INTENT) console.log("PARAMS ->", params);
        const name = "projects/" + projectId + "/agent/intents/" + displayName;
        return {
            name: name,
            displayName: displayName,
            params: params
        };
    }
    getQuery(assistantRequest, parseAny) {
        let query = assistantRequest.inputs[0].rawInputs[0].query;
        if (parseAny && query.startsWith("$any:")) {
            query = query.substring(5).trim();
        }
        return query;
    }
    getFulfillmentRequest(projectId, assistantRequest, intent, options) {

        const query = this.getQuery(assistantRequest, true);


        const conversation = assistantRequest.conversation;
        const conversationId = conversation.conversationId
        const sessionId = this.getSessionId(projectId, conversationId);

        const dataMap = this.dataMap[projectId];

        if (!dataMap[conversationId]) {
            dataMap[conversationId] = {};

            const marker = this.sessionQueueMarker;

            const deletableConversatonId = this.sessionQueue[marker];
            if (typeof deletableConversatonId === 'string') {

                delete this.dataMap[projectId][deletableConversatonId];
            }
            this.sessionQueue[marker] = conversationId;
            this.sessionQueueMarker = marker < (this.sessionQueue.length - 1) ?
                marker + 1 : 0;

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
                intent: {
                    displayName: intent.displayName,
                    name: intent.name
                },

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
                parameters: intent.params,
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

    getAssistantResponse(projectId, conversationId, responseBody, intent) {

        if (intent.displayName === ACTIONS_INTENT_CANCEL) {
            return {
                conversationToken: "['" + APP_DATA_CONTEXT + "']",
                expectedInputs: [
                    {
                        inputPrompt: {
                            richInitialPrompt: {
                                items: [],
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
                        intent: ACTIONS_INTENT_CANCEL
                    }
                }
            }
        }
        let data = {};

        if (!responseBody || !responseBody.payload || !responseBody.payload.google) {

            return {};
        }


        const userStorage = responseBody.payload.google.userStorage;
        const responseItems = responseBody.payload.google.richResponse.items;
        const responseSuggestions = responseBody.payload.google.richResponse.suggestions;
        const expectUserResponse = responseBody.payload.google.expectUserResponse;

        if (responseBody.outputContexts) {

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

            this.dataMap[projectId][conversationId][APP_DATA_CONTEXT] = data;

        }



        return {
            conversationToken: "['" + APP_DATA_CONTEXT + "']",
            expectUserResponse: expectUserResponse,
            expectedInputs: [
                {
                    inputPrompt: {
                        richInitialPrompt: {
                            items: responseItems,
                            suggestions: responseSuggestions
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
}

module.exports = new dialogflow()