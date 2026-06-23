// components/VoiceChat.tsx
"use client";

import { useState, useRef } from "react";

export default function VoiceChat() {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ১. অডিও রেকর্ডিং শুরু করার ফাংশন
  const startRecording = async () => {
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      await sendAudioToBackend(audioBlob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  // ২. রেকর্ডিং বন্ধ করার ফাংশন
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // মাইক্রোফোন স্ট্রিম বন্ধ করা (ক্লিনআপ)
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // ৩. ব্যাকএন্ডে ফাইল পাঠানো ও ব্রাউজারে স্পিক করানো
  const sendAudioToBackend = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const res = await fetch("/api/voice", { method: "POST", body: formData });
      const data = await res.json();

      if (data.aiText) {
        // ব্রাউজারের বিল্ট-ইন TTS ইঞ্জিন কল করা
        speak(data.aiText);
      }
    } catch (err) {
      console.error("Error exchanging audio:", err);
    } finally {
      setLoading(false);
    }
  };

  // ৪. ব্রাউজারের নেটিভ টেক্সট-টু-স্পিচ প্লেয়ার
  const speak = (text: string) => {
    // চলমান কোনো ভয়েস থাকলে আগে স্টপ করা
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // প্রফেশনাল ভাইব দেওয়ার জন্য ন্যাচারাল স্পিড সেট করা
    utterance.rate = 1.0; 
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-xl shadow-sm">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-full font-semibold transition-all ${
          isRecording ? "bg-red-500 text-white animate-pulse" : "bg-blue-600 text-white"
        }`}
      >
        {isRecording ? "Listening... Click to Stop" : "🎤 Talk to Agent"}
      </button>
      {loading && <p className="text-sm text-gray-500">Thinking and speaking...</p>}
    </div>
  );
}