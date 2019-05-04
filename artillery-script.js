const escapeDoubleQuotes = function (str) {
    return str.replace(/\\([\s\S])|(")/g, "\\$1$2"); // thanks @slevithan!
}

const getPostYml = (postBody) => {
    yml = yml
        + "      - post:\n"
        + "         url: \"${url}\"\n"
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
    postBody.originalDetectIntentRequest.payload.availableSurfaces.map(surface => {
        yml = yml
            + "                 -  capabilities:\n"
        surface.capabilities.map(capability => {
            yml = yml
                + "                     - name: \"" + capability.name + "\"\n";
        })

    })
    return yml;

}

module.exports = { getPostYml }