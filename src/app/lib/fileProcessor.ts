import * as pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
import { FileProcessingResult } from "../types/vector";

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfData = await pdfParse(buffer);
    return pdfData.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Extract text from DOC/DOCX file
 */
export async function extractTextFromDoc(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOC:", error);
    throw new Error("Failed to extract text from DOC file");
  }
}

/**
 * Extract text from TXT file
 */
export async function extractTextFromTxt(buffer: Buffer): Promise<string> {
  try {
    return buffer.toString("utf-8");
  } catch (error) {
    console.error("Error extracting text from TXT:", error);
    throw new Error("Failed to extract text from TXT file");
  }
}

/**
 * Process uploaded file and extract text content
 */
export async function processUploadedFile(
  fileName: string,
  buffer: Buffer,
  fileType: string
): Promise<FileProcessingResult> {
  try {
    let content = "";
    const lowerFileType = fileType.toLowerCase();

    switch (lowerFileType) {
      case "pdf":
        content = await extractTextFromPDF(buffer);
        break;
      case "doc":
      case "docx":
        content = await extractTextFromDoc(buffer);
        break;
      case "txt":
      case "md":
        content = await extractTextFromTxt(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    if (!content.trim()) {
      throw new Error("No text content found in the file");
    }

    // Split content into chunks for better processing
    const chunks = splitIntoChunks(content);

    return {
      success: true,
      fileName,
      content,
      chunks,
    };
  } catch (error) {
    console.error("File processing error:", error);
    return {
      success: false,
      fileName,
      content: "",
      chunks: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Split text into chunks for better vector processing
 */
export function splitIntoChunks(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    // If adding this sentence would exceed chunk size, start a new chunk
    if (
      currentChunk.length + trimmedSentence.length > chunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());

      // Create overlap with previous chunk
      const words = currentChunk.split(" ");
      const overlapWords = words.slice(-Math.floor(overlap / 10)); // Approximate overlap
      currentChunk = overlapWords.join(" ") + " " + trimmedSentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + trimmedSentence;
    }
  }

  // Add the last chunk if it has content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If no chunks were created (very short text), return the original text
  if (chunks.length === 0) {
    chunks.push(text.trim());
  }

  return chunks;
}

/**
 * Validate file type and size
 */
export function validateFile(
  fileName: string,
  fileSize: number,
  buffer: Buffer
): {
  valid: boolean;
  error?: string;
  fileType?: string;
} {
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const supportedTypes = ["pdf", "doc", "docx", "txt", "md"];

  // Get file extension
  const fileExtension = fileName.split(".").pop()?.toLowerCase();

  if (!fileExtension) {
    return { valid: false, error: "File must have an extension" };
  }

  if (!supportedTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `Unsupported file type. Supported types: ${supportedTypes.join(
        ", "
      )}`,
    };
  }

  if (fileSize > maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds limit of ${maxFileSize / (1024 * 1024)}MB`,
    };
  }

  if (buffer.length === 0) {
    return { valid: false, error: "File is empty" };
  }

  return { valid: true, fileType: fileExtension };
}

/**
 * Clean and normalize text content
 */
export function cleanTextContent(text: string): string {
  return text
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, "\n\n") // Remove excessive line breaks
    .replace(/[^\w\s\u0900-\u097F\u00A0-\u024F.,!?;:()\-"']/g, "") // Keep alphanumeric, Hindi, and basic punctuation
    .trim();
}

/**
 * Generate simple embeddings using character frequency (fallback method)
 * This is a basic implementation - in production, you'd use a proper embedding model
 */
export function generateBasicEmbedding(text: string): number[] {
  const cleanText = cleanTextContent(text.toLowerCase());
  const charFreq: Record<string, number> = {};

  // Count character frequencies
  for (const char of cleanText) {
    if (char.match(/[a-z\u0900-\u097F]/)) {
      charFreq[char] = (charFreq[char] || 0) + 1;
    }
  }

  // Create a fixed-size embedding vector (384 dimensions)
  const embedding = new Array(384).fill(0);
  const chars = Object.keys(charFreq);

  for (let i = 0; i < Math.min(chars.length, 384); i++) {
    const char = chars[i];
    embedding[i] = charFreq[char] / cleanText.length;
  }

  // Normalize the vector
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}
