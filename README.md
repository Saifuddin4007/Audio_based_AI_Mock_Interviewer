# 🎙️ Audio-Based AI Mock Interviewer

An AI-powered mock interview platform that lets candidates practice interviews through realistic question-and-answer sessions.

The application combines React, Node.js/Express, MongoDB, Redis, Groq, Python/FastAPI, Piper TTS, and Cloudinary to create an end-to-end interview workflow with authentication, AI-generated questions, speech-to-text transcription, text-to-speech questions, conversation memory, session tracking, and result evaluation.

> **Project status: Deployed MVP**

> The project is intentionally being developed incrementally. Testing, refinements, and additional improvements can be added without changing the core architecture.

---

## ✨ What It Does

The application allows a candidate to:

- Create an account and log in securely.

- Configure a mock interview.

- Choose an interview role.

- Specify experience level.

- Select relevant skills.

- Choose interview difficulty.

- Choose an interview type.

- Start an AI-generated interview session.

- Listen to interview questions as audio where supported.

- Record and submit spoken answers.

- Convert spoken answers into text using Groq STT.

- Continue the interview using the previous conversation as context.

- Store interview questions and answers in MongoDB.

- Store conversation history in Redis.

- Temporarily store candidate audio in Cloudinary.

- Evaluate the completed interview.

- View the resulting interview data through the application.

The application supports both audio-based and text-based interview flows depending on the interview type.

---

## 🧠 Interview Modes

The application does not force every interview type into an audio workflow.

### Audio-based interviews

The following interview types support spoken answers:

- Technical

- Behavioral

- HR

For these interviews:

```text

AI Question

    ↓

Text + Audio

    ↓

Candidate speaks

    ↓

Audio upload

    ↓

Speech-to-text

    ↓

Candidate answer

    ↓

AI evaluates / generates next question

```

### Text-based interviews

The following interview types are handled without spoken answers:

- DSA

- Coding

- System Design

This separation keeps the audio pipeline limited to interview types where spoken responses make sense.

---

## 🏗️ High-Level Architecture

The project is divided into three main application layers:

```text

                         ┌──────────────────────┐

                         │      React App       │

                         │       Vercel         │

                         └──────────┬───────────┘

                                    │

                                    │ HTTPS

                                    ▼

                         ┌──────────────────────┐

                         │   Node + Express     │

                         │       Backend        │

                         │       Render         │

                         └───────┬───────┬──────┘

                                 │       │

                    ┌────────────┘       └──────────────┐

                    │                                   │

                    ▼                                   ▼

             ┌─────────────┐                    ┌──────────────┐

             │  MongoDB    │                    │    Redis     │

             │   Atlas     │                    │   Upstash    │

             └─────────────┘                    └──────────────┘

                    │

                    │

                    ├──────────────► Cloudinary

                    │                Candidate audio

                    │

                    ▼

             ┌──────────────────────┐

             │     Groq APIs        │

             │                      │

             │  • LLM               │

             │  • Speech-to-Text    │

             └──────────────────────┘

                         Node Backend

                              │

                              │ HTTP

                              ▼

                   ┌─────────────────────┐

                   │   Python FastAPI    │

                   │       Render        │

                   │                     │

                   │      Piper TTS      │

                   └─────────────────────┘

```

---

## 🔧 Technology Stack

### Frontend

- React

- TypeScript

- Vite

The frontend handles:

- Authentication UI

- Interview configuration

- Interview session UI

- Audio recording

- Audio playback

- Session navigation

- Result presentation

The frontend is deployed on Vercel.

### Backend

- Node.js

- Express.js

- Mongoose

- JavaScript

- Axios

- JWT

The Node/Express server acts as the main application backend.

It is responsible for:

- Authentication

- Authorization

- Interview session management

- Database access

- Redis conversation memory

- Candidate audio processing

- Groq STT communication

- AI question generation

- Interview evaluation

- Communication with the FastAPI TTS service

The backend is deployed on Render.

### Database

**MongoDB Atlas**

MongoDB stores persistent application data.

The main data model is based around:

```text

User

Session

Result

RefreshToken

```

Interview questions and answers are embedded inside the interview session rather than requiring a separate question collection for the MVP.

### Redis

