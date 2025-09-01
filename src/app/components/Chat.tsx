"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChatMessage } from "./ChatMessage";
import { ModelSelector } from "./ModelSelector";
import { FileUpload, UploadedFile } from "./FileUpload";

import {
  ChatMessage as ChatMessageType,
  StreamingChatResponse,
  FileAttachment,
} from "../types/chat";
import { Send, Mic, MicOff, Paperclip, X } from "lucide-react";

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("groq");
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isClosingPopup, setIsClosingPopup] = useState(false);
  const [isPopupAnimating, setIsPopupAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Removed unused ref
  // const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentStreamingMessageIdRef = useRef<string | null>(null);
  type SpeechRecognitionAlternativeLike = {
    transcript: string;
    confidence?: number;
  };

  type SpeechRecognitionEventLike = {
    results: { 0: { 0: SpeechRecognitionAlternativeLike } };
  };

  type SpeechRecognitionErrorEventLike = {
    error?: string;
  };

  type BrowserSpeechRecognition = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
  };

  // Some browsers expose webkitSpeechRecognition instead of SpeechRecognition
  // We define a minimal interface above to avoid using any
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

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
      const SpeechRecognitionCtor: new () => BrowserSpeechRecognition =
        (
          window as unknown as {
            SpeechRecognition?: new () => BrowserSpeechRecognition;
          }
        ).SpeechRecognition ||
        (
          window as unknown as {
            webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
          }
        ).webkitSpeechRecognition!;

      if (SpeechRecognitionCtor) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsRecording(false);
          setError(null); // Clear any previous errors
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
          const errMsg = event.error ?? "unknown_error";
          console.error("Speech recognition error:", errMsg);
          setIsRecording(false);
          setError(`Speech recognition error: ${errMsg}`);
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

  const openFileUpload = () => {
    setShowFileUpload(true);
    setIsPopupAnimating(true);
    // Small delay to trigger the opening animation
    setTimeout(() => {
      setIsPopupAnimating(false);
    }, 10);
  };

  const closeFileUpload = () => {
    setIsClosingPopup(true);
    setTimeout(() => {
      setShowFileUpload(false);
      setIsClosingPopup(false);
    }, 200); // Match the animation duration
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Convert uploaded files to attachments
    const attachments: FileAttachment[] = attachedFiles.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      url: file.url,
      content: file.content,
    }));

    const userMessage: ChatMessageType = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined,
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
          conversation: messages.slice(-10), // Send last 10 messages for context
          provider: selectedProvider,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      });

      if (!response.ok) {
        // Try to parse error response for more helpful messages
        try {
          const errorData = await response.json();
          if (errorData.error) {
            throw new Error(errorData.error);
          }
        } catch (parseError) {
          // If parsing fails, fall back to generic error
        }
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

              if (data.done) {
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

      let errorMessage =
        err instanceof Error ? err.message : "Failed to send message";

      // Add helpful suggestions for common errors
      if (
        errorMessage === "Failed to fetch" ||
        errorMessage.includes("Failed to fetch")
      ) {
        errorMessage =
          "Failed to fetch. Please consider switching to a different model using the dropdown above.";
      } else if (
        errorMessage.includes("Rate limit exceeded") ||
        errorMessage.includes("429")
      ) {
        errorMessage = `${errorMessage} Please consider switching to a different model using the dropdown above.`;
      } else if (
        errorMessage.includes("API key") ||
        errorMessage.includes("401")
      ) {
        errorMessage = `${errorMessage} Please consider switching to a different model using the dropdown above.`;
      } else if (
        errorMessage.includes("unavailable") ||
        errorMessage.includes("500")
      ) {
        errorMessage = `${errorMessage} Please consider switching to a different model using the dropdown above.`;
      }

      setError(errorMessage);

      // Remove the user message and any preparing message if there was an error
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== userMessage.id && !msg.isPreparing)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if ((inputValue.trim() || attachedFiles.length > 0) && !isLoading) {
      sendMessage(inputValue.trim() || "Please analyze the uploaded files.");
      setInputValue("");
      setAttachedFiles([]); // Clear attached files after sending
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

          {/* Connection Status and Model Selector */}
          <div className="mt-4 flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2">
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

            {/* Model Selector */}
            <ModelSelector
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
              disabled={isLoading}
            />
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
                <div className="flex flex-col md:flex-row gap-3 justify-center">
                  <button
                    onClick={() =>
                      sendMessage("Tell me about a traditional Indian festival")
                    }
                    disabled={isLoading || !isConnected}
                    className="bg-white/60 hover:bg-white/80 border border-white/40 rounded-lg px-4 py-3 text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm w-full md:flex-1 text-left"
                  >
                    Tell me about a traditional Indian festival
                  </button>

                  <button
                    onClick={() =>
                      sendMessage(
                        "Explain the significance of yoga in Indian culture"
                      )
                    }
                    disabled={isLoading || !isConnected}
                    className="bg-white/60 hover:bg-white/80 border border-white/40 rounded-lg px-4 py-3 text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm w-full md:flex-1 text-left"
                  >
                    Explain the significance of yoga in Indian culture
                  </button>

                  <button
                    onClick={() =>
                      sendMessage(
                        "What are the different classical dance forms of India?"
                      )
                    }
                    disabled={isLoading || !isConnected}
                    className="bg-white/60 hover:bg-white/80 border border-white/40 rounded-lg px-4 py-3 text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm w-full md:flex-1 text-left"
                  >
                    What are the different classical dance forms of India?
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
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm max-w-[883px] mx-auto px-6">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-500 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Connection Error</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className=" pb-8 w-full px-6">
            <div className="max-w-[883px] mx-auto space-y-4">
              {/* Attached Files Preview (only show if files are attached) */}
              {attachedFiles.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Attached Files ({attachedFiles.length})
                    </span>
                    <button
                      onClick={() => setAttachedFiles([])}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Clear all files"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {attachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {file.type.startsWith("image/") ? (
                            <Image
                              src={file.url}
                              alt={file.name}
                              width={32}
                              height={32}
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                              <Paperclip className="w-4 h-4 text-red-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const updatedFiles = attachedFiles.filter(
                              (f) => f.id !== file.id
                            );
                            setAttachedFiles(updatedFiles);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="relative">
                {/* Attachment Button */}
                <button
                  onClick={openFileUpload}
                  disabled={isLoading || !isConnected}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  title="Attach files"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isRecording
                      ? "Listening..."
                      : attachedFiles.length > 0
                      ? "Ask about your files..."
                      : "Ask me anything about your projects"
                  }
                  disabled={isLoading || !isConnected || isRecording}
                  className="w-full bg-white border border-gray-200 rounded-lg pl-12 pr-24 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#160211]/30 focus:border-transparent shadow-sm"
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
                  disabled={
                    (!inputValue.trim() && attachedFiles.length === 0) ||
                    isLoading ||
                    !isConnected
                  }
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:opacity-50 rounded-full transition-colors"
                >
                  <Send className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Popup */}
      {showFileUpload && (
        <div
          className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200 ${
            isClosingPopup || isPopupAnimating ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeFileUpload}
        >
          <div
            className={`bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl transition-all duration-200 ${
              isClosingPopup || isPopupAnimating
                ? "scale-95 opacity-0"
                : "scale-100 opacity-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Attach Files
                </h3>
                <button
                  onClick={closeFileUpload}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <FileUpload
                onFilesUploaded={(files) => {
                  setAttachedFiles(files);
                  if (files.length > 0) {
                    closeFileUpload();
                  }
                }}
                disabled={isLoading}
                maxFiles={3}
                maxSize={10}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
