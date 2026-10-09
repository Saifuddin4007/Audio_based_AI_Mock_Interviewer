from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware # 👈 FIX 2: Added missing import
from pydantic import BaseModel, Field
from faster_whisper import WhisperModel # 👈 FIX 1: Removed the accidental "from" at the end
from piper import PiperVoice 
import wave                   
import os
import tempfile

#  Initialize the FastAPI app
app = FastAPI(title="Local AI Service (STT & TTS)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Whisper model ONCE when the server starts
# This prevents reloading the heavy model on every single request
#  1. STT: Load Whisper Model (Runs once at startup)
print("⏳ Loading Whisper model... (this may take a minute the first time)")
stt_model = WhisperModel("base.en", device="cpu", compute_type="int8")
print("✅ Model loaded successfully!")



# 2. TTS: Load Piper Voice Model (Runs once at startup)
print("Loading Piper TTS model...")

model_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "en_US-lessac-medium.onnx"
)
config_path = model_path + ".json"

if not os.path.isfile(model_path) or not os.path.isfile(config_path):
    raise RuntimeError("Piper model or config file is missing.")

tts_voice = PiperVoice.load(model_path, config_path=config_path)

print("Piper TTS model loaded successfully!")

# 3. ENDPOINTS

#  Define the expected JSON structure from Node.js
class TranscribeRequest(BaseModel):
    file_path: str
    interview_type: str= ""
    role: str= ""
    focus_skills: list[str]= Field(default_factory=list)
    question: str= ""
    
    
class TTSRequest(BaseModel):
    text: str
  


INTERVIEW_TYPE_TERMS = {
    "Technical": [
        "API", "REST", "HTTP", "backend", "frontend",
        "database", "authentication", "authorization",
        "middleware", "deployment", "Git", "Docker"
    ],
    "Behavioral": [
        "teamwork", "leadership", "communication",
        "conflict", "deadline", "responsibility",
        "challenge", "achievement", "collaboration"
    ],
    "HR": [
        "salary", "compensation", "relocation",
        "notice period", "availability", "career goals",
        "strengths", "weaknesses", "expectations"
    ]
}


def build_interview_context(
    interview_type: str,
    role: str,
    focus_skills: list[str],
    question: str
):
    interview_type = interview_type.strip()

    if interview_type not in INTERVIEW_TYPE_TERMS:
        raise HTTPException(
            status_code=400,
            detail= "Unsupported Audio Interview Type. Choose from: Technical, Behavioral, HR"
        )

    focus_skills = [
        skill.strip()
        for skill in focus_skills
        if isinstance(skill, str) and skill.strip()
    ]

    role = role.strip()
    question = question.strip()

    terms = (
        INTERVIEW_TYPE_TERMS[interview_type]
        + ([role] if role else [])
        + focus_skills
    )

    # Remove duplicate terms while preserving their order.
    terms = list(dict.fromkeys(terms))

    prompt = f"""
This is an English-language {interview_type} job interview.
The role is {role or "unspecified"}.
Relevant skills include: {", ".join(focus_skills) or "unspecified"}.
The question being answered is: {question or "unspecified"}.

Transcribe the candidate's actual speech accurately.
Preserve spoken names, abbreviations, and domain-specific
terms. Do not rewrite or improve the candidate's grammar.
"""

    return {
        "prompt": prompt,
        "hotwords": ", ".join(terms)
    } 



# Create the transcription endpoint
@app.post("/transcribe")
async def transcribe_audio(request: TranscribeRequest):
    # Check if the file actually exists
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail=f"File not found at: {request.file_path}")
    
    try:
        print(f"🎙️ Transcribing: {request.file_path}")
        
        context= build_interview_context(
            interview_type= request.interview_type,
            role=request.role,
            focus_skills=request.focus_skills,
            question=request.question
        )
        
        # Run the transcription (beam_size=5 improves accuracy)
        segments, info = stt_model.transcribe(
            request.file_path,
            language="en", 
            beam_size=5,
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": 500
            },
            initial_prompt= context["prompt"],
            hotwords= context["hotwords"]
            )
        
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
    
    


@app.post("/speak")
async def text_to_speech(request: TTSRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    temp_path = None

    try:
        # Create a temporary WAV file.
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp:
            temp_path = temp.name

        with wave.open(temp_path, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(tts_voice.config.sample_rate)

            for chunk in tts_voice.synthesize(request.text):
                wav_file.writeframes(chunk.audio_int16_bytes)

        # Read the completed WAV file into memory.
        with open(temp_path, "rb") as audio_file:
            audio_bytes = audio_file.read()

        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": 'inline; filename="question.wav"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"TTS error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Speech generation failed."
        )

    finally:
        # Remove the temporary file even if generation or reading fails.
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)