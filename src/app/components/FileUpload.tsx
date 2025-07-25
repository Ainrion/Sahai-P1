"use client";

import { useRef, useState } from "react";

export default function FileUploader({ onFileRead }: { onFileRead: (content: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("No file selected");

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      onFileRead(text);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <div
        onClick={handleClick}
        style={{
          border: "2px dashed #ccc",
          borderRadius: "8px",
          padding: "2rem",
          cursor: "pointer",
          display: "inline-block",
          width: "100px",
          height: "100px",
        }}
      >
        <span style={{ fontSize: "3rem", lineHeight: "100px" }}>+</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".txt"
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <p>{fileName}</p>
    </div>
  );
}
