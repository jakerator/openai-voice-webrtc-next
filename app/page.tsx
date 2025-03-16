"use client"
import React, { useState, useRef, useEffect } from "react";


const App: React.FC = () => {
  const [voice, setVoice] = useState("ash");
  const [status, setStatus] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const audioIndicatorRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    return () => stopSession();
  }, []);



  const getEphemeralToken = async () => {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
    },
  });
    const data = await response.json();
    return data.client_secret.value;
  };

  const setupAudioVisualization = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;

    source.connect(analyzer);

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateIndicator = () => {
      if (!audioContext) return;

      analyzer.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;

      if (audioIndicatorRef.current) {
        audioIndicatorRef.current.classList.toggle("active", average > 30);
      }

      requestAnimationFrame(updateIndicator);
    };

    updateIndicator();
    audioContextRef.current = audioContext;
  };

  const startSession = async () => {
    try {
      setStatus("Requesting microphone access...");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setupAudioVisualization(stream);

      setStatus("Fetching ephemeral token...");
      const ephemeralToken = await getEphemeralToken();

      setStatus("Establishing connection...");
      // Create a peer connection
      const pc = new RTCPeerConnection();

      // Set up to play remote audio from the model
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;

      pc.ontrack = (e) => (audioEl.srcObject = e.streams[0]);

      pc.addTrack(stream.getTracks()[0]);

      // Start the session using the Session Description Protocol (SDP)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const response = await fetch(`${baseUrl}?model=${model}&voice=${voice}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          "Content-Type": "application/sdp",
        },
      });

      await pc.setRemoteDescription({
        type: "answer",
        sdp: await response.text(),
      });

      peerConnectionRef.current = pc;
      setIsSessionActive(true);
      setStatus("Session established successfully!");
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
      stopSession();
    }
  };

  const stopSession = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (audioIndicatorRef.current) {
      audioIndicatorRef.current.classList.remove("active");
    }

    setIsSessionActive(false);
    setStatus("");
  };

  const handleStartStopClick = () => {
    if (isSessionActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <h1 className="text-3xl m-6 font-bold flex items-center">
        <span
          id="audioIndicator"
          className="audio-indicator bg-gray-400 mr-2"
          ref={audioIndicatorRef}
        ></span>
        Interrogation of a suspect
      </h1>

      <div className="controls">
        {/* <div className="form-group">
          <label htmlFor="voiceSelect">Voice</label>
          <select
            id="voiceSelect"
            className="border rounded p-2 w-full"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
          >
            <option value="ash">Ash</option>
            <option value="ballad">Ballad</option>
            <option value="coral">Coral</option>
            <option value="sage">Sage</option>
            <option value="verse">Verse</option>
          </select>
        </div> */}
        <button
          className={`px-4 mt-6 py-2 rounded text-white ${isSessionActive ? "bg-red-500" : "bg-blue-500"}`}
          onClick={handleStartStopClick}
        >
          {isSessionActive ? "Stop Voice Session" : "Start Voice Session"}
        </button>
      </div>

      {status && (
        <div
          className={`status mt-4 p-3 rounded ${status.startsWith("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
        >
          {status}
        </div>
      )}
    </div>
  );
};

export default App;