Upstash Redis is used for conversation memory.

MongoDB stores the persistent interview session.

Redis stores the conversational context used while the AI interview is running.

Conceptually:

```text

MongoDB

   │

   ├── User

   ├── Session

   ├── Questions

   ├── Answers

   └── Results

Redis

   │

   └── Conversation history

```

This keeps short-lived conversational context separate from persistent session data.

### AI / LLM

**Groq**

Groq is used for two different AI workloads:

1. Large Language Model

2. Speech-to-Text

The LLM is integrated through LangChain + Groq.

Groq's speech transcription API is used through the `groq-sdk`.

The project currently uses:

```text

whisper-large-v3-turbo

```

for speech-to-text.

### TTS

**Piper**

Piper is used for text-to-speech generation.

Piper runs inside the separate Python service.

The current AI service architecture deliberately keeps Python focused on TTS:

```text

FastAPI

   ↓

Piper

   ↓

WAV audio

```

The Python service is not responsible for STT anymore. Speech recognition is handled by Groq from the Node backend.

### Python Service

- Python

- FastAPI

- Uvicorn

- Piper TTS

The service exposes:

```text

GET  /live

GET  /health

POST /speak

```

#### `/live`

Used as a lightweight liveness endpoint.

```json

{

  "status": "ok"

}

```

#### `/health`

Used as a readiness endpoint.

It verifies that the FastAPI service and Piper model are ready.

```json

{

  "status": "ok"

}

```

#### `/speak`

Accepts text:

```json

{

  "text": "Tell me about your experience with Node.js and MongoDB."

}

```

and returns:

```text

audio/wav

```

The Node backend receives this WAV data as a binary buffer.

---

## 🔐 Authentication

Authentication uses an access-token + refresh-token architecture.

### Access token

The access token is short-lived and expires after approximately 15 minutes.

It is sent with authenticated API requests.

### Refresh token

The refresh token:

- Is stored using an HttpOnly cookie.

- Is stored hashed in the database.

- Uses refresh-token rotation.

- Can be revoked.

- Is used to obtain a new access token.

The refresh-token flow is conceptually:

```text

Login

  ↓

Access Token + Refresh Token

  ↓

Access Token expires

  ↓

Refresh endpoint

  ↓

Validate refresh token

  ↓

Rotate refresh token

  ↓

Issue new access token

```

Logout revokes the refresh-token record and clears the cookie.

The backend authorization middleware identifies the authenticated user from the access token.

---

## 👤 User Data

The user model contains account-related information such as:

- Email

- Password hash

- Account creation timestamp

- Last login timestamp

Passwords are not returned through normal authenticated user responses.

---

## 📝 Interview Session Model

The interview configuration is stored inside the `Session` document.

The session stores values such as:

```text

role

experienceYears

focusSkills

difficulty

interviewType

status

questions

currentQuestion

totalQuestions

completedAt

```

The five interview configuration values are saved when the session is created:

```text

Role

Experience

Focus skills

Difficulty

Interview type

```

Therefore, `startInterview` does not need to receive the complete interview configuration again.

It only needs the `sessionId`.

The session can then be loaded from MongoDB and used throughout the interview.

---

## 🎯 Interview Session Lifecycle

The basic session lifecycle is:

```text

Create Session

      ↓

Start Interview

      ↓

Generate First Question

      ↓

Generate Question Audio

      ↓

Candidate Answers

      ↓

Transcribe Answer

      ↓

Store Answer

      ↓

Update Conversation Memory

      ↓

Generate Next Question

      ↓

Repeat

      ↓

Evaluate Completed Session

      ↓

Store / Return Result

```

---

## 🔊 Audio Interview Pipeline

The audio pipeline is the most important part of the application.

```text

Candidate

   │

   │ records answer

   ▼

Browser Audio

   │

   │ multipart/form-data

   ▼

Node + Express

   │

   ├──────────────► Cloudinary

   │                 temporary audio storage

   │

   ▼

Groq STT

   │

   │ transcript

   ▼

Node Backend

   │

   ├──────────────► MongoDB

   │                 save answer

   │

   ├──────────────► Redis

   │                 save conversation turn

   │

   ▼

Groq LLM

   │

   │ next question

   ▼

Node Backend

   │

   ▼

FastAPI

   │

   ▼

Piper TTS

   │

   │ WAV

   ▼

Node Backend

   │

   │ Base64 encoded audio

   ▼

React Frontend

   │

   ▼

Candidate hears question

```

