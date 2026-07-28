"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceDictationProps {
  onResult: (text: string) => void;
}

export default function VoiceDictation({ onResult }: VoiceDictationProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-ZA";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript((prev) => {
          const newTranscript = prev ? prev + " " + finalTranscript : finalTranscript;
          return newTranscript;
        });
      }
      setInterim(interimTranscript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        setListening(false);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      if (transcript) onResult(transcript);
    } else {
      setTranscript("");
      setInterim("");
      recognitionRef.current.start();
      setListening(true);
    }
  }, [listening, transcript, onResult]);

  if (!supported) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500">Speech-to-text is not supported in this browser. Try Chrome or Edge.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-lg">&#x1F3A4;</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Voice Dictation</h3>
          <p className="text-xs text-gray-500">Speak your invoice details and they&apos;ll be auto-filled</p>
        </div>
      </div>

      <button
        onClick={toggleListening}
        className={`w-full px-4 py-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
          listening
            ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {listening ? (
          <>
            <span className="w-3 h-3 bg-white rounded-full inline-block" />
            Stop Recording
          </>
        ) : (
          <>
            <span>&#x1F399;</span>
            Start Dictating
          </>
        )}
      </button>

      {(transcript || interim) && (
        <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm text-gray-700">
            {transcript}
            {interim && <span className="text-gray-400">{interim}</span>}
          </p>
        </div>
      )}

      {transcript && !listening && (
        <button
          onClick={() => { setTranscript(""); onResult(""); }}
          className="mt-2 text-xs text-red-600 hover:underline"
        >
          Clear transcript
        </button>
      )}

      <div className="mt-3 text-xs text-gray-400">
        <p>Try saying: &quot;Invoice for John Smith, 5 widgets at R100 each, total R500&quot;</p>
      </div>
    </div>
  );
}
