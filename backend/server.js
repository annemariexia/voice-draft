require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const app = express();
const port = 3000;

// Configure multer for handling file uploads
const upload = multer();

app.use(cors());

app.use(express.json());


app.get("/", (req, res) => {
  res.send("Server is running");
});

// Transcribe audio using OpenAI API 
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    // OpenAI transcription API requires a FormData object
    const form = new FormData();
    form.append('file', Buffer.from(req.file.buffer), {
      filename: req.file.originalname,
      contentType: req.file.mimetype, // MIME type must be in [mp3, mp4, mpeg, mpga, m4a, wav, and webm]
    });
    form.append('model', 'whisper-1');
    form.append('response_format', 'text');


    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",  // takes in a multipart/form-data object
      form,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
      }
    );
    if (response.status === 200) {
      res.json({ message: "Audio received successfully", transcription: response.data });
    } else {
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  } catch (error) {
    console.error("Error transcribing audio:", error);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code outside 2xx
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 429) {
        // Rate limit exceeded
        const retryAfter = error.response.headers['retry-after'];
        const errorMessage = errorData?.error?.message || "Rate limit exceeded";
        console.error("Rate limit details:", {
          message: errorMessage,
          retryAfter: retryAfter,
          headers: error.response.headers
        });
        return res.status(429).json({ 
          error: errorMessage || "Rate limit exceeded. Please wait a moment before trying again.",
          retryAfter: retryAfter ? parseInt(retryAfter) : null
        });
      } else if (status === 401) {
        // Unauthorized - API key issue
        return res.status(401).json({ 
          error: "Invalid API key. Please check your OpenAI API key in the .env file." 
        });
      } else if (status === 400) {
        // Bad request
        return res.status(400).json({ 
          error: errorData?.error?.message || "Invalid request. Please check your audio file format." 
        });
      } else {
        // Other server errors
        return res.status(status).json({ 
          error: errorData?.error?.message || `OpenAI API error: ${status}` 
        });
      }
    } else if (error.request) {
      // The request was made but no response was received
      return res.status(503).json({ 
        error: "Unable to reach OpenAI API. Please check your internet connection." 
      });
    } else {
      // Something happened in setting up the request
      return res.status(500).json({ 
        error: "Failed to transcribe audio. Please try again." 
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
