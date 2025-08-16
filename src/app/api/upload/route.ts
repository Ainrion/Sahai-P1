import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
// const pdfParse = require("pdf-parse");
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Extract text from PDF (simplified for now)
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // For now, we'll just indicate that it's a PDF file
    // In production, you can implement proper PDF text extraction
    return "PDF content extraction will be implemented in production.";
  } catch (error) {
    console.error("PDF parsing error:", error);
    return "";
  }
}

// Process image (resize if too large)
async function processImage(buffer: Buffer, filename: string): Promise<Buffer> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // If image is larger than 2MB or dimensions are too large, resize it
    if (
      buffer.length > 2 * 1024 * 1024 ||
      (metadata.width && metadata.width > 1920)
    ) {
      return await image
        .resize(1920, 1920, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    }

    return buffer;
  } catch (error) {
    console.error("Image processing error:", error);
    return buffer; // Return original if processing fails
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload images or PDFs only." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = path.extname(file.name);
    const filename = `${timestamp}_${randomSuffix}${fileExtension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    let extractedContent = "";

    // Process based on file type
    if (file.type === "application/pdf") {
      // Extract text from PDF
      extractedContent = await extractPdfText(buffer);
    } else if (file.type.startsWith("image/")) {
      // Process image (resize if needed)
      buffer = await processImage(buffer, filename);
    }

    // Save file
    await writeFile(filepath, buffer);

    // Return file info
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: file.name,
      type: file.type,
      size: buffer.length,
      content: extractedContent, // Only populated for PDFs
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
