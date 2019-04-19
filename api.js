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


router.post('/dialogflow', function (req, res) {
    const target = req.body.target || TARGET;
    const projectId = req.body.projectId;
    const assistantRequest = req.body.request;
    const extra = req.body.extra;
    const conversationId = assistantRequest.conversation.conversationId;

    if (DEBUG_REQUESTS) console.log("");
    if (DEBUG_REQUESTS) console.log("=============");
    if (DEBUG_REQUESTS) console.log(conversationId);
    if (DEBUG_REQUESTS) console.log("= from Assistant");
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
    const fulfillmenRequest = dialogflow.getFulfillmentRequest(target, projectId, assistantRequest, intent, options);

    if (DEBUG_REQUESTS) console.log("");
    if (DEBUG_REQUESTS) console.log("=============");
    if (DEBUG_REQUESTS) console.log("intent", intent);
    if (DEBUG_REQUESTS) console.log(JSON.stringify(fulfillmenRequest));

    httpBackend.post(target, projectId, fulfillmenRequest)
        .then((fulfillmentResponse) => {
            if (DEBUG_REQUESTS) console.log("=fulfillment response");
            if (DEBUG_REQUESTS) console.log(JSON.stringify(fulfillmentResponse));

            const responseBody = dialogflow.getAssistantResponse(target, projectId, conversationId, fulfillmentResponse, intent)
            res.json({ response: responseBody });
        })
        .catch((err) => {
            res.status(500).json({ error: err });
        })


})
router.get('/config', function (req, res) {
    res.json(config);
})


module.exports = router;