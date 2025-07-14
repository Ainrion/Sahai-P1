import React, { useState, useEffect } from "react";
import { ChatMessage as ChatMessageType } from "../types/chat";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: ChatMessageType;
}

// Animated dots component for streaming indicator
const StreamingIndicator: React.FC = () => {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev === 3 ? 1 : prev + 1));
    }, 500); // Change dots every 500ms

    return () => clearInterval(interval);
  }, []);

  const dots = ".".repeat(dotCount);

  return (
    <span className="inline-flex items-center font-medium ml-1">
      <span
        className="mr-1 text-green-500 animate-pulse"
        style={{
          textShadow:
            "0 0 8px rgba(34, 197, 94, 0.6), 0 0 16px rgba(34, 197, 94, 0.3)",
          animationDuration: "2s",
        }}
      >
        Generating
      </span>
      <span
        className="text-green-500 min-w-[24px] inline-block"
        style={{
          textShadow:
            "0 0 6px rgba(34, 197, 94, 0.8), 0 0 12px rgba(34, 197, 94, 0.4)",
          filter: "drop-shadow(0 0 4px rgba(34, 197, 94, 0.6))",
        }}
      >
        {dots}
      </span>
    </span>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const isTyping = message.isTyping;
  const isStreaming = message.isStreaming;

  return (
    <div
      className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[80%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        } items-start gap-2`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-blue-500" : "bg-green-500"
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Message bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2 shadow-sm ${
            isUser
              ? "bg-blue-500 text-white rounded-br-md"
              : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
          }`}
        >
          {isTyping ? (
            <div className="flex items-center space-x-1">
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
              <span className="text-sm text-gray-500 ml-2">
                AI is thinking...
              </span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {isUser ? (
                <p className="text-white m-0">{message.content}</p>
              ) : (
                <div className="text-gray-800 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    {/* Show streaming indicator inline */}
                    {isStreaming && <StreamingIndicator />}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div
            className={`text-xs mt-1 ${
              isUser ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
