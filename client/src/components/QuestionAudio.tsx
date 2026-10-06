import { useEffect, useRef, useState } from "react";

interface QuestionAudioProps {
    audio: string;
    audioMimeType: string;
    autoPlay?: boolean;
}

export default function QuestionAudio({
    audio,
    audioMimeType,
    autoPlay = true,
}: QuestionAudioProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!audio) {
            setAudioUrl(null);
            return;
        }

        try {
            // Convert Base64 string into binary data
            const byteCharacters = atob(audio);

            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);

            // Create a playable Blob
            const blob = new Blob([byteArray], {
                type: audioMimeType,
            });

            // Create temporary URL for the Blob
            const url = URL.createObjectURL(blob);

            setAudioUrl(url);

            // Cleanup previous Blob URL
            return () => {
                URL.revokeObjectURL(url);
            };
        } catch (error) {
            console.error("Failed to process question audio:", error);
            setAudioUrl(null);
        }
    }, [audio, audioMimeType]);

    useEffect(() => {
        if (!audioUrl || !audioRef.current) {
            return;
        }

        const audioElement = audioRef.current;

        audioElement.src = audioUrl;

        if (autoPlay) {
            audioElement
                .play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch((error) => {
                    console.warn("Audio autoplay was blocked:", error);
                    setIsPlaying(false);
                });
        }

        return () => {
            audioElement.pause();
            audioElement.removeAttribute("src");
            audioElement.load();
            setIsPlaying(false);
        };
    }, [audioUrl, autoPlay]);

    const handlePlay = async () => {
        if (!audioRef.current) {
            return;
        }

        try {
            await audioRef.current.play();
            setIsPlaying(true);
        } catch (error) {
            console.error("Failed to play audio:", error);
        }
    };

    const handlePause = () => {
        if (!audioRef.current) {
            return;
        }

        audioRef.current.pause();
        setIsPlaying(false);
    };

    const handleEnded = () => {
        setIsPlaying(false);
    };

    if (!audioUrl) {
        return null;
    }

    return (
        <div>
            <audio
                ref={audioRef}
                onEnded={handleEnded}
                preload="auto"
            />

            {isPlaying ? (
                <button type="button" onClick={handlePause}>
                    Pause
                </button>
            ) : (
                <button type="button" onClick={handlePlay}>
                    ▶ Play Question
                </button>
            )}
        </div>
    );
}