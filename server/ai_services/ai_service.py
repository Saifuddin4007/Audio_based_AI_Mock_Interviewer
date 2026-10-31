from fastapi import (
    FastAPI, 
    HTTPException, 
    Response
)
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel 
from piper import PiperVoice 
import wave                   
import os
import io
import time
from fastapi.responses import JSONResponse

models_ready= False
startup_start = time.perf_counter()

#  Initialize the FastAPI app
app = FastAPI(title="AI Service (TTS)")

origins= ["https://audio-based-ai-mock-interviewer.vercel.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

model_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "en_US-lessac-medium.onnx"
)
config_path = model_path + ".json"

if not os.path.isfile(model_path) or not os.path.isfile(config_path):
    raise RuntimeError("Piper model or config file is missing.")
print("Loading Piper TTS model")
piper_start= time.perf_counter()

tts_voice = PiperVoice.load(model_path, config_path=config_path)

piper_time= time.perf_counter() - piper_start

print(f"Piper TTS model loaded in {piper_time:.2f} seconds")
   
models_ready= True

print(
    f"Total model startup time: "
    f"{time.perf_counter() - startup_start:.2f} seconds"
)
print("AI models are ready") 
    
class TTSRequest(BaseModel):
    text: str
  


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
        

@app.get("/live")
def live():
    return {"status": "ok"}

     

@app.get("/health")
def health():
    if not models_ready:
        return JSONResponse(
            status_code=503,
            content={"status": "starting"}
        )
    
    return {"status": "ok"}

