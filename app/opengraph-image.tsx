import { ImageResponse } from "next/og";

/**
 * The picture that shows when someone shares a link on WhatsApp, LinkedIn or
 * Teams. Before this there was none, so links appeared as plain text
 * (7 Oct 2026). Drawn here rather than stored as a file so the wording stays
 * with the copy it comes from.
 */
export const alt = "My Care Academy — care training for UK providers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0f3f50 0%, #1d6f8a 55%, #3a9fc4 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: "#bfe4f1" }}>
          MY CARE ACADEMY · SINCE 2002
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 70, fontWeight: 700, lineHeight: 1.05, maxWidth: 940 }}>
            Care training written by people who still do the visits.
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#d7eef7" }}>
            59 CQC-aligned courses · certificates anyone can verify
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#bfe4f1" }}>mycareacademy.co.uk</div>
      </div>
    ),
    size,
  );
}
