"use client";

/**
 * SaveStatusIndicator – lives outside the TipTap editor.
 * Renders "Saving..." | "Saved ✓" | "Failed ⚠" based on status prop.
 * No save logic here — single responsibility: display.
 */
export default function SaveStatusIndicator({
  saveStatus,
  isAutoSaving,
  hasContent,
}) {
  // Don't render if there's nothing to show
  if (!hasContent || (!isAutoSaving && saveStatus === "idle")) return null;

  const isSaving = isAutoSaving || saveStatus === "saving";
  const isFailed = saveStatus === "failed";

  return (
    <div
      className="hidden md:flex items-center flex-shrink-0"
      style={{
        width: isSaving ? "98px" : isFailed ? "88px" : "78px",
        height: "33px",
        borderRadius: "4px",
        border: `1px solid ${isFailed ? "#FCA5A5" : "#EAEAEA"}`,
        padding: "6px 8px",
        gap: "8px",
        transition: "width 0.2s ease",
        backgroundColor: isFailed ? "#FEF2F2" : undefined,
      }}
    >
      {isSaving ? (
        <>
          <div className="saving-spinner" />
          <span
            style={{
              width: "56px",
              height: "21px",
              fontFamily: "Public Sans",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "150%",
              letterSpacing: "0%",
              color: "#696969",
            }}
          >
            Saving...
          </span>
        </>
      ) : isFailed ? (
        <>
          <span style={{ fontSize: "14px" }}>⚠</span>
          <span
            style={{
              fontFamily: "Public Sans",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "150%",
              color: "#DC2626",
            }}
          >
            Failed
          </span>
        </>
      ) : (
        <>
          <img
            src="/images/icons/tick4.svg"
            alt="saved"
            style={{ width: "13px", height: "13px" }}
          />
          <span
            style={{
              fontFamily: "Public Sans",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "150%",
              letterSpacing: "0%",
              color: "#696969",
            }}
          >
            Saved
          </span>
        </>
      )}
    </div>
  );
}
