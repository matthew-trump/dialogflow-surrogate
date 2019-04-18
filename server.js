const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const api = require('./api');
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

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Dialogflow Webhook Tester App listening on port ${PORT}`);
    console.log(`ENVIRONMENT ${process.env.ENVIRONMENT}`)
    console.log(`DEFAULT_TARGET ${process.env.DEFAULT_TARGET}`)
    console.log('Press Ctrl+C to quit.');


});