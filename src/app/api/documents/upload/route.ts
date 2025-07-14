import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  processUploadedFile,
  validateFile,
  generateBasicEmbedding,
} from "../../../lib/fileProcessor";
import { addDocument } from "../../../lib/weaviate";
import { UploadResponse } from "../../../types/vector";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string;
    const tagsString = formData.get("tags") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate file
    const validation = validateFile(file.name, file.size, buffer);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Process file to extract text
    const processingResult = await processUploadedFile(
      file.name,
      buffer,
      validation.fileType!
    );

    if (!processingResult.success) {
      return NextResponse.json(
        { error: processingResult.error },
        { status: 500 }
      );
    }

    // Generate embedding for the document
    const embedding = generateBasicEmbedding(processingResult.content);

    // Prepare document for Weaviate
    const documentData = {
      fileName: file.name,
      content: processingResult.content,
      fileType: validation.fileType!,
      fileSize: file.size,
      chunks: processingResult.chunks,
      vector: embedding,
    };

    // Add document to Weaviate
    const weaviateResult = await addDocument(documentData);

    if (!weaviateResult.success) {
      return NextResponse.json(
        { error: `Failed to store document: ${weaviateResult.error}` },
        { status: 500 }
      );
    }

    const response: UploadResponse = {
      success: true,
      documentId: weaviateResult.id,
      fileName: file.name,
      fileSize: file.size,
      chunksCount: processingResult.chunks.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return upload guidelines and supported file types
    return NextResponse.json({
      supportedTypes: ["pdf", "doc", "docx", "txt", "md"],
      maxFileSize: "10MB",
      maxFiles: 10,
      guidelines: [
        "Upload documents related to Indian culture, festivals, traditions, or customs",
        "Supported formats: PDF, DOC, DOCX, TXT, MD",
        "Maximum file size: 10MB",
        "Files will be processed and indexed for RAG search",
        "Uploaded documents will be chunked for better retrieval",
      ],
    });
  } catch (error) {
    console.error("Upload info error:", error);
    return NextResponse.json(
      { error: "Failed to get upload information" },
      { status: 500 }
    );
  }
}
