"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "pending" | "uploading" | "success" | "error";
  documentId?: string;
  error?: string;
  chunksCount?: number;
}

interface DocumentUploadProps {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export function DocumentUpload({
  onUploadComplete,
  onUploadError,
  className = "",
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStats, setUploadStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      processFiles(selectedFiles);
    },
    []
  );

  const processFiles = useCallback((fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    setUploadStats((prev) => ({
      ...prev,
      total: prev.total + newFiles.length,
    }));

    // Upload each file
    newFiles.forEach((uploadFile) => {
      const actualFile = fileList.find((f) => f.name === uploadFile.name);
      if (actualFile) {
        uploadDocument(actualFile, uploadFile.id);
      }
    });
  }, []);

  const uploadDocument = async (file: File, fileId: string) => {
    try {
      // Update file status to uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "uploading" } : f))
      );

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      // Update file status to success
      const updatedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "success",
        documentId: result.documentId,
        chunksCount: result.chunksCount,
      };

      setFiles((prev) => prev.map((f) => (f.id === fileId ? updatedFile : f)));

      setUploadStats((prev) => ({ ...prev, successful: prev.successful + 1 }));

      if (onUploadComplete) {
        onUploadComplete(updatedFile);
      }
    } catch (error) {
      console.error("Upload error:", error);

      // Update file status to error
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );

      setUploadStats((prev) => ({ ...prev, failed: prev.failed + 1 }));

      if (onUploadError) {
        onUploadError(error instanceof Error ? error.message : "Upload failed");
      }
    }
  };

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setUploadStats({ total: 0, successful: 0, failed: 0 });
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case "uploading":
        return "Uploading...";
      case "success":
        return `Uploaded successfully (${file.chunksCount} chunks)`;
      case "error":
        return `Error: ${file.error}`;
      default:
        return "Pending";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto mb-4 w-12 h-12 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">
          Upload Cultural Documents
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Drag and drop files here, or click to select files
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
        >
          Select Files
        </label>
        <div className="mt-4 text-sm text-gray-500">
          Supported formats: PDF, DOC, DOCX, TXT, MD (Max 10MB each)
        </div>
      </div>

      {/* Upload Stats */}
      {uploadStats.total > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Upload Progress</h4>
            <button
              onClick={clearAllFiles}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear All
            </button>
          </div>
          <div className="mt-2 flex gap-4 text-sm">
            <span className="text-blue-600">Total: {uploadStats.total}</span>
            <span className="text-green-600">
              Success: {uploadStats.successful}
            </span>
            <span className="text-red-600">Failed: {uploadStats.failed}</span>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold">Files</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • {getStatusText(file)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>
          • Upload documents related to Indian culture, festivals, traditions,
          or customs
        </p>
        <p>
          • Files will be processed and indexed for enhanced search capabilities
        </p>
        <p>
          • All uploaded content is used to improve cultural knowledge responses
        </p>
      </div>
    </div>
  );
}
