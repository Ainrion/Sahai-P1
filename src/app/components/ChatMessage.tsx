import React, { useState, useEffect } from "react";
import { ChatMessage as ChatMessageType } from "../types/chat";
import { Volume2, VolumeX, FileText, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

interface ChatMessageProps {
  message: ChatMessageType;
}

// Animated dots component for streaming indicator
const StreamingIndicator: React.FC = () => {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev === 3 ? 1 : prev + 1));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const dots = ".".repeat(dotCount);

  return (
    <span className="inline-flex items-center font-medium ml-1">
      <span className="mr-1 text-blue-500 animate-pulse">Generating</span>
      <span className="text-blue-500 min-w-[24px] inline-block">{dots}</span>
    </span>
  );
};

// Preparing answer indicator with logo
const PreparingIndicator: React.FC = () => {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev === 3 ? 1 : prev + 1));
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const dots = ".".repeat(dotCount);

  return (
    <div className="flex items-center space-x-3">
      <div className="animate-pulse">
        <Image
          src="/logo/Logo.png"
          alt="AI Logo"
          width={24}
          height={24}
          className="w-6 h-6"
        />
      </div>
      <span className="flex items-center text-gray-600">
        <span className="mr-1">Preparing your answer</span>
        <span className="min-w-[24px] inline-block">{dots}</span>
      </span>
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const isTyping = message.isTyping;
  const isStreaming = message.isStreaming;
  const isPreparing = message.isPreparing;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Check speech synthesis support
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSpeechSupported(true);
    }

    // Cleanup: stop speech when component unmounts
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = () => {
    if (!speechSupported || !message.content || isStreaming) return;

    if (isSpeaking) {
      // Stop speaking
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Start speaking
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div className="max-w-lg">
        <div className="text-sm font-medium text-gray-600 mb-2 flex items-center justify-between">
          <span>{isUser ? "ME" : "OUR AI"}</span>
          {!isUser &&
            speechSupported &&
            message.content &&
            !isTyping &&
            !isPreparing && (
              <button
                onClick={handleSpeak}
                disabled={isStreaming}
                className={`p-1 rounded-full transition-colors ${
                  isSpeaking
                    ? "bg-blue-500 text-white animate-pulse"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                } disabled:opacity-50`}
                title={isSpeaking ? "Stop speaking" : "Read aloud"}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            )}
        </div>
        <div className="bg-white/50 border-white border-1 rounded-lg  px-4 py-3">
          {isPreparing ? (
            <PreparingIndicator />
          ) : isTyping ? (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span className="text-sm text-gray-500">AI is thinking...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* File Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-2">
                  {message.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        {attachment.type.startsWith("image/") ? (
                          <div className="flex-shrink-0">
                            <Image
                              src={attachment.url}
                              alt={attachment.name}
                              width={80}
                              height={80}
                              className="rounded-lg object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0">
                            <FileText className="w-8 h-8 text-red-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Open file"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              <div className="text-gray-900">
                {isUser ? (
                  <p className="m-0">{message.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                    {isStreaming && <StreamingIndicator />}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
