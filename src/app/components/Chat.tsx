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

      // Create assistant message for streaming
      const assistantMessageId = generateId();
      currentStreamingMessageIdRef.current = assistantMessageId;

      const assistantMessage: ChatMessageType = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

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

      // Remove the user message if there was an error
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
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
      {/* Background with gradient blobs */}
      <div className="absolute inset-0 bg-white overflow-hidden">
        {/* Pink blob */}
        <div
          className="absolute w-220 h-220 rounded-full opacity-40 blur-3xl"
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
          className="absolute w-280 h-240 rounded-full opacity-40 blur-3xl"
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
              /* Sample Conversation */
              <div className="space-y-6">
                {/* User Message */}
                <div className="flex justify-start">
                  <div className="max-w-xs">
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      ME
                    </div>
                    <div className="bg-white/50 border-white border-1 rounded-lg px-4 py-3">
                      <p className="text-gray-900">What can I ask you to do?</p>
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-end">
                  <div className="max-w-lg">
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      OUR AI
                    </div>
                    <div className="bg-white/50 border-white border-1 rounded-lg px-4 py-3">
                      <p className="text-gray-900 mb-3">
                        Great question! You can ask for my help with the
                        following:
                      </p>
                      <div className="text-gray-700 space-y-2">
                        <div>
                          1. Anything to do with your reports in our software
                          e.g. What is the last report we exported?
                        </div>
                        <div>
                          2. Anything to do with your organisation e.g. how many
                          employees are using our software?
                        </div>
                        <div>
                          3. Anything to do with the features we have in our
                          software e.g how can I change the colours of my
                          report?
                        </div>
                      </div>
                    </div>
                  </div>
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
