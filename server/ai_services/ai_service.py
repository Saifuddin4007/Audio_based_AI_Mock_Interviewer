from fastapi import (
    FastAPI, 
    HTTPException, 
    Response,
    UploadFile,
    File,
    Form,
)
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel
from faster_whisper import WhisperModel 
from piper import PiperVoice 
import wave                   
import os
import io
import av
import numpy as np
import json
from fastapi.responses import JSONResponse

models_ready= False

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
   
models_ready= True
print("AI models are ready") 
    
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

def decode_audio_bytes(audio_bytes: bytes) -> np.ndarray:
    """
    Decode uploaded audio bytes into a mono 16 kHz float32 waveform.

    No temporary audio file is created.
    """

    audio_buffer = io.BytesIO(audio_bytes)

    container = av.open(audio_buffer)

    try:
        audio_stream = next(
            stream
            for stream in container.streams
            if stream.type == "audio"
        )

        resampler = av.AudioResampler(
            format="fltp",
            layout="mono",
            rate=16000
        )

        samples = []

        for frame in container.decode(audio_stream):

            resampled_frames = resampler.resample(frame)

            if not isinstance(resampled_frames, list):
                resampled_frames = [resampled_frames]

            for resampled_frame in resampled_frames:

                array = resampled_frame.to_ndarray()

                array = array.reshape(-1)

                samples.append(array)

        # Flush remaining samples from the resampler.
        remaining_frames = resampler.resample(None)

        if remaining_frames:

            if not isinstance(remaining_frames, list):
                remaining_frames = [remaining_frames]

            for remaining_frame in remaining_frames:

                array = remaining_frame.to_ndarray().reshape(-1)

                samples.append(array)

        if not samples:
            raise ValueError("No audio samples could be decoded.")

        waveform = np.concatenate(samples).astype(np.float32)

        return waveform

    finally:
        container.close()



@app.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    interview_type: str = Form(""),
    role: str = Form(""),
    focus_skills: str = Form("[]"),
    question: str = Form("")
):

    try:

        print(f"🎙️ Received audio: {audio.filename}")
        print(f"🎵 MIME type: {audio.content_type}")

        # Read uploaded audio directly into memory.
        audio_bytes = await audio.read()

        print(f"📦 Audio size: {len(audio_bytes)} bytes")

        if not audio_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded audio is empty."
            )

        # Parse focus skills.
        # Node sends this as a JSON string because multipart
        # form fields are strings.

        try:
            parsed_focus_skills = json.loads(focus_skills)

            if not isinstance(parsed_focus_skills, list):
                parsed_focus_skills = []

        except json.JSONDecodeError:
            parsed_focus_skills = []

        # Build interview-specific transcription context.

        context = build_interview_context(
            interview_type=interview_type,
            role=role,
            focus_skills=parsed_focus_skills,
            question=question
        )

        # Decode audio bytes -> NumPy waveform.
        # NO FILE IS CREATED.


        print("🔄 Decoding audio in memory...")

        waveform = decode_audio_bytes(audio_bytes)

        print(
            f"✅ Audio decoded: "
            f"{len(waveform)} samples"
        )

        # Faster-Whisper transcription.

        print("🧠 Running Faster-Whisper...")

        segments, info = stt_model.transcribe(
            waveform,
            language="en",
            beam_size=5,
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": 500
            },
            initial_prompt=context["prompt"],
            hotwords=context["hotwords"]
        )

        # Combine all segments.

        full_text = " ".join(
            segment.text.strip()
            for segment in segments
        ).strip()

        print(
            f"✅ Transcription complete. "
            f"Language: {info.language}"
        )

        print(f"📝 Transcript: {full_text}")

        return {
            "success": True,
            "text": full_text,
            "language": info.language
        }

    except HTTPException:
        raise

    except Exception as e:

        print(f"❌ Transcription error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to transcribe audio."
        )




@app.post("/speak")
async def text_to_speech(request: TTSRequest):
    print("/speak endpoint reached")
    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty."
        )

    try:

        # Create an in-memory WAV file.
        audio_buffer = io.BytesIO()

        with wave.open(audio_buffer, "wb") as wav_file:

            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(
                tts_voice.config.sample_rate
            )

            for chunk in tts_voice.synthesize(
                request.text
            ):
                wav_file.writeframes(
                    chunk.audio_int16_bytes
                )

        # Get WAV bytes directly from memory.
        audio_bytes = audio_buffer.getvalue()

        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition":
                    'inline; filename="question.wav"'
            }
        )

    except Exception as e:

        print(f"TTS error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Speech generation failed."
        )
        
        

@app.get("/health")
def health():
    if not models_ready:
        return JSONResponse(
            status_code=503,
            content={"status": "starting"}
        )
    
    return {"status": "ok"}

