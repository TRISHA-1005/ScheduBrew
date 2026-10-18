export default function Loading() {
  return (
    <main aria-label="Loading customer page" role="status" style={{ minHeight: "65vh", background: "#f8f9fc", padding: "56px 6%", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", color: "#0c1031" }}>
        <strong style={{ fontSize: 27 }}>Schedu<span style={{ color: "#d7612d" }}>Brew</span></strong>
        <p style={{ marginTop: 26, color: "#64718b" }}>Loading your customer page…</p>
        <div style={{ height: 145, background: "#e9edf3", borderRadius: 16, marginTop: 20 }} />
        <div style={{ height: 110, background: "#f0f2f6", borderRadius: 16, marginTop: 18 }} />
      </div>
    </main>
  );
}