---

## 🎤 Candidate Answer Pipeline

When a candidate submits a spoken answer, the Node backend performs the following sequence.

### 1. Receive audio

Multer processes the uploaded audio.

The audio is initially available in memory as a buffer.

### 2. Validate the request

The backend validates:

- Uploaded file exists.

- Session ID exists.

- Session ID is a valid MongoDB ObjectId.

- Session exists.

- Session belongs to the authenticated user.

- Session is still `in_progress`.

- Interview type supports audio.

- A current interview question exists.

### 3. Upload audio

The candidate's audio is uploaded to Cloudinary.

The backend receives:

```text

secure_url

public_id

```

The public ID is retained so the temporary recording can later be deleted.

### 4. Transcribe using Groq

The same audio buffer is sent to Groq's speech-to-text API.

The transcription service provides interview context such as:

- Interview type

- Role

- Focus skills

- Current question

The goal is to preserve what the candidate actually said rather than rewriting the answer.

### 5. Validate transcription

If Groq returns an empty transcript, the backend treats it as:

```text

No speech detected

```

and returns:

```text

400 Bad Request

```

The associated temporary Cloudinary audio is cleaned up when appropriate.

### 6. Save the answer

The transcript and audio metadata are attached to the current question:

```text

transcript

answeredAt

audioURL

audioPublicId

```

### 7. Update session state

The current question counter is advanced.

### 8. Generate the next question

The previous conversation history and candidate answer are supplied to the interview-generation pipeline.

### 9. Save conversation memory

The candidate's answer and the generated question are saved into Redis conversation memory.

### 10. Generate question audio

The generated question is sent to:

```text

Node

  ↓

FastAPI /speak

  ↓

Piper

  ↓

WAV

```

### 11. Return to frontend

Node converts the WAV buffer into Base64 and returns it to the frontend along with:

```text

question

questionNumber

audio

audioMimeType

```

The frontend can then play the question.

---

## 🧠 Conversation Memory

Redis is used to maintain the interview conversation.

A simplified conversation looks like:

```text

AI:

"Explain how middleware works in Express."

Candidate:

"Middleware functions execute sequentially..."

AI:

"How would you handle errors globally in Express?"

```

The conversation history allows the AI to generate questions that are related to the ongoing interview instead of treating every question as an isolated request.

---

## 🤖 AI Question Generation

The AI question-generation pipeline uses:

```text

Session configuration

        +

Candidate answer

        +

Conversation history

        ↓

LangChain

        ↓

Groq LLM

        ↓

Next interview question

```

The saved session configuration gives the model the interview context.

For example:

```text

Role: Backend Developer

Experience: Fresher

Focus skills: Node.js, Express, MongoDB

Difficulty: Medium

Interview type: Technical

```

The candidate's previous answers and Redis conversation history provide additional context.

---

## 📊 Interview Evaluation

When the candidate completes the configured number of questions:

```text

Last answer

   ↓

evaluateSession()

   ↓

AI evaluation

   ↓

Result

```

The session is then marked as:

```text

completed

```

and a completion timestamp is stored.

The application also clears the Redis conversation memory for that completed session.

---

## ☁️ Temporary Audio Storage

Candidate audio is stored temporarily in Cloudinary.

The purpose is not to make Cloudinary the primary interview database.

Instead:

```text

Candidate audio

      ↓

Cloudinary

      ↓

temporary reference

      ↓

interview processing

      ↓

session completion

      ↓

delete temporary recordings

```

The MongoDB session temporarily stores the Cloudinary URL/public ID associated with the answer.

After the interview is completed, the application attempts to delete the associated Cloudinary audio files.

This keeps the MVP from permanently accumulating candidate recordings.

---

## 🧹 Audio Cleanup

The backend tracks Cloudinary public IDs so that uploaded recordings can be deleted.

When the interview finishes:

```text

Session questions

      ↓

collect audioPublicId values

      ↓

delete Cloudinary recordings

      ↓

remove audioURL/audioPublicId references

      ↓

save session

```

