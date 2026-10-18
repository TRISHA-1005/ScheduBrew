"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CustomerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Report the error for local development; avoid displaying raw details to customers.
    console.error("ScheduBrew customer page error", error);
  }, [error]);

  return (
    <main role="alert" style={{ minHeight: "70vh", background: "#f8f9fc", padding: "clamp(30px, 8vw, 90px) 20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 590, margin: "0 auto", padding: "clamp(22px, 5vw, 40px)", background: "white", border: "1px solid #e6eaf0", borderRadius: 18, color: "#0c1031" }}>
        <span style={{ color: "#d7612d", fontSize: 12, fontWeight: 800 }}>SCHEDUBREW</span>
        <h1 style={{ fontSize: 28, lineHeight: 1.2, margin: "12px 0" }}>This page could not load</h1>
        <p style={{ color: "#68748c", fontSize: 14, lineHeight: 1.7 }}>Your demo data should still be in this browser. Try reloading this page, or return to Discover Shops.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
          <button type="button" onClick={() => reset()} style={{ cursor: "pointer", padding: "12px 20px", color: "white", background: "#0c1031", border: 0, borderRadius: 9, fontWeight: 700 }}>Try again</button>
          <Link href="/customer" style={{ padding: "12px 20px", color: "#b34c23", border: "1px solid #e8d4ca", borderRadius: 9, fontWeight: 700, textDecoration: "none" }}>Return to Discover</Link>
        </div>
      </div>
    </main>
  );
}
