import React, { useState, KeyboardEvent } from "react";
import { Send, Mic, Plus } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const [message, setMessage] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File uploaded:", file);
      const reader = new FileReader();
      reader.onload = () => {
        setFileContent(reader.result as string);
        // You can now send `fileContent` to your backend or process it
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
      <div className="flex items-center gap-2 max-w-4xl mx-auto px-3 py-2 bg-white rounded-xl shadow">

        {/* File Upload via Plus Icon */}
        <label htmlFor="file-upload" className="cursor-pointer">
          <Plus className="text-gray-500 hover:text-gray-700 mr-2 w-5 h-5" />
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {/* Text Input */}
        <div className="relative flex-1">
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full min-h-[44px] max-h-[120px] px-4 py-2 pr-12 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 placeholder-gray-500"
          />

          {/* Mic Icon */}
          {!message.trim() && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
              disabled={disabled}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="w-11 h-11 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <div className="text-xs text-gray-500 text-center mt-2">
        Powered by Ollama Llama 3.2 3B • Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
};