Deletion uses `Promise.allSettled()` so that one failed deletion does not prevent the application from attempting to delete the remaining recordings.

---

## 🔄 Production Cold-Start Handling

The project is deployed using Render services, so cold starts are an important part of the architecture.

The frontend first wakes the Python AI service using:

```text

GET /live

```

It then waits for:

```text

GET /health

```

to return:

```json

{

  "status": "ok"

}

```

Only after the AI service is ready does the frontend proceed with starting the interview.

The Node backend also checks the AI service readiness before requesting TTS.

Therefore there are two levels of protection:

```text

Frontend

   ↓

wake /live

   ↓

poll /health

   ↓

start interview

Node

   ↓

waitForAIService()

   ↓

/health

   ↓

/speak

```

This prevents the application from immediately trying to use Piper while the Render service is still starting.

---

## 🌐 Deployment Architecture

The deployed application uses separate services.

### Frontend

Vercel

Frontend URL:

```text

https://audio-based-ai-mock-interviewer.vercel.app

```

### Node/Express backend

Render

Backend URL:

```text

https://audio-based-ai-mock-interviewer.onrender.com

```

### Python/FastAPI TTS service

Render

AI service URL:

```text

https://audio-based-ai-mock-interviewer-1.onrender.com

```

### External infrastructure

```text

MongoDB Atlas

Upstash Redis

Cloudinary

Groq

```

---

## 🔗 Service Communication

The important production communication paths are:

```text

React

  │

  │ HTTPS

  ▼

Node / Express

  │

  ├──── HTTPS ────► Groq

  │                  ├── LLM

  │                  └── STT

  │

  ├──── HTTPS ────► Cloudinary

  │

  ├──── HTTPS ────► Upstash Redis

  │

  ├──── MongoDB ──► MongoDB Atlas

  │

  └──── HTTPS ────► FastAPI

                         │

                         ▼

                       Piper

```

The browser does not communicate directly with Groq for STT or with Piper for TTS.

The Node backend coordinates these operations.

---

## 🛡️ Authorization Model

Interview sessions belong to authenticated users.

When a request references a session, the backend checks:

```text

Authenticated user

        ↓

Session.user

        ↓

Does the session belong to this user?

        ↓

Yes → continue

No  → 403 Unauthorized

```

This prevents one authenticated user from accessing another user's interview session.

---

## 🛣️ Important API Areas

The backend API is organized around authentication, sessions, interviews, speech, and related application operations.

Known API areas include:

```text

/api/v1/auth/

/api/v1/session/

/api/v1/interview/

/api/v1/speech/

```

Examples of known operations include:

```text

POST /api/v1/auth/...

POST /api/v1/auth/refresh

POST /api/v1/interview/submit

POST /api/v1/speech/audio/upload

```

The exact endpoint structure should be treated as implementation-specific rather than duplicated throughout the README.

---

## 🧩 Why There Are Two AI Services

A deliberate architectural decision was made to separate TTS from the Node application.

Instead of putting Piper directly into the Node backend:

```text

Node

 └── Piper

```

the project uses:

```text

Node

  │

  │ HTTP

  ▼

FastAPI

  │

  ▼

Piper

```

This provides a clean boundary between:

### Application backend

Responsible for:

- Authentication

- Sessions

- Interview logic

- Database

- Redis

- Groq

- Cloudinary

### AI speech service

Responsible for:

- Piper model loading

- Text-to-speech

- WAV generation

- TTS readiness

This also makes the Python dependency stack independent from the Node backend.

---

## 🧪 Current Testing Approach

The project currently uses manual API and production-flow testing.

The FastAPI service has been manually tested using `curl`.

Examples:

```bash

curl http://127.0.0.1:8000/live

curl http://127.0.0.1:8000/health

```

TTS:

```bash

curl -X POST http://127.0.0.1:8000/speak \

  -H "Content-Type: application/json" \

  -d '{"text":"Tell me about your experience with Node.js and MongoDB."}' \

  --output question.wav

```

Validation cases have also been tested for:

- Empty text

- Missing `text`

- Incorrect `text` type

- Normal interview questions

- Technical terminology

- Longer questions

- Punctuation and common technical vocabulary

