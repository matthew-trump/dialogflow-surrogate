router.post('/audio2a', upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(400).send('No file uploaded.');
        return;
    }
    //console.log(typeof req.file.buffer, req.file.buffer);
    //console.log("FILE",req.file.path,req.file,req.query);


    const sampleRateHertz = parseInt(req.query.sampleRateHertz);
    const encoding = req.query.encoding;
    const languageCode = req.query.languageCode;

    // Create a new blob in the bucket and upload the file data.
    const gcsname = req.file.originalname;
    //const file         = bucket.file(gcsname);
    const path = "samples/" + gcsname;
    const bfile = bucket.file(path);

    const blob = bucket.file(path);
    const blobStream = blob.createWriteStream();

    blobStream.on('error', (err) => {
        res.status(400).json({ speechError: err, uploaded: 0 });
    });

    blobStream.on('finish', () => {
        // The public URL can be used to directly access the file via HTTP.
        //const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
        const gcsUri = format(`gs://${bucket.name}/${path}`);
        const config = {
            encoding: encoding,
            sampleRateHertz: sampleRateHertz,
            languageCode: languageCode,
        };
        const audio = {
            uri: gcsUri,
        };

        const request = {
            config: config,
            audio: audio,
        };
        const client = new speech.SpeechClient();
        // Detects speech in the audio file
        client
            .recognize(request)
            .then(data => {

                //const transcription = response.results
                // .map(result => result.alternatives[0].transcript)
                // .join('\n');

                res.json({ results: data[0].results, uploaded: 0 });
            })
            .catch(err => {

                console.error('ERROR:', err);
                res.status(400).json({ speechError: err, uploaded: 0 });
            })

        //res.status(200).send(publicUrl);
    });

    blobStream.end(req.file.buffer);
});

router.post('/audio2', upload.single('file'), (req, res) => {
    if (!req.file) {
        if (DEBUG_SPEECH) cconsole.log("** audio2 NO FILE");
        res.status(400).send('No file uploaded.');
        return;
    }

    const sampleRateHertz = parseInt(req.query.sampleRateHertz);
    const encoding = req.query.encoding;
    const languageCode = req.query.languageCode;

    const request = {
        config: {
            encoding: encoding,
            sampleRateHertz: sampleRateHertz,
            languageCode: languageCode,
        },
        singleUtterance: true,
        interimResults: false, // If you want interim results, set this to true
    };
    const client = new speech.SpeechClient();
    if (DEBUG_SPEECH) console.log("** RECOGNIZING STREAM")
    const recognizeStream = client
        .streamingRecognize(request)
        .on('error', (err) => {
            if (DEBUG_SPEECH) cconsole.log("** audio2 STREAMING RECOGNIZE ERROR", err);

            res.status(400).json({ speechError: err, uploaded: 0 });
            return;
        })
        .on('data', data => {
            if (DEBUG_SPEECH) console.log("** audio2  STREAMING RECOGNIZE DATA", data);
            if (data.results && data.results.length > 0 && data.results[0].isFinal) {
                res.json({ results: data.results, uploaded: 0 });
                return;
            }
        });

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    bufferStream.pipe(recognizeStream);

});

