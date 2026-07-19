import { ImageResponse } from "next/og";

// Branded iOS/home-screen icon (and the maskable PWA icon). Full-bleed brand
// gradient with the WiFi mark centered inside the maskable safe zone.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0AA6F5, #17D6E9)",
      }}
    >
      <svg
        width="120"
        height="120"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 32 A20 20 0 0 1 46 32"
          stroke="#ffffff"
          strokeWidth={5}
          strokeLinecap="round"
        />
        <path
          d="M24 39 A11 11 0 0 1 40 39"
          stroke="#ffffff"
          strokeWidth={5}
          strokeLinecap="round"
        />
        <circle cx="32" cy="46" r="3.6" fill="#ffffff" />
      </svg>
    </div>,
    { ...size },
  );
}
