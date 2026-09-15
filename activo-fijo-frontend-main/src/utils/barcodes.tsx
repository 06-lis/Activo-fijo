import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

// Code 39 pattern map (9 bits: 5 black, 4 white; 0 = narrow, 1 = wide)
const CODE39_MAP: Record<string, string> = {
  '0': '000110100',
  '1': '100100001',
  '2': '001100001',
  '3': '101100000',
  '4': '000110001',
  '5': '100110000',
  '6': '001110000',
  '7': '000100101',
  '8': '100100100',
  '9': '001100100',
  'A': '100001001',
  'B': '001001001',
  'C': '101001000',
  'D': '000011001',
  'E': '100011000',
  'F': '001011000',
  'G': '000001101',
  'H': '100001100',
  'I': '001001100',
  'J': '000011100',
  'K': '100000011',
  'L': '001000011',
  'M': '101000010',
  'N': '000010011',
  'O': '100010010',
  'P': '001010010',
  'Q': '000000111',
  'R': '100000110',
  'S': '001000110',
  'T': '000010110',
  'U': '110000001',
  'V': '011000001',
  'W': '111000000',
  'X': '010010001',
  'Y': '110010000',
  'Z': '011010000',
  '-': '010000101',
  '.': '110000100',
  ' ': '011000100',
  '*': '010010100',
  '$': '010101000',
  '/': '010100010',
  '+': '010001010',
  '%': '000101010'
};

interface BarcodeProps {
  value: string;
  height?: number;
  showText?: boolean;
}

/**
 * Pure SVG Code 39 Barcode Generator.
 * Zero external library dependencies, lightweight, and scalable.
 */
export function Code39Barcode({ value, height = 45, showText = true }: BarcodeProps) {
  const cleanValue = `*${value.toUpperCase()}*`;
  const narrowWidth = 1.0;
  const wideWidth = 2.5;
  const gapWidth = 1.0;

  const bars: { isBlack: boolean; width: number }[] = [];

  for (let char of cleanValue) {
    const pattern = CODE39_MAP[char];
    if (!pattern) continue; // Skip characters not supported by Code 39

    // Loop through the 9 bars (5 black, 4 white)
    for (let i = 0; i < 9; i++) {
      const isBlack = i % 2 === 0;
      const widthVal = pattern[i] === '1' ? wideWidth : narrowWidth;
      bars.push({ isBlack, width: widthVal });
    }
    // Add inter-character gap (white space)
    bars.push({ isBlack: false, width: gapWidth });
  }

  // Calculate total SVG width dynamically
  const totalWidth = bars.reduce((acc, bar) => acc + bar.width, 0);

  let currentX = 0;
  const rects: React.ReactNode[] = [];

  bars.forEach((bar, idx) => {
    if (bar.isBlack) {
      rects.push(
        <rect
          key={idx}
          x={currentX}
          y={0}
          width={bar.width}
          height={height}
          fill="black"
        />
      );
    }
    currentX += bar.width;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        {rects}
      </svg>
      {showText && (
        <span style={{ fontSize: '9px', fontFamily: 'monospace', marginTop: '2px', letterSpacing: '1px', color: 'black', fontWeight: 'bold' }}>
          {value.toUpperCase()}
        </span>
      )}
    </div>
  );
}

interface QRProps {
  value: string;
  size?: number;
}

/**
 * QR Code image generator component using npm `qrcode` library.
 */
export function QRCodeImage({ value, size = 90 }: QRProps) {
  const [qrSrc, setQrSrc] = useState<string>('');

  useEffect(() => {
    // Generate a high-resolution image (at least 400px or 4x the size) to prevent 
    // dense QR payloads from turning into blurry, unscannable pixels.
    const renderResolution = Math.max(size * 4, 400);

    QRCode.toDataURL(
      value,
      {
        width: renderResolution,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      },
      (err, url) => {
        if (!err && url) {
          setQrSrc(url);
        } else if (err) {
          console.error('QR Generation error:', err);
        }
      }
    );
  }, [value, size]);

  if (!qrSrc) {
    return <div style={{ width: size, height: size, background: '#f1f5f9' }} />;
  }

  return (
    <img
      src={qrSrc}
      alt={`QR Code: ${value}`}
      width={size}
      height={size}
      style={{ display: 'block', imageRendering: 'pixelated' }}
    />
  );
}