router.post('/audio', upload.single('file'), (req, res) => {
    console.log("FILE", req.file.path, req.file, req.query);
    const sampleRateHertz = parseInt(req.query.sampleRateHertz);
    console.log("sampleRateHertz", sampleRateHertz);
    const encoding = req.query.encoding;
    const languageCode = req.query.languageCode;

    const originalName = req.file.originalname;
    //const target_path  = 'uploads/' + originalName;
    const gcsname = req.file.originalname;
    //const file         = bucket.file(gcsname);
    const path = "samples/" + gcsname;
    const bfile = bucket.file(path);
    //console.log("BUFFER",req.file);
    //console.log("BUFFER DONE");
    const stream = bfile.createWriteStream({
        metadata: {
            contentType: req.file.mimetype
        },
        resumable: false
    });
    stream.on('error', (err) => {
        //req.file.cloudStorageError = err;
        //next(err);
        console.log(err);
        res.status(500).json({ error: "Unable to save file to bucket: " + req.file.originalname });
        return;
    });

    stream.on('finish', () => {

        console.log("DETERMINING SPEECH");
        const client = new speech.SpeechClient();
        const gcsUri = 'gs://' + BUCKET_NAME + "/" + path;
        console.log(gcsUri);
        //const encoding = 'LINEAR16';
        //const sampleRateHertz = 16000;
        //const languageCode = 'en-US';//'BCP-47 language code, e.g. en-US';

        const config = {
            enableAutomaticPunctuation: true,
            encoding: encoding,
            sampleRateHertz: sampleRateHertz,
            languageCode: languageCode,
            model: "default"
        };
        const audio = {
            uri: gcsUri,
        };

        const request = {
            config: config,
            audio: audio,
            interimResults: false,
            singleUtterance: true
        };

        /**
         * 
         * const recognizeStream = client
            .streamingRecognize(request)
            .on('error', (err)=>{
                res.status(400).json({ url: "https://storage.googleapis.com/"+BUCKET_NAME+"/"+path, speechError: err, uploaded: 1 });
            })
            .on('data', data => {
                console.log(
                `Transcription: ${data.results[0].alternatives[0].transcript}`
                    );
                res.json({ url: "https://storage.googleapis.com/"+BUCKET_NAME+"/"+path, results: data.results, uploaded: 1 });
            });
        fs.createReadStream(filename).pipe(recognizeStream);
     */
        client.recognize(request)
            .then(data => {
                const response = data[0];
                const transcription = response.results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n');
                console.log(`Transcription: `, transcription);
                res.json({ url: "https://storage.googleapis.com/" + BUCKET_NAME + "/" + path, results: response.results, uploaded: 1 });
                return;
            })
            .catch(err => {
                res.status(400).json({ url: "https://storage.googleapis.com/" + BUCKET_NAME + "/" + path, speechError: err, uploaded: 1 });
            });


        //req.file.cloudStorageObject = gcsname;
        /**
        bfile.makePublic().then(() => {
        req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
        next();
        });
         */
    });

    fs.readFile(req.file.path, (err, data) => {
        if (!err) {
            console.log("STREAMING FILE TO BUCKET");
            stream.end(data);
        } else {
            res.status(500).json({ error: "Unable to read tmp file: " + req.file.path });
            return;
        }

    });


    /**
    bfile.save(req.file.path, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        metadata: {
          // Enable long-lived HTTP caching headers
          // Use only if the contents of the file will never change
          // (If the contents will change, use cacheControl: 'no-cache')
          cacheControl: 'public, max-age=31536000',
        },
      }).catch(err=>{
          console.log("UPLOAD ERROR",err);
          res.status(500).json({error: "Unable to save file to bucket: "+req.file.originalname});
          return;
      }).then((result)=>{
          console.log(result);
          res.json({ uploaded: 1 });
          return;
      });
     */
    /**
  const readStream   = fs.createReadStream(req.file.path);

  //const hash     = crypto.createHash('md5').update(JSON.stringify(request)).digest('hex');
  //const filename = hash+".mp3";
  const path         = "samples/"+originalFilename;
  const bfile        = bucket.file(path);
  const url          = "https://storage.googleapis.com/"+BUCKET_NAME+"/"+path;
  
  bfile.save(response.audioContent, function(err) {
      if (!err) {
          console.log('Audio sample written to BUCKET: '+"."+path);
          res.json({url : url, created: 1 });
          return;
      }else{
          res.status(500).json({error: "Unable to save file to bucket: "+path});
          return;
      }
  }); 
   */
    /** 
    const dest = fs.createWriteStream(target_path);
    src.pipe(dest);
    src.on('end', function() {  res.json({ originalname: req.file.originalname }); });
    src.on('error', function(err) {  res.status(400).json({ error: 1 }); });
    **/

});

router.post('/tts', function (req, res) {
    generateTTSAudioFile(req, res);
});


generateTTSAudioFile = function (req, res) {
    const request = req.body.request;



    // The text to synthesize


    // Construct the request
    /**
    const request = {
        input: {ssml: text},
        // Select the language and SSML Voice Gender (optional)
        voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
        // Select the type of audio encoding
        audioConfig: {audioEncoding: 'MP3'},
    };
    */

    const hash = crypto.createHash('md5').update(JSON.stringify(request)).digest('hex');
    const filename = hash + ".mp3";
    const path = "ttsaudio/" + filename;
    const bfile = bucket.file(path);
    const url = "https://storage.googleapis.com/" + BUCKET_NAME + "/" + path;

    bfile.exists((err, exists) => {
        if (err) {
            console.error('ERROR:', err);
            res.status(400).json({ error: "Error checking if file " + path + " exists in bucket " + err });
            return;
        } else if (exists) {
            console.log("BUCKET FILE EXISTS ", path);
            res.json({ url: url, created: 0 });
            return;
        } else {
            const client = new textToSpeech.TextToSpeechClient();
            // Performs the Text-to-Speech request
            client.synthesizeSpeech(request, (err, response) => {
                if (err) {
                    console.error('ERROR 1:', err);
                    res.status(400).json({ error: "Google Cloud unable to synthesize speech from SSML" });
                    return;
                }
                // Write the binary audio content to a local file

                console.log("SYNTHESIZED SPEECH SUCCESSFULLY");
                bfile.save(response.audioContent, function (err) {
                    if (!err) {
                        console.log('Audio content written to BUCKET: ' + "." + path);
                        res.json({ url: url, created: 1 });
                        return;
                    } else {
                        res.status(500).json({ error: "Unable to save file to bucket: " + path });
                        return;
                    }
                });
                /**
    
            fs.writeFile("."+path, response.audioContent, 'binary', err => {
                 if (err) {
                        console.error('ERROR:', err);
                        res.json({ error  : "Unable to write file"});
                }
                console.log('Audio content written to file: '+"."+path);
                //res.json({path : path});
            });
             */
            })
        }

    });


    console.log("CREATING NEW TTS AUDIO");
    ;
}


/**
const ssml = "<speak>Moving on to Question 2. <break time='1000ms'/> Which of these rivers crosses the Painted Desert? <break time='800ms'/> your choices are <break time='500ms'/> Gila,<break time='400ms'/>Verde,<break time='400ms'/>or Little Colorado</speak>";
getTTSAudioFile({ body: { request : {
    input: {ssml: ssml},
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
    audioConfig: {audioEncoding: 'MP3'},
}}},{ send: (audioContent)=>{
    console.log("SENT AUDIO CONTENT");
}});
 */