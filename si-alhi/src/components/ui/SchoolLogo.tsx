"use client";

interface SchoolLogoProps {
  size?: number;
  className?: string;
  wrapperStyle?: React.CSSProperties;
}

export function SchoolLogo({ size = 40, className, wrapperStyle }: SchoolLogoProps) {
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
    padding: Math.max(2, size * 0.06),
    ...wrapperStyle,
  };

  return (
    <div style={containerStyle} className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-alhi.svg" alt="ALI" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
}