Automated testing is planned as an incremental improvement, including Vitest tests.

---

## 🐛 Handling Real-World Failures

The project does not assume every AI operation will succeed.

Examples of handled conditions include:

- Invalid session ID

- Missing session

- Unauthorized session access

- Inactive interview

- Unsupported audio interview type

- Missing uploaded audio

- Missing current question

- Empty speech transcription

- AI service not ready

- TTS generation failure

- Cloudinary cleanup failure

- Expired access token

- Refresh-token failure

For example, if speech transcription produces no text:

```text

Groq STT

   ↓

""

   ↓

Node detects empty transcript

   ↓

400 No speech detected

```

This is different from a Groq API failure.

---

## 📁 Project Structure

The repository contains three main application areas:

```text

mock-interviewer/

│

├── client/

│   └── React + TypeScript frontend

│

└── server/

    │

    ├── Node + Express backend

    │

    └── ai_services/

        └── Python + FastAPI + Piper TTS

```

The repository uses the same GitHub repository for the application while deploying the different application areas independently.

---

## 🚀 Local Development

### Frontend

The frontend is located under:

```text

client/

```

It is a React + TypeScript + Vite application.

### Node backend

The backend is located under:

```text

server/

```

It runs the Express application and communicates with:

- MongoDB

- Redis

- Groq

- Cloudinary

- FastAPI

### Python AI service

The Python service is located under:

```text

server/ai_services/

```

The service uses:

```text

FastAPI

Uvicorn

Piper TTS

```

The Python environment should use a Python version compatible with Piper and its ONNX Runtime dependency.

The current local development setup uses Python 3.12 for compatibility.

Install dependencies:

```bash

pip install -r requirements.txt

```

Start the service:

```bash

uvicorn main:app --reload

```

Then verify:

```bash

curl http://127.0.0.1:8000/live

```

and:

```bash

curl http://127.0.0.1:8000/health

```

---

## 🔐 Configuration

The application requires environment-specific configuration for the services it communicates with.

The important configuration areas include:

- MongoDB connection

- Redis connection

- JWT/authentication configuration

- Groq API key

- Cloudinary configuration

- FastAPI AI service URL

- Frontend/backend URLs

The Node backend uses:

```text

AI_SERVICE_URL

```

to locate the FastAPI TTS service.

The frontend uses:

```text

VITE_AI_SERVICE_URL

```

for the AI-service liveness/wake request.

The Groq integration requires:

```text

GROQ_API_KEY

```

Secrets should be stored in environment variables and should never be committed to Git.

---

## 🔒 Security Considerations

The project includes several security-oriented decisions:

- Passwords are stored as hashes rather than plaintext.

- Access tokens are short-lived.

- Refresh tokens are stored hashed.

- Refresh tokens can be revoked.

- Refresh-token rotation is used.

- Refresh tokens are delivered through an HttpOnly cookie.

- Session ownership is checked before accessing interview data.

- Password hashes are excluded from user responses.

- Authentication middleware protects private routes.

- AI service URLs and API keys are configured through environment variables.

- Candidate audio is not intended to remain permanently stored in Cloudinary after the interview.

---

## 🧭 Complete Interview Flow

The entire application can be understood through this single flow:

```text

┌─────────────────────────┐

│       Candidate         │

└────────────┬────────────┘

             │

             ▼

      Login / Signup

             │

             ▼

   Configure Interview

             │

             ├── Role

             ├── Experience

             ├── Focus Skills

             ├── Difficulty

             └── Interview Type

             │

             ▼

       Create Session

             │

             ▼

        MongoDB

             │

             ▼

       Start Interview

             │

             ▼

     Generate Question

             │

             ▼

        Groq LLM

             │

             ▼

       Question Text

             │

             ▼

        FastAPI

             │

             ▼

        Piper TTS

             │

             ▼

        Question WAV

             │

             ▼

        Candidate

             │

             ▼

      Record Answer

             │

             ▼

       Upload Audio

             │

             ├──────────────► Cloudinary

             │

             ▼

          Groq STT

             │

             ▼

       Answer Transcript

             │

             ├──────────────► MongoDB

             │

             └──────────────► Redis

                                  │

                                  ▼

                         Conversation History

                                  │

                                  ▼

                             Groq LLM

                                  │

                                  ▼

                           Next Question

                                  │

                                  ▼

                              Repeat

                                  │

                                  ▼

                         Final Question Answered

                                  │

                                  ▼

                         Evaluate Interview

                                  │

                                  ▼

                             Result

                                  │

                                  ▼

                        Complete Session

                                  │

                                  ▼

                       Clear Redis Memory

                                  │

                                  ▼

                       Delete Temporary Audio

```

