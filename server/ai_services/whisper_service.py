from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from faster_whisper import WhisperModel
import os

# 1. Initialize the FastAPI app
app = FastAPI(title="Whisper STT Service")

# 2. Load the Whisper model ONCE when the server starts
# This prevents reloading the heavy model on every single request
print("⏳ Loading Whisper model... (this may take a minute the first time)")
model = WhisperModel("base.en", device="cpu", compute_type="int8")
print("✅ Model loaded successfully!")

# 3. Define the expected JSON structure from Node.js
class TranscribeRequest(BaseModel):
    file_path: str

# 4. Create the transcription endpoint
@app.post("/transcribe")
async def transcribe_audio(request: TranscribeRequest):
    # Check if the file actually exists
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail=f"File not found at: {request.file_path}")
    
    try:
        print(f"🎙️ Transcribing: {request.file_path}")
        
        # Run the transcription (beam_size=5 improves accuracy)
        segments, info = model.transcribe(request.file_path, beam_size=5)
        
        # Combine all text segments into one clean string
        full_text = " ".join([segment.text for segment in segments])
        
        print(f"✅ Transcription complete. Language: {info.language}")
        
        return {
            "success": True,
            "text": full_text.strip(),
            "language": info.language
        }
        
    except Exception as e:
        print(f"❌ Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))