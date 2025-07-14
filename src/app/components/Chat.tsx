"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import {
  ChatMessage as ChatMessageType,
  StreamingChatResponse,
} from "../types/chat";
import { MessageSquare, AlertCircle, Wifi, WifiOff } from "lucide-react";

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentStreamingMessageIdRef = useRef<string | null>(null);

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
      content,
      role: "user",
      timestamp: new Date(),
    };

    const streamingMessageId = generateId();
    const streamingMessage: ChatMessageType = {
      id: streamingMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, streamingMessage]);
    setIsLoading(true);
    setError(null);
    currentStreamingMessageIdRef.current = streamingMessageId;

    try {
      // Use fetch with streaming instead of EventSource for POST requests
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          conversation: messages.filter((m) => !m.isTyping && !m.isStreaming), // Send conversation history without indicators
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Mark streaming as complete when stream ends
          setMessages((prev) => {
            const updated = [...prev];
            const messageIndex = updated.findIndex(
              (m) => m.id === currentStreamingMessageIdRef.current
            );
            if (messageIndex !== -1) {
              updated[messageIndex] = {
                ...updated[messageIndex],
                isStreaming: false,
              };
            }
            return updated;
          });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            try {
              const jsonStr = line.replace("data: ", "");
              const data: StreamingChatResponse = JSON.parse(jsonStr);

              if (data.type === "chunk" && data.content) {
                // Update the streaming message with new content
                setMessages((prev) => {
                  const updated = [...prev];
                  const messageIndex = updated.findIndex(
                    (m) => m.id === currentStreamingMessageIdRef.current
                  );
                  if (messageIndex !== -1) {
                    updated[messageIndex] = {
                      ...updated[messageIndex],
                      content: updated[messageIndex].content + data.content,
                    };
                  }
                  return updated;
                });
              } else if (data.type === "done") {
                // Mark streaming as complete
                setMessages((prev) => {
                  const updated = [...prev];
                  const messageIndex = updated.findIndex(
                    (m) => m.id === currentStreamingMessageIdRef.current
                  );
                  if (messageIndex !== -1) {
                    updated[messageIndex] = {
                      ...updated[messageIndex],
                      isStreaming: false,
                    };
                  }
                  return updated;
                });
                break;
              } else if (data.type === "error") {
                throw new Error(data.error || "Streaming error occurred");
              }
            } catch (parseError) {
              console.error("Error parsing streaming response:", parseError);
            }
          }
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);

      // Remove streaming message and add error message
      setMessages((prev) => {
        const updated = prev.filter(
          (m) => m.id !== currentStreamingMessageIdRef.current
        );
        updated.push({
          id: generateId(),
          content: `Sorry, I encountered an error: ${errorMessage}. Please make sure Ollama is running with Llama 3.2 3B model.`,
          role: "assistant",
          timestamp: new Date(),
        });
        return updated;
      });
    } finally {
      setIsLoading(false);
      currentStreamingMessageIdRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Sahai AI Assistant
              </h1>
              <div className="flex items-center space-x-2 text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Connected to Ollama</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={checkConnection}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700 hover:text-gray-900"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Welcome to Sahai AI
              </h2>
              <p className="text-gray-600 mb-4">
                Start a conversation with your AI assistant powered by Llama 3.2
                3B
              </p>
              <div className="text-sm text-gray-500">
                <p>Try asking:</p>
                <ul className="mt-2 space-y-1">
                  <li>• "नमस्ते, आप कैसे हैं?" (Hindi greeting)</li>
                  <li>• "Tell me about Indian festivals"</li>
                  <li>• "What's the weather like today?"</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <ChatInput
        onSendMessage={sendMessage}
        disabled={isLoading || !isConnected}
        placeholder={
          !isConnected
            ? "Connect to Ollama to start chatting..."
            : isLoading
            ? "AI is responding..."
            : "Type your message in Hindi or English..."
        }
      />
    </div>
  );
};
