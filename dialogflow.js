const config = require('./config');

const SESSION_QUEUE_SIZE = process.env.SESSION_QUEUE_SIZE || 100;

const DEBUG = process.env.DEBUG;
const DEBUG_INTENT = DEBUG || process.env.DEBUG_INTENT;

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
        this.dataMap = {};
        this.outputContextMap = {};

        Object.keys(config.projects).map(id => {
            this.initializeDataMap(id);
            this.initializeOutputContextMap(id);
            this.initializeIntentMapIds(id);
        })
    }
    initializeDataMap(projectId) {
        this.dataMap[projectId] = {};
    }
    initializeOutputContextMap(projectId) {
        this.outputContextMap[projectId] = {};
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
    getAppliedContext(projectId, conversationId) {
        const defaultContext = config.projects[projectId].intents.contexts.default;
        if (typeof this.outputContextMap[projectId][conversationId] === 'undefined') {
            return defaultContext;
        }
        const currentContexts = JSON.parse(JSON.stringify(this.outputContextMap[projectId][conversationId]));

        const activeContextNames = currentContexts
            .sort((a, b) => a.lifespanCount < b.lifespanCount ? -1 : (b.lifespanCount > a.lifespanCount) ? 1 : 0)
            .reverse()
            .map(context => context.name.split("/").pop())
            .filter(name => name !== APP_DATA_CONTEXT);

        if (activeContextNames.length < 1) {
            return defaultContext;
        }
        let appliedContext = Object.assign({}, defaultContext);
        activeContextNames.map(name => {
            const configContext = config.projects[projectId].intents.contexts[name];
            appliedContext = configContext ? Object.assign({}, appliedContext, configContext) : appliedContext;
        })
        return appliedContext;

    }
    getIntent(projectId, conversationId, assistantRequest, noMap) {
        const query = this.getQuery(assistantRequest, false);


        let intent;
        if (DEBUG_INTENT) console.log("INTENT", projectId, query, noMap);
        const intentsMap = this.getAppliedContext(projectId, conversationId);

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


        if (typeof this.outputContextMap[projectId][conversationId] !== 'undefined') {
            this.outputContextMap[projectId][conversationId] = this.outputContextMap[projectId][conversationId]
                .map(context => {

                    const newcontext = context.lifespanCount < 99 ? Object.assign({}, context, { lifespanCount: context.lifespanCount - 1 }) : context;


                    return newcontext;
                })
                .filter(context => {
                    return context.lifespanCount > 0;
                });
        } else {

            this.outputContextMap[projectId][conversationId] = [
                {
                    name: sessionId + "/contexts/" + APP_DATA_CONTEXT,
                    lifespanCount: 99,
                    parameters: {
                        data: "{}"
                    }
                }
            ];
            const marker = this.sessionQueueMarker;
            const deletableConversatonId = this.sessionQueue[marker];
            if (typeof deletableConversatonId === 'string') {
                delete this.outputContextMap[projectId][deletableConversatonId]
            }
            this.sessionQueue[marker] = conversationId;
            this.sessionQueueMarker = marker < (this.sessionQueue.length - 1) ?
                marker + 1 : 0;
        }
        const outputContexts = this.outputContextMap[projectId][conversationId]
            .map(context => {
                return {
                    name: context.name,
                    parameters: context.parameters
                }
            })

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
                        ...outputContexts,
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

        if (!responseBody || !responseBody.payload || !responseBody.payload.google) {

            return {};
        }


        const userStorage = responseBody.payload.google.userStorage;
        const responseItems = responseBody.payload.google.richResponse.items;
        const responseSuggestions = responseBody.payload.google.richResponse.suggestions;
        const expectUserResponse = responseBody.payload.google.expectUserResponse;

        if (responseBody.outputContexts) {
            const currentContexts = this.outputContextMap[projectId][conversationId];
            const newContextNames = responseBody.outputContexts.map(context => context.name);

            this.outputContextMap[projectId][conversationId] =
                [
                    ...responseBody.outputContexts,
                    ...currentContexts.filter(context => {
                        return newContextNames.indexOf(context.name) === -1;
                    })]

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