let mediaRecorder;
let chunks = [];
let isRecording = false;

document.getElementById("start-recording").addEventListener("click", async () => {
  try {
    // Get the active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url;

    // Check if the active tab is Gmail
    if (!url?.includes("mail.google.com")) {
      console.error("Extension not allowed on this page");
      return;
    }

    if (!isRecording) {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Initialize MediaRecorder
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.addEventListener("dataavailable", (event) => {
          chunks.push(event.data);
        });

        mediaRecorder.start();
        isRecording = true;
        document.getElementById("start-recording").textContent = "Stop Recording";

        mediaRecorder.addEventListener("stop", async () => {
          await processAudio(tab.id);
        });
      } catch (audioError) {
        console.error("Error accessing microphone:", audioError);
        
        // Provide user-friendly error messages
        let errorMessage = "Failed to access microphone. ";
        const errorName = audioError?.name || "";
        const errorMsg = audioError?.message || "";
        
        if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
          errorMessage += "Please allow microphone access:\n\n1. When you click 'Start Recording', Chrome should show a permission prompt - click 'Allow'\n2. If no prompt appears, go to chrome://settings/content/microphone and ensure this extension is allowed\n3. You may need to reload the extension (chrome://extensions) after granting permission\n4. Then try clicking 'Start Recording' again";
        } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
          errorMessage += "No microphone found. Please connect a microphone and try again.";
        } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
          errorMessage += "Microphone is already in use by another application.";
        } else if (errorName === "OverconstrainedError") {
          errorMessage += "Microphone constraints cannot be satisfied.";
        } else if (errorMsg) {
          errorMessage += errorMsg;
        } else {
          errorMessage += "Please check your microphone permissions and try again.";
        }
        
        alert(errorMessage);
        isRecording = false;
        document.getElementById("start-recording").textContent = "Start Recording";
      }
    } else {
      stopRecording();
    }
  } catch (error) {
    console.error("Error accessing tab:", error);
  }
});

async function processAudio(tabId) {
  try {
    const audioBlob = new Blob(chunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");

    const response = await fetch("http://localhost:3000/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = "Failed to transcribe audio";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      // Show user-friendly error messages
      if (response.status === 429) {
        alert("Rate limit exceeded. Please wait a moment before trying again.");
      } else if (response.status === 401) {
        alert("API key error. Please check your OpenAI API key configuration.");
      } else if (response.status === 503) {
        alert("Unable to reach the transcription service. Please check your internet connection and ensure the backend server is running.");
      } else {
        alert(`Error: ${errorMessage}`);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    insertTranscriptionToEmail(tabId, data.transcription);
    
    chunks = []; // Clear chunks after processing
  } catch (error) {
    console.error("Error processing audio:", error);
  }
}

async function insertTranscriptionToEmail(tabId, transcription) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (transcription) => {
        const emailBody = document.querySelector('div[role="textbox"][aria-label="Message Body"]');
        if (emailBody) emailBody.innerHTML = transcription;
      },
      args: [transcription],
    });
  } catch (error) {
    console.error("Error inserting transcription into email:", error);
  }
}

function stopRecording() {
  if (mediaRecorder?.state === "recording") {
    isRecording = false;
    document.getElementById("start-recording").textContent = "Start Recording";
    
    mediaRecorder.requestData();
    mediaRecorder.stop();
  }
}
