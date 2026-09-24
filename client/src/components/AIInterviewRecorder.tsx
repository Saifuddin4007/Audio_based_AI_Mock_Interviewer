import React, { useState, useRef, useCallback, useEffect } from 'react';

// Define the possible states of our recorder to ensure TypeScript safety
type RecorderStatus = 'idle' | 'recording' | 'paused' | 'playback' | 'error';

interface AIInterviewRecorderProps {
  onRecordingComplete?: (blob: Blob, fileName: string) => void;
}

const AIInterviewRecorder: React.FC<AIInterviewRecorderProps> = ({ onRecordingComplete }) => {
  // ==========================================
  // 1. STATE MANAGEMENT (Triggers UI re-renders)
  // ==========================================

  // Tracks the current phase of the recorder to know which UI to show
  const [status, setStatus] = useState<RecorderStatus>('idle');

  // Tracks recording duration in seconds (updated every 1 second)
  const [duration, setDuration] = useState<number>(0);

  // Holds the temporary browser URL (blob:http://...) to play the recorded audio
  const [audioURL, setAudioURL] = useState<string | null>(null);

  // Holds the generated filename for potential downloads (e.g., "interview-answer-12345.webm")
  const [fileName, setFileName] = useState<string>('');

  // Holds error messages to display to the user if something goes wrong
  const [errorMsg, setErrorMsg] = useState<string>('');


  // ==========================================
  // 2. REFS (Hold mutable values WITHOUT triggering re-renders)
  // ==========================================

  // Holds the actual MediaRecorder instance so we can call .start(), .stop(), .pause() on it
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // An array to collect all the small audio "chunks" as they are recorded
  const chunksRef = useRef<Blob[]>([]);

  // Holds the microphone MediaStream so we can turn it off (stop tracks) when done
  const streamRef = useRef<MediaStream | null>(null);

  // Holds the setInterval ID so we can clear the timer when recording stops/pauses
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Holds a reference to the HTML <audio> element so we can force it to reload the new audio URL
  const audioRef = useRef<HTMLAudioElement>(null);


  // ==========================================
  // 3. HELPER FUNCTIONS
  // ==========================================

  /**
   * Detects the best audio format the browser supports.
   * Firefox is notoriously strict, so we give it 'audio/ogg' or generic 'audio/webm'.
   * Chrome/Edge/Safari will use 'audio/webm;codecs=opus' or 'audio/mp4'.
   */
  const getSupportedMimeType = (): string => {
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    if (isFirefox) {
      if (MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')) return 'audio/ogg; codecs=opus';
      if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    }
    const types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  /**
   * Converts total seconds into a clean "MM:SS" string (e.g., 65 seconds -> "01:05")
   */
  const formatTime = (s: number): string =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;


  // ==========================================
  // 4. ACTION FUNCTIONS (The Core Logic)
  // ==========================================

  /**
   * START RECORDING
   * Requests mic access, sets up the recorder, and begins capturing audio chunks.
   */
  const startRecording = useCallback(async () => {
    try {
      setErrorMsg(''); // Clear any previous errors

      // SAFETY: If a previous recording exists, stop its microphone tracks to prevent "mic in use" errors
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }

      // 1. Request microphone access from the browser
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,  // Removes echo (crucial for AI transcription)
          noiseSuppression: true,  // Removes background fan/AC noise
          autoGainControl: true    // Normalizes volume levels
        }
      });

      streamRef.current = stream; // Save stream to ref for later cleanup
      chunksRef.current = [];     // Reset chunks array for this new recording

      // 2. Verify the stream actually has audio (prevents silent recording bugs)
      if (stream.getAudioTracks().length === 0) {
        throw new Error('No audio tracks found');
      }

      // 3. Initialize MediaRecorder with the best supported format
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // 4. EVENT: Fired every 1 second (due to timeslice below) with a new piece of audio data
      mediaRecorder.ondataavailable = (event) => {
        // Only save the chunk if it actually contains data (size > 0)
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // 5. EVENT: Fired when .stop() is called. This is where we finalize the recording.
      mediaRecorder.onstop = () => {
        // Combine all the 1-second chunks into one single, complete audio file (Blob)
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });

        if (finalBlob.size === 0) {
          // If the blob is empty, the mic was likely blocked or muted
          setErrorMsg('Recording failed. Please check mic permissions.');
          setStatus('error');
        } else {
          // Create a temporary browser URL to play this Blob
          const url = URL.createObjectURL(finalBlob);

          // Determine the correct file extension based on the MIME type we used
          let extension = 'webm';
          if (mimeType.includes('ogg')) extension = 'ogg';
          else if (mimeType.includes('mp4')) extension = 'm4a';

          const generatedFileName = `interview-answer-${Date.now()}.${extension}`;
          setFileName(generatedFileName);
          setAudioURL(url);
          setStatus('playback'); // Switch UI to show the audio player

          if (onRecordingComplete) {
            onRecordingComplete(finalBlob, generatedFileName);
          }


          // FORCE UPDATE: Sometimes React's <audio> tag doesn't notice the src changed.
          // This forces the browser to load the new audio file.
          setTimeout(() => {
            if (audioRef.current) audioRef.current.load();
          }, 100);
        }

        // CLEANUP: Turn off the microphone hardware light and free up resources
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        if (timerRef.current !== null) clearInterval(timerRef.current); // Stop the timer
      };

      // 6. EVENT: Fired if a fatal error occurs during recording (e.g., disk full, hardware disconnect)
      mediaRecorder.onerror = (event) => {
        console.error('Recorder error:', event.error);
        setErrorMsg(`Error: ${event.error.name}`);
        setStatus('error');
      };

      // 7. ACTUALLY START RECORDING
      // The '1000' means: fire the 'ondataavailable' event every 1000ms (1 second). 
      // This prevents memory crashes on long recordings.
      mediaRecorder.start(1000);

      setStatus('recording');
      setDuration(0);

      // Start the visual timer
      timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);

    } catch (error: unknown) {
      // Catch permission denials or missing hardware
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMsg(`Mic access denied: ${message}`);
      setStatus('error');
    }
  }, []); // Empty dependency array means this function is created only once

  /**
   * STOP RECORDING
   * Safely stops the recorder, which automatically triggers the 'onstop' event above.
   */
  const stopRecording = useCallback(() => {
    // Only try to stop if the recorder exists and isn't already stopped
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /**
   * TOGGLE PAUSE / RESUME
   * Pauses the recording without losing the data, or resumes it.
   */
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (status === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
      if (timerRef.current !== null) clearInterval(timerRef.current); // Pause the timer
    } else if (status === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      // Restart the timer
      timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
    }
  }, [status]); // Re-create this function if 'status' changes

  /**
   * CLEAR RECORDING
   * Deletes the current recording and resets the component to its initial state.
   */
  const clearRecording = useCallback(() => {
    // CRITICAL: Free up browser memory by revoking the temporary Blob URL
    if (audioURL) URL.revokeObjectURL(audioURL);

    setAudioURL(null);
    setFileName('');
    setDuration(0);
    setErrorMsg('');
    setStatus('idle');
  }, [audioURL]);


  // ==========================================
  // 5. LIFECYCLE CLEANUP (Prevents Memory Leaks)
  // ==========================================

  /**
   * This useEffect runs when the component is REMOVED from the screen (unmounted).
   * It ensures we don't leave the microphone turned on or timers running in the background.
   */
  useEffect(() => {
    // This is the "cleanup" function that runs on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      if (timerRef.current !== null) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]); // Re-run cleanup if audioURL changes to prevent memory leaks


  // ==========================================
  // 6. RENDER (UI)
  // ==========================================

  return (
    <div className="flex flex-col items-start">

      {/* Show error message only if status is 'error' */}
      {status === 'error' && (
        <p className="text-xs text-red-500 mb-2 flex items-center">
          ⚠️ {errorMsg}
        </p>
      )}

      <div className="flex items-center">

        {/* STATE 1: IDLE or ERROR -> Show the "Record Answer" button */}
        {(status === 'idle' || status === 'error') && (
          <button
            onClick={startRecording}
            className="group flex items-center space-x-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all duration-200 border border-indigo-100 shadow-sm"
            title="Start Voice Recording"
          >
            <span className="text-lg">🎤</span>
            <span className="text-sm font-medium">Record Answer</span>
          </button>
        )}

        {/* STATE 2: RECORDING or PAUSED -> Show the timer and controls */}
        {(status === 'recording' || status === 'paused') && (
          <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 shadow-inner">
            {/* Pulsing Red (recording) or Yellow (paused) Dot */}
            <div className="relative flex items-center justify-center w-3 h-3">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${status === 'paused' ? 'bg-yellow-400' : 'bg-red-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
            </div>

            {/* Live Timer */}
            <span className="font-mono text-sm font-semibold text-gray-700 min-w-[45px]">
              {formatTime(duration)}
            </span>

            {/* Pause/Resume and Stop Buttons */}
            <div className="flex items-center space-x-1 border-l border-gray-300 pl-3">
              <button
                onClick={togglePause}
                className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition"
                title={status === 'recording' ? 'Pause' : 'Resume'}
              >
                {status === 'recording' ? '⏸' : '▶'}
              </button>

              <button
                onClick={stopRecording}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                title="Stop Recording"
              >
                ⏹
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: PLAYBACK -> Show the audio player and delete button */}
        {status === 'playback' && audioURL && (
          <div className="flex items-center space-x-3 w-full max-w-md">
            <audio
              ref={audioRef}          // Attach the ref so we can call .load() on it
              key={audioURL}          // Forces React to rebuild the audio element when URL changes
              controls                // Shows default play/pause/volume controls
              src={audioURL}          // The actual audio data
              className="h-10 flex-1 rounded bg-gray-100"
              preload="metadata"      // Tells browser to load duration info immediately
            />
            <button
              onClick={clearRecording}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
              title="Discard and record again"
            >
              🗑️
            </button>

            {/* Hidden download link (useful for debugging or if you want to add a download button later) */}
            <a href={audioURL} download={fileName} className="hidden">Download</a>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIInterviewRecorder;