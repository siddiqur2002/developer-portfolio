// app/api/voice/route.ts
import { NextResponse } from "next/server";
import Groq, { toFile } from "groq-sdk";
import { runPortfolioAgent } from "@/features/agent/agent-harness";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // ১. ব্লব ডাটাকে ফাইল বাফারে কনভার্ট করা
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const fileConverted = await toFile(buffer, "input_voice.webm");

    // ২. ২০২৬ সালের ফাস্টেস্ট Whisper Large V3 Turbo ব্যবহার করে ট্রান্সক্রাইব করা
    const transcription = await groq.audio.transcriptions.create({
      file: fileConverted,
      model: "whisper-large-v3-turbo",
      language: "en", // বা বাংলা চাইলে "bn" দিতে পারেন
    });

    const transcribedText = transcription.text;

    // ৩. প্রাপ্ত টেক্সট সরাসরি আপনার ৩-মডেল হার্নেসে পাঠিয়ে দেওয়া
    const aiResponseText = await runPortfolioAgent(transcribedText);

    return NextResponse.json({ 
      userText: transcribedText, 
      aiText: aiResponseText 
    });

  } catch (error) {
    console.error("Audio Processing API Error:", error);
    return NextResponse.json({ error: "Failed to process audio" }, { status: 500 });
  }
}