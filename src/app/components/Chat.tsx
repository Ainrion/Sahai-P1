"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import {
  ChatMessage as ChatMessageType,
  StreamingChatResponse,
} from "../types/chat";
import { Send, Mic, MicOff } from "lucide-react";

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentStreamingMessageIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check Ollama connection on component mount
  useEffect(() => {
    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsRecording(false);
          setError(null); // Clear any previous errors
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          setError(`Speech recognition error: ${event.error}`);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/chat/health");
      setIsConnected(response.ok);
    } catch (err) {
      setIsConnected(false);
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Add preparing message immediately
    const preparingMessageId = generateId();
    const preparingMessage: ChatMessageType = {
      id: preparingMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isPreparing: true,
    };

    setMessages((prev) => [...prev, preparingMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content.trim(),
          history: messages.slice(-10), // Send last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      // Replace preparing message with streaming message
      const assistantMessageId = generateId();
      currentStreamingMessageIdRef.current = assistantMessageId;

      const assistantMessage: ChatMessageType = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      // Replace preparing message with actual streaming message
      setMessages((prev) =>
        prev.map((msg) => (msg.isPreparing ? assistantMessage : msg))
      );

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data: StreamingChatResponse = JSON.parse(line.slice(6));

              if (data.content) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + data.content }
                      : msg
                  )
                );
              }

              if (data.type === "done") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, isStreaming: false }
                      : msg
                  )
                );
                currentStreamingMessageIdRef.current = null;
              }
            } catch (parseError) {
              console.warn("Failed to parse SSE data:", parseError);
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");

      // Remove the user message and any preparing message if there was an error
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== userMessage.id && !msg.isPreparing)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = () => {
    if (recognitionRef.current && speechSupported && !isRecording) {
      setError(null);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient blobs - Fixed to viewport */}
      <div className="fixed inset-0 bg-white overflow-hidden pointer-events-none z-0">
        {/* Pink blob */}
        <div
          className="fixed w-220 h-220 rounded-full opacity-40 blur-3xl"
          style={{
            background: "radial-gradient(circle, #FF86E1 30%, transparent 70%)",
            top: "80%",
            left: "40%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />

        {/* Blue blob */}
        <div
          className="fixed w-280 h-240 rounded-full opacity-40 blur-3xl"
          style={{
            background: "radial-gradient(circle, #89BCFF 0%, transparent 70%)",
            top: "70%",
            right: "35%",
            transform: "translate(50%, -50%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex flex-col items-center justify-center pt-20 pb-12">
          <div className="mb-8">
            <Image
              src="/logo/Logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>
          <h1 className="text-2xl font-normal text-gray-900">
            Ask our AI anything
          </h1>

          {/* Connection Status Indicator */}
          <div className="mt-4 flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            ></div>
            <span
              className={`text-sm font-medium ${
                isConnected ? "text-green-600" : "text-red-600"
              }`}
            >
              {isConnected ? "AI Connected" : "AI Disconnected"}
            </span>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col justify-end">
          {/* Messages Container */}
          <div className="mb-8 max-w-[883px] mx-auto w-full px-6">
            {messages.length === 0 ? (
              /* Suggestion Buttons */
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <h2 className="text-lg font-medium text-gray-700 mb-6">
                    Suggestions on what to ask Our AI
                  </h2>
                </div>

                {/* Suggestion Buttons */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => sendMessage("What can I ask you to do?")}
                    disabled={isLoading || !isConnected}
                    className="bg-white/60 hover:bg-white/80 border border-white/40 rounded-lg px-4 py-3 text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex-1 text-left"
                  >
                    What can I ask you to do?
                  </button>

                  <button
                    onClick={() =>
                      sendMessage(
                        "Which one of my projects is performing the best?"
                      )
                    }
                    disabled={isLoading || !isConnected}
                    className="bg-white/60 hover:bg-white/80 border border-white/40 rounded-lg px-4 py-3 text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex-1 text-left"
                  >
                    Which one of my projects is performing the best?
                  </button>

                  <button
                    onClick={() =>
                      sendMessage(
                        "What projects should I be concerned about right now?"
                      )
                    }
                    disabled={isLoading || !isConnected}
                    className="bg-white/60 hover:bg-white/80 border border-white/40 rounded-lg px-4 py-3 text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex-1 text-left"
                  >
                    What projects should I be concerned about right now?
                  </button>
                </div>
              </div>
            ) : (
              /* Actual Messages */
              <div className="space-y-6">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm max-w-[883px] mx-auto px-6">
              {error}
            </div>
          )}

          {/* Input Area */}
          <div className=" pb-8 w-full px-6">
            <div className="relative max-w-[883px] mx-auto">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isRecording
                    ? "Listening..."
                    : "Ask me anything about your projects"
                }
                disabled={isLoading || !isConnected || isRecording}
                className="w-full bg-white border border-gray-200 rounded-lg px-6 py-4 pr-24 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#160211]/30 focus:border-transparent shadow-sm"
              />

              {/* Microphone Button */}
              {speechSupported && (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || !isConnected}
                  className={`absolute right-14 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  } disabled:bg-gray-50 disabled:opacity-50`}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading || !isConnected}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:opacity-50 rounded-full transition-colors"
              >
                <Send className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
