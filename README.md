# websockets-audio-stream-poc

### Setting up a dev environment
1. `npm install`
2. `cp .env.example .env`
3. Copy `service-account.json` into the main directory (`/`) of the project
3. Fill `GOOGLE_PROJECT_ID` env with `project_id` value from `service-account.json`
4. Fill `GOOGLE_APPLICATION_CREDENTIAL` env with the absolute path of `service-account.json` file e.g. `/Users/YOUR_USERNAME/Projects/websockets-audio-stream-poc/service-account.json` on macOS
5. `npm start` to start the app
6. Go to `localhost:3000` in the browser
