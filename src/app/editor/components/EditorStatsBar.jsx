export default function EditorStatsBar({ charCount, wordCount }) {
  const labelStyle = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontFamily: "Public Sans",
    fontWeight: 400,
    fontSize: "14px",
    lineHeight: "150%",
    letterSpacing: "0%",
    whiteSpace: "nowrap",
  };

  const valueStyle = {
    fontFamily: "Public Sans",
    fontWeight: 600,
    fontSize: "14px",
    lineHeight: "100%",
    letterSpacing: "0%",
  };

  return (
    <div className="stats-bar-container">
      <div
        className="flex items-center h-full"
        style={{
          gap: "14px",
          padding: "9px 14px",
          background: "#F8F8F8",
          border: "1px solid #F3F3F3",
        }}
      >
        <div style={labelStyle}>
          <span>Chars</span>
          <strong style={valueStyle}>{charCount}</strong>
        </div>
        <div
          style={{ width: "1px", height: "21px", background: "#C0C0C0" }}
        />
        <div style={labelStyle}>
          <span>Words</span>
          <strong style={valueStyle}>{wordCount}</strong>
        </div>
      </div>
    </div>
  );
}
