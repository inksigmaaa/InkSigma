"use client";

import { useState } from "react";

export default function ArticleDropdown({
  status,
  onEdit,
  onDelete,
  onRestore,
  onPublish,
  onUnpublish,
  onRepublish,
  onDraft,
  canPublish,
  canPublishDraft = true,
  canDelete = true,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative">
      <button
        className="w-8 h-8 bg-transparent border border-gray-200 cursor-pointer flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More options"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="4" r="1.5" fill="#6B7280" />
          <circle cx="10" cy="10" r="1.5" fill="#6B7280" />
          <circle cx="10" cy="16" r="1.5" fill="#6B7280" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[99]"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute top-10 right-0 z-[100] overflow-hidden"
            style={{
              width: "147px",
              borderRadius: "8px",
              borderWidth: "1px",
              gap: "4px",
              padding: "8px",
              background: "#FEFEFE",
              border: "1px solid #EDEDED",
            }}
          >
            {status === "draft" && (
              <>
                {canPublish && (
                  <button
                    className={`flex items-center w-full text-left transition-colors border-none ${canPublishDraft ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}
                    style={{
                      width: "131px",
                      height: "26px",
                      borderRadius: "4px",
                      paddingTop: "4px",
                      paddingRight: "8px",
                      paddingBottom: "4px",
                      paddingLeft: "8px",
                      gap: "10px",
                      background: "transparent",
                      fontFamily: "Public Sans",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "150%",
                      color: "#2E2E2E",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F5F5F5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() =>
                      canPublishDraft &&
                      handleAction(onPublish || (() => console.log("Publish")))
                    }
                    disabled={!canPublishDraft}
                  >
                    <img
                      src="/images/icons/share.svg"
                      alt="publish"
                      className="shrink-0"
                      width="16"
                      height="16"
                    />
                    Publish
                  </button>
                )}
                <button
                  className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                  style={{
                    width: "131px",
                    height: "26px",
                    borderRadius: "4px",
                    paddingTop: "4px",
                    paddingRight: "8px",
                    paddingBottom: "4px",
                    paddingLeft: "8px",
                    gap: "10px",
                    background: "transparent",
                    fontFamily: "Public Sans",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "150%",
                    color: "#2E2E2E",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F5F5F5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  onClick={() =>
                    handleAction(onEdit || (() => console.log("Edit")))
                  }
                >
                  <img
                    src="/images/icons/edit.svg"
                    alt="edit"
                    className="shrink-0"
                    width="16"
                    height="16"
                  />
                  Edit
                </button>
                {canDelete && (
                  <button
                    className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                    style={{
                      width: "131px",
                      height: "26px",
                      borderRadius: "4px",
                      paddingTop: "4px",
                      paddingRight: "8px",
                      paddingBottom: "4px",
                      paddingLeft: "8px",
                      gap: "10px",
                      background: "transparent",
                      fontFamily: "Public Sans",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "150%",
                      color: "#2E2E2E",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F5F5F5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() =>
                      handleAction(onDelete || (() => console.log("Delete")))
                    }
                  >
                    <img
                      src="/images/icons/trash2.svg"
                      alt="delete"
                      className="shrink-0"
                      width="16"
                      height="16"
                    />
                    Delete
                  </button>
                )}
              </>
            )}

            {status === "trash" && (
              <>
                <button
                  className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                  style={{
                    width: "131px",
                    height: "26px",
                    borderRadius: "4px",
                    paddingTop: "4px",
                    paddingRight: "8px",
                    paddingBottom: "4px",
                    paddingLeft: "8px",
                    gap: "10px",
                    background: "transparent",
                    fontFamily: "Public Sans",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "150%",
                    color: "#2E2E2E",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F5F5F5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  onClick={() =>
                    handleAction(onRestore || (() => console.log("Restore")))
                  }
                >
                  <img
                    src="/images/icons/restore.svg"
                    alt="restore"
                    className="shrink-0"
                    width="16"
                    height="16"
                  />
                  Restore
                </button>
                {canDelete && (
                  <button
                    className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                    style={{
                      width: "131px",
                      height: "26px",
                      borderRadius: "4px",
                      paddingTop: "4px",
                      paddingRight: "8px",
                      paddingBottom: "4px",
                      paddingLeft: "8px",
                      gap: "10px",
                      background: "transparent",
                      fontFamily: "Public Sans",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "150%",
                      color: "#2E2E2E",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F5F5F5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() =>
                      handleAction(
                        onDelete || (() => console.log("Delete Permanently")),
                      )
                    }
                  >
                    <img
                      src="/images/icons/trash2.svg"
                      alt="delete"
                      className="shrink-0"
                      width="16"
                      height="16"
                    />
                    Delete Permanently
                  </button>
                )}
              </>
            )}

            {status === "review" && (
              <button
                className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                style={{
                  width: "131px",
                  height: "26px",
                  borderRadius: "4px",
                  paddingTop: "4px",
                  paddingRight: "8px",
                  paddingBottom: "4px",
                  paddingLeft: "8px",
                  gap: "10px",
                  background: "transparent",
                  fontFamily: "Public Sans",
                  fontWeight: 400,
                  fontSize: "12px",
                  lineHeight: "150%",
                  color: "#2E2E2E",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#F5F5F5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                onClick={() =>
                  handleAction(
                    onDraft || (() => console.log("Revert to Draft")),
                  )
                }
              >
                <img
                  src="/images/icons/copy.svg"
                  alt="draft"
                  className="shrink-0"
                  width="16"
                  height="16"
                />
                Revert to Draft
              </button>
            )}

            {status === "unpublished" && (
              <>
                {canPublish && (
                  <button
                    className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                    style={{
                      width: "131px",
                      height: "26px",
                      borderRadius: "4px",
                      paddingTop: "4px",
                      paddingRight: "8px",
                      paddingBottom: "4px",
                      paddingLeft: "8px",
                      gap: "10px",
                      background: "transparent",
                      fontFamily: "Public Sans",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "150%",
                      color: "#2E2E2E",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F5F5F5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() =>
                      handleAction(
                        onRepublish || (() => console.log("Republish")),
                      )
                    }
                  >
                    <img
                      src="/images/icons/publish-ideal.svg"
                      alt="republish"
                      className="shrink-0"
                      width="16"
                      height="16"
                    />
                    Republish
                  </button>
                )}
                <button
                  className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                  style={{
                    width: "131px",
                    height: "26px",
                    borderRadius: "4px",
                    paddingTop: "4px",
                    paddingRight: "8px",
                    paddingBottom: "4px",
                    paddingLeft: "8px",
                    gap: "10px",
                    background: "transparent",
                    fontFamily: "Public Sans",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "150%",
                    color: "#2E2E2E",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F5F5F5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  onClick={() =>
                    handleAction(onEdit || (() => console.log("Edit")))
                  }
                >
                  <img
                    src="/images/icons/edit-ideal.svg"
                    alt="edit"
                    className="shrink-0"
                    width="16"
                    height="16"
                  />
                  Edit
                </button>
                <button
                  className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                  style={{
                    width: "131px",
                    height: "26px",
                    borderRadius: "4px",
                    paddingTop: "4px",
                    paddingRight: "8px",
                    paddingBottom: "4px",
                    paddingLeft: "8px",
                    gap: "10px",
                    background: "transparent",
                    fontFamily: "Public Sans",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "150%",
                    color: "#2E2E2E",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F5F5F5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  onClick={() =>
                    handleAction(
                      onDraft || (() => console.log("Move to Draft")),
                    )
                  }
                >
                  <img
                    src="/images/icons/copy.svg"
                    alt="draft"
                    className="shrink-0"
                    width="16"
                    height="16"
                  />
                  Move to Draft
                </button>
                {canDelete && (
                  <button
                    className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                    style={{
                      width: "131px",
                      height: "26px",
                      borderRadius: "4px",
                      paddingTop: "4px",
                      paddingRight: "8px",
                      paddingBottom: "4px",
                      paddingLeft: "8px",
                      gap: "10px",
                      background: "transparent",
                      fontFamily: "Public Sans",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "150%",
                      color: "#2E2E2E",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F5F5F5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() =>
                      handleAction(onDelete || (() => console.log("Delete")))
                    }
                  >
                    <img
                      src="/images/icons/trash2.svg"
                      alt="delete"
                      className="shrink-0"
                      width="16"
                      height="16"
                    />
                    Delete
                  </button>
                )}
              </>
            )}

            {status === "published" && (
              <>
                {canPublish && (
                  <button
                    className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                    style={{
                      width: "131px",
                      height: "26px",
                      borderRadius: "4px",
                      paddingTop: "4px",
                      paddingRight: "8px",
                      paddingBottom: "4px",
                      paddingLeft: "8px",
                      gap: "10px",
                      background: "transparent",
                      fontFamily: "Public Sans",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "150%",
                      color: "#2E2E2E",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F5F5F5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() =>
                      handleAction(
                        onUnpublish || (() => console.log("Unpublish")),
                      )
                    }
                  >
                    <img
                      src="/images/icons/unpublished-hover.svg"
                      alt="unpublish"
                      className="shrink-0"
                      width="16"
                      height="16"
                    />
                    Unpublish
                  </button>
                )}
                <button
                  className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                  style={{
                    width: "131px",
                    height: "26px",
                    borderRadius: "4px",
                    paddingTop: "4px",
                    paddingRight: "8px",
                    paddingBottom: "4px",
                    paddingLeft: "8px",
                    gap: "10px",
                    background: "transparent",
                    fontFamily: "Public Sans",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "150%",
                    color: "#2E2E2E",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F5F5F5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  onClick={() =>
                    handleAction(onEdit || (() => console.log("Edit")))
                  }
                >
                  <img
                    src="/images/icons/edit-ideal.svg"
                    alt="edit"
                    className="shrink-0"
                    width="16"
                    height="16"
                  />
                  Edit
                </button>
                <button
                  className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                  style={{
                    width: "131px",
                    height: "26px",
                    borderRadius: "4px",
                    paddingTop: "4px",
                    paddingRight: "8px",
                    paddingBottom: "4px",
                    paddingLeft: "8px",
                    gap: "10px",
                    background: "transparent",
                    fontFamily: "Public Sans",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "150%",
                    color: "#2E2E2E",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F5F5F5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  onClick={() =>
                    handleAction(
                      onDraft || (() => console.log("Move to Draft")),
                    )
                  }
                >
                  <img
                    src="/images/icons/copy.svg"
                    alt="draft"
                    className="shrink-0"
                    width="16"
                    height="16"
                  />
                  Move to Draft
                </button>
                {canDelete && (
                  <button
                    className="flex items-center w-full text-left cursor-pointer transition-colors border-none"
                    style={{
                      width: "131px",
                      height: "26px",
                      borderRadius: "4px",
                      paddingTop: "4px",
                      paddingRight: "8px",
                      paddingBottom: "4px",
                      paddingLeft: "8px",
                      gap: "10px",
                      background: "transparent",
                      fontFamily: "Public Sans",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "150%",
                      color: "#2E2E2E",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F5F5F5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() =>
                      handleAction(onDelete || (() => console.log("Delete")))
                    }
                  >
                    <img
                      src="/images/icons/trash2.svg"
                      alt="delete"
                      className="shrink-0"
                      width="16"
                      height="16"
                    />
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
