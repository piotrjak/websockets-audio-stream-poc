require('dotenv').config();
const path = require('path');
const fs = require('fs');
const http = require('http');
const record = require('node-record-lpcm16');
const speech = require('@google-cloud/speech');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../www/index.html'));
});

const speechClient = new speech.SpeechClient({
  projectId: process.env.GOOGLE_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIAL,
});

io.on('connection', socket => {
  console.log('a user connected');
  let recognizeStream = null;

  socket.on('chat message', function(msg) {
    io.emit('chat message', msg);
    console.log('message: ' + msg);
  });

  socket.on('startGoogleCloudStream', function(data) {
    startRecognitionStream(this, data);
  });

  socket.on('endGoogleCloudStream', function(data) {
    stopRecognitionStream();
  });

  socket.on('binaryData', data => {
    if (recognizeStream !== null) {
      recognizeStream.write(data);
    }
    console.log(`data ${data}`);
  });

  socket.on('disconnect', () => console.log('user disconnected'));

  function startRecognitionStream(client, data) {
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    };

    const request = {
      config,
      interimResults: false, // If you want interim results, set this to true
    };

    recognizeStream = speechClient
      .streamingRecognize(request)
      .on('error', console.error)
      .on('data', data => {
        process.stdout.write(
          data.results[0] && data.results[0].alternatives[0]
            ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
            : `\n\nReached transcription time limit, press Ctrl+C\n`,
        );
        client.emit('speechData', data.results[0].alternatives[0].transcript);

        // if end of utterance, let's restart stream
        // this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
        if (data.results[0] && data.results[0].isFinal) {
          stopRecognitionStream();
          startRecognitionStream(client);
          // console.log('restarted stream serverside');
        }
      });
  }

  function stopRecognitionStream() {
    if (recognizeStream) {
      recognizeStream.end();
    }
    recognizeStream = null;
  }
});

server.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});

async function sttFromFileStream() {
  const client = new speech.SpeechClient({
    projectId: process.env.GOOGLE_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIAL,
  });

  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };

  const request = {
    config,
    interimResults: false, // If you want interim results, set this to true
  };

  // Stream the audio to the Google Cloud Speech API
  const recognizeStream = client
    .streamingRecognize(request)
    .on('error', console.error)
    .on('data', data => {
      console.log(`Transcription: ${data.results[0].alternatives[0].transcript}`);
    });

  const fileName = './resources/audio.raw';
  // Stream an audio file from disk to the Speech API, e.g. "./resources/audio.raw"
  fs.createReadStream(fileName).pipe(recognizeStream);
}

async function sttFromMicrophoneStream() {
  const client = new speech.SpeechClient({
    projectId: process.env.GOOGLE_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIAL,
  });

  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };

  const request = {
    config,
    interimResults: false, // If you want interim results, set this to true
  };

  // Create a recognize stream
  const recognizeStream = client
    .streamingRecognize(request)
    .on('error', console.error)
    .on('data', data =>
      process.stdout.write(
        data.results[0] && data.results[0].alternatives[0]
          ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
          : `\n\nReached transcription time limit, press Ctrl+C\n`,
      ),
    );

  // Start recording and send the microphone input to the Speech API
  record
    .start({
      sampleRateHertz: config.sampleRateHertz,
      threshold: 0,
      // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
      verbose: false,
      recordProgram: 'rec', // Try also "arecord" or "sox"
      silence: '10.0',
    })
    .on('error', console.error)
    .pipe(recognizeStream);

  console.log('Listening, press Ctrl+C to stop.');
}

async function sttFromFile() {
  // Creates a client
  const client = new speech.SpeechClient({
    projectId: process.env.GOOGLE_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIAL,
  });

  // The name of the audio file to transcribe
  const fileName = './resources/audio.raw';

  // Reads a local audio file and converts it to base64
  const file = fs.readFileSync(fileName);
  const audioBytes = file.toString('base64');

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    content: audioBytes,
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech in the audio file
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  console.log(`Transcription: ${transcription}`);
}

// sttFromMicrophoneStream().catch(console.error);
