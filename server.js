const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const api = require('./api');
const textToSpeech = require('./text-to-speech');
const { jwtAuthorization, jwtLogin, jwtUnauthorizedError } = require('./auth/jwt-auth');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, 'public')))
app.use("/login", jwtLogin);
app.use("/api",
    jwtAuthorization,
    jwtUnauthorizedError,
    api);
app.use("/api/text-to-speech",
    jwtAuthorization,
    jwtUnauthorizedError,
    textToSpeech);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Dialogflow Surrogate App listening on port ${PORT}`);
    console.log(`ENVIRONMENT ${process.env.ENVIRONMENT}`)
    console.log(`DEFAULT_TARGET ${process.env.DEFAULT_TARGET}`)
    console.log('Press Ctrl+C to quit.');


});