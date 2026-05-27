"use client";
import { useState } from "react";

interface SchoolLogoProps {
  size?: number;
  className?: string;
  wrapperStyle?: React.CSSProperties;
}

export function SchoolLogo({ size = 40, className, wrapperStyle }: SchoolLogoProps) {
  const [imgError, setImgError] = useState(false);
  const [svgError, setSvgError] = useState(false);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: size * 0.18,
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    ...wrapperStyle,
  };

  if (!imgError) {
    return (
      <div style={containerStyle} className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="ALHI"
          style={{ width: size * 0.92, height: size * 0.92, objectFit: "contain" }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  if (!svgError) {
    return (
      <div style={{ ...containerStyle, background: "white", padding: "2px" }} className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="ALHI"
          style={{ width: size * 1.2, height: size * 0.45, objectFit: "contain" }}
          onError={() => setSvgError(true)}
        />
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle, background: "#1A1A1A", flexDirection: "column", gap: "1px" }} className={className}>
      <svg viewBox="0 0 40 28" width={size * 0.8} height={size * 0.56}>
        <ellipse cx="22" cy="14" rx="13" ry="12" fill="#c4b5a0" opacity="0.45" />
        <text x="2" y="22" fontFamily="Arial Black,Arial" fontSize="20" fontWeight="900" fill="#B91C2F">ali</text>
        <circle cx="33" cy="5" r="3" fill="#B91C2F" />
      </svg>
    </div>
  );
}
