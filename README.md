# Gmail Voice-to-Text Extension

## Overview
This project is a Chrome extension that allows users to record their voice and transcribe it into text using OpenAI's Whisper API. The transcribed text is then automatically inserted into the Gmail compose message body.

## Features
- Start and stop voice recording directly from Gmail.
- Transcribe recorded audio into text using OpenAI Whisper.
- Automatically insert transcriptions into Gmail's email body.

## Technologies Used
- JavaScript (Chrome Extension & Frontend)
- Node.js & Express (Backend)
- OpenAI Whisper API (Speech-to-Text)
- Multer (File Handling)
- Axios (API Requests)
- CORS (Cross-Origin Requests Handling)

## Installation
### 1. Clone the repository
```sh
git clone https://github.com/annemariexia/voice-draft.git
```

### 2. Setup the backend
#### Prerequisites:
- Node.js installed
- OpenAI API key (set up in `.env` file)

#### Steps:
1. Navigate to the `backend` directory:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and add your OpenAI API key:
   ```sh
   OPENAI_API_KEY=your_openai_api_key_here
   ```
4. Start the server:
   ```sh
   npm run dev
   ```
   The server will run on `http://localhost:3000`.

### 3. Setup the Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer Mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the directory.
4. The extension should now be installed and ready to use.

## Usage
1. Open Gmail (`mail.google.com`).
2. Click the **Start Recording** button to begin recording.
3. Click **Stop Recording** to send the audio for transcription.
4. The transcribed text will automatically appear in the email body.

## API Endpoints
### `POST /transcribe`
- **Description:** Accepts an audio file and returns the transcribed text.
- **Request:**
  - Multipart/form-data with an `audio` file.
- **Response:**
  ```json
  {
    "message": "Audio received successfully",
    "transcription": "Hello, this is a test."
  }
  ```


