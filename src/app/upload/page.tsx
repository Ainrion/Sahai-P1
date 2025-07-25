'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onload = () => {
        setMessage(`File loaded: ${selected.name}`);
        console.log('File contents:', reader.result); // for text files
      };
      reader.readAsText(selected);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <label
        htmlFor="hidden-upload"
        style={{
          display: 'inline-block',
          width: '80px',
          height: '80px',
          fontSize: '48px',
          lineHeight: '80px',
          textAlign: 'center',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        +
      </label>

      <input
        id="hidden-upload"
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <p style={{ marginTop: '1rem' }}>{message || 'No file selected'}</p>
    </div>
  );
}
