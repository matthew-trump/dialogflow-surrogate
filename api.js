const express = require('express');
const router = express.Router();
const config = require("./config");
const dialogflow = require("./dialogflow");
const httpBackend = require('./http-backend');

const DEBUG = process.env.DEBUG;
const DEBUG_REQUESTS = DEBUG || process.env.DEBUG_REQUESTS;
const DEBUG_DATA = DEBUG || process.env.DEBUG_DATA;
const DEBUG_INTENT = DEBUG || process.env.DEBUG_INTENT;
const DEBUG_SPEECH = DEBUG || process.env.DEBUG_SPEECH;

const ACTIONS_INTENT_CANCEL = "actions_intent_CANCEL";

router.post('/dialogflow', function (req, res) {
    const target = req.body.target || TARGET;
    const requestId = req.body.requestId;
    const projectId = req.body.projectId;
    const assistantRequest = req.body.request;
    const extra = req.body.extra;
    const conversationId = assistantRequest.conversation.conversationId;

    if (DEBUG_REQUESTS) console.log("");
    if (DEBUG_REQUESTS) console.log("=============");
    if (DEBUG_REQUESTS) console.log(conversationId);
    if (DEBUG_REQUESTS) console.log("=assistant request (received)");
    if (DEBUG_REQUESTS) console.log(JSON.stringify(assistantRequest));

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
    const intent = dialogflow.getIntent(projectId, assistantRequest, options.noMap);
    const fulfillmenRequest = dialogflow.getFulfillmentRequest(projectId, assistantRequest, intent, options);

    if (DEBUG_REQUESTS) console.log("");
    if (DEBUG_REQUESTS) console.log("=============");
    if (DEBUG_REQUESTS) console.log("intent", intent);
    if (DEBUG_REQUESTS) console.log("=fulfillment request (sent)");
    if (DEBUG_REQUESTS) console.log(JSON.stringify(fulfillmenRequest));

    httpBackend.post(target, projectId, fulfillmenRequest)
        .then((fulfillmentResponse) => {
            if (DEBUG_REQUESTS) console.log("=fulfillment response (received)");
            if (DEBUG_REQUESTS) console.log(JSON.stringify(fulfillmentResponse));

            if (typeof fulfillmentResponse.error !== 'undefined') {
                if (ACTIONS_INTENT_CANCEL === intent.displayName) {
                    const assistantResponse = dialogflow.getAssistantResponse(projectId, conversationId, {}, intent)
                    console.log("SENDING ACTIONS_INTENT_CANCEL", assistantResponse);
                    res.status(200).json({ response: assistantResponse });
                } else {
                    res.status(400).json(fulfillmentResponse);
                }
            } else {

                const assistantResponse = dialogflow.getAssistantResponse(projectId, conversationId, fulfillmentResponse, intent)
                if (DEBUG_REQUESTS) console.log("");
                if (DEBUG_REQUESTS) console.log("=============");
                if (DEBUG_REQUESTS) console.log("=assistant response (sent)");
                if (DEBUG_REQUESTS) console.log(JSON.stringify(assistantResponse));
                res.json({ response: assistantResponse, requestId: requestId });
            }

        })
        .catch((err) => {
            res.status(500).json({ error: err, requestId: requestId });
        })


})
router.get('/config', function (req, res) {
    res.json(config);
})


module.exports = router;