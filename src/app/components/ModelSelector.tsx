"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Bot, CheckCircle, AlertCircle } from "lucide-react";

export interface Provider {
  id: string;
  name: string;
  model: string;
  description: string;
  available: boolean;
}

interface ModelSelectorProps {
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  disabled = false,
}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [unavailableProviders, setUnavailableProviders] = useState<Provider[]>(
    []
  );
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/providers");
      const data = await response.json();
      setProviders(data.available || []);
      setUnavailableProviders(data.unavailable || []);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProviderInfo =
    providers.find((p) => p.id === selectedProvider) || providers[0];

  const handleProviderSelect = (providerId: string) => {
    onProviderChange(providerId);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
        <Bot className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-500">Loading models...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <Bot className="w-4 h-4 text-blue-600" />
        <div className="flex items-center min-w-0">
          <span className="text-sm font-medium text-gray-900 truncate">
            {selectedProviderInfo?.name || "Select Model"}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto min-w-[320px] w-max">
          <div className="p-4">
            <div className="text-sm font-semibold text-gray-700 px-2 py-2 mb-3 border-b border-gray-100">
              Available Models ({providers.length})
            </div>
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderSelect(provider.id)}
                className={`w-full flex items-start space-x-4 px-4 py-4 rounded-lg hover:bg-gray-50 transition-colors border ${
                  selectedProvider === provider.id
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "border-transparent hover:border-gray-200"
                }`}
              >
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">
                      {provider.name}
                    </span>
                    {selectedProvider === provider.id && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {provider.description}
                  </div>
                </div>
              </button>
            ))}

            {unavailableProviders.length > 0 && (
              <>
                <div className="text-sm font-semibold text-gray-700 px-2 py-2 mt-6 mb-3 border-b border-gray-100">
                  Unavailable Models ({unavailableProviders.length})
                </div>
                {unavailableProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="w-full flex items-start space-x-4 px-4 py-4 rounded-lg border border-transparent opacity-60"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-gray-700">
                          {provider.name}
                        </span>
                        <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                          API Key Required
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1 leading-relaxed">
                        {provider.description}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
