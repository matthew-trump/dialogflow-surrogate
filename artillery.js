const express = require("express");
const router = express.Router();
const stream = require('stream');
const crypto = require('crypto');
const format = require('util').format;

const { Storage } = require('@google-cloud/storage');
const dialogflow = require("./dialogflow");

const GOOGLE_STORAGE_BUCKET_NAME = process.env.GOOGLE_STORAGE_BUCKET_NAME;

const storage = new Storage();
const bucket = storage.bucket(GOOGLE_STORAGE_BUCKET_NAME);

const YML_PATH = process.env.GOOGLE_STORAGE_BUCKET_YML_PATH || "yml";

const getBucketUrl = (path) => {
    return "https://storage.googleapis.com/" + GOOGLE_STORAGE_BUCKET_NAME + "/" + path;
}

router.post('/yml/:projectId/:id', function (req, res) {
    const projectId = req.params.projectId;
    const conversationId = req.params.conversationId;
    const postYml = dialogflow.getConversationYml(projectId, conversationId);
    const text = postYml.join("\n");
    const path = YML_PATH + "/" + projectId + "/" + conversationId + ".yml";
    const url = getBucketUrl(filepath);
    const bfile = bucket.file(path);
    bfile.save(response.audioContent, function (err) {
        if (!err) {
            console.log('Yml content written to BUCKET: ' + "." + path);
            res.json({ url: url, created: 1 });
            return;
        } else {
            res.status(500).json({ error: "Unable to save file to bucket: " + path });
            return;
        }
    });
});

module.exports = router;