---

## 🎯 Design Goals

The project was built around a few practical goals:

### 1. Keep the backend responsible for orchestration

Node/Express acts as the central coordinator rather than exposing every external service directly to the browser.

### 2. Separate persistent and temporary state

```text

MongoDB    → persistent application/session data

Redis      → conversation memory

Cloudinary → temporary audio storage

```

### 3. Keep AI responsibilities separated

```text

Groq  → LLM + STT

Piper → TTS

```

### 4. Support real interview context

Questions are generated using the interview configuration and conversation history rather than being treated as unrelated prompts.

### 5. Make the system deployable

The architecture separates the frontend, application backend, and Python speech service so each can be deployed independently.

---

## 📌 Current Limitations

This is an MVP, so it intentionally does not attempt to solve every possible interview-platform problem.

Current limitations include:

- Audio interviews are limited to Technical, Behavioral, and HR modes.

- DSA, Coding, and System Design currently use text-based interaction.

- AI-generated questions and evaluations are not based on a fixed question bank in the MVP.

- Automated testing is still being expanded.

- The application depends on external services such as Groq, MongoDB Atlas, Upstash Redis, Cloudinary, Vercel, and Render.

- Render cold starts require readiness handling.

- Speech transcription can return an empty transcript when the submitted recording contains no usable speech.

These are engineering trade-offs of the current MVP rather than hidden behavior.

---

## 🛠️ Future Improvements

The project is intended to evolve incrementally.

Possible improvements include:

- More automated unit tests with Vitest.

- Integration testing for backend APIs.

- End-to-end testing of the complete interview workflow.

- Better handling of browser recording edge cases.

- More robust audio validation.

- Improved interview evaluation.

- More detailed result analytics.

- Additional interview modes.

- A question bank for revision and practice.

- Improved frontend UX.

- Better production monitoring and observability.

The goal is to improve the existing system rather than repeatedly rebuilding it from scratch.

---

## 📚 Main Engineering Concepts Demonstrated

This project brings several backend and AI engineering concepts together in one application:

- REST API design

- Authentication and authorization

- JWT access/refresh token architecture

- Refresh-token rotation

- HttpOnly cookies

- MongoDB schema design

- Mongoose relationships and embedded documents

- Session lifecycle management

- Redis-based conversation memory

- Multipart file uploads

- Audio processing pipelines

- Cloud object/media storage

- Speech-to-text

- Large-language-model integration

- Prompt construction

- AI conversation context

- Text-to-speech

- Node ↔ Python service communication

- Service health/readiness checks

- Cold-start handling

- Error handling

- Cleanup/rollback logic

- Multi-service deployment

- Environment-based configuration

---

## 🌐 Deployment

The current production deployment is split into:

| Component | Technology | Platform |

|---|---|---|

| Frontend | React + TypeScript + Vite | Vercel |

| Main backend | Node.js + Express | Render |

| TTS service | Python + FastAPI + Piper | Render |

| Database | MongoDB | MongoDB Atlas |

| Conversation memory | Redis | Upstash |

| AI / LLM | Groq | Groq |

| Speech-to-text | Groq Whisper | Groq |

| Temporary audio | Cloudinary | Cloudinary |

---

## 📄 License

Add the project's chosen license here if/when one is defined.

---

## 👨‍💻 Project Status

This project is currently a deployed MVP.

The core application flow is working across the deployed services, including:

```text

Authentication

      ↓

Interview configuration

      ↓

Session creation

      ↓

AI question generation

      ↓

Piper question audio

      ↓

Candidate audio answer

      ↓

Groq speech-to-text

      ↓

MongoDB + Redis

      ↓

Next AI question

      ↓

Interview evaluation

      ↓

Result

```

The project is being improved incrementally rather than being treated as a one-time finished application.

