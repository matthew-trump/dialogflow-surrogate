const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const api = require('./api');
const { login, handleUnauthorizedError, checkIfAuthenticated } = require('./login');

const app = express();

app.use(cors());
app.use(bodyParser.json());
//app.use(express.urlencoded());

app.use('/', express.static(path.join(__dirname, 'public')))

app.use("/api",
    checkIfAuthenticated,
    handleUnauthorizedError,
    api);

app.use("/login", login);

//app.use('/api/ttsaudio', express.static(path.join(__dirname, 'ttsaudio')))

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Dialogflow Testing Tool App listening on port ${PORT}`);
    console.log(`ENVIRONMENT ${process.env.ENVIRONMENT}`)
    console.log(`DEFAULT_TARGET ${process.env.DEFAULT_TARGET}`)
    console.log('Press Ctrl+C to quit.');


});