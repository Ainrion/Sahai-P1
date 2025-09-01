"use client";

import React, { useState, useRef } from "react";
import {
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Upload,
  Loader,
} from "lucide-react";

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  content?: string; // For extracted text from PDFs
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  disabled = false,
  maxFiles = 3,
  maxSize = 10, // 10MB default
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    "application/pdf": [".pdf"],
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    processFiles(fileArray);
  };

  const processFiles = async (files: File[]) => {
    if (uploadedFiles.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);

    try {
      const newFiles: UploadedFile[] = [];

      for (const file of files) {
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB`);
          continue;
        }

        // Check file type
        const isValidType = Object.keys(acceptedTypes).some((type) => {
          if (type === "image/*") {
            return file.type.startsWith("image/");
          }
          return file.type === type;
        });

        if (!isValidType) {
          alert(
            `File ${file.name} is not supported. Please upload images or PDFs only.`
          );
          continue;
        }

        // Create FormData and upload
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const uploadResult = await uploadResponse.json();

        const uploadedFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          url: uploadResult.url,
          content: uploadResult.content, // Extracted text for PDFs
        };

        newFiles.push(uploadedFile);
      }

      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      onFilesUploaded(updatedFiles);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter((file) => file.id !== fileId);
    setUploadedFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="w-4 h-4 text-blue-500" />;
    } else if (type === "application/pdf") {
      return <FileText className="w-4 h-4 text-red-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="text-center">
          <div className="flex justify-center mb-2">
            {isUploading ? (
              <Loader className="w-6 h-6 text-blue-500 animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <p className="text-sm text-gray-600">
            {isUploading
              ? "Uploading..."
              : "Drop files here or click to upload"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Images (PNG, JPG, GIF, WebP) or PDFs up to {maxSize}MB
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={Object.entries(acceptedTypes)
          .map(([key, extensions]) =>
            key === "image/*" ? "image/*" : extensions.join(",")
          )
          .join(",")}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </p>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
            >
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Attach Button for Mobile */}
      <button
        onClick={() => !disabled && fileInputRef.current?.click()}
        disabled={disabled || uploadedFiles.length >= maxFiles}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Paperclip className="w-4 h-4" />
        <span>Attach files</span>
      </button>
    </div>
  );
};
