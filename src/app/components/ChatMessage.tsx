import React from "react";
import { ChatMessage as ChatMessageType } from "../types/chat";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const isTyping = message.isTyping;

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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
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
