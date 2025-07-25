import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file: File | null = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ message: "No file received" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filename = file.name.replace(/[^a-z0-9.-]/gi, "_").toLowerCase();

  try {
    await writeFile(path.join(uploadDir, filename), buffer);
    return NextResponse.json({ message: "File uploaded successfully" });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ message: "Failed to save file" }, { status: 500 });
  }
}
