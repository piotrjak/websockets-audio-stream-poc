# websockets-audio-stream-poc

### Setting up a dev environment
1. `npm install`
2. `cp .env.example .env`
3. Copy `service-account.json` into the main directory (`/`) of the project
3. Fill `GOOGLE_PROJECT_ID` env with `project_id` value from `service-account.json`
4. Fill `GOOGLE_APPLICATION_CREDENTIAL` env with the absolute path of `service-account.json` file e.g. `/Users/YOUR_USERNAME/Projects/websockets-audio-stream-poc/service-account.json` on macOS
5. `npm start` to start the app
6. Go to `localhost:3000` in the browser

### Sending binary audio data from other sources
1. Initiate starting of the stream by emitting `startGoogleCloudStream` event
2. Send the binary raw audio data encoded in LPCM16 with frequency range 16kHz by emitting `binaryData` event
3. Get the transcripted text by listening to `speechData` event on your side
4. Stop the stream by emitting `endGoogleCloudStream`.
