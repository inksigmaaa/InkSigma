export default function TiptapEditorStyles() {
  return (
          <style jsx global>{`
            button:hover {
              border-bottom: none !important;
            }
            button:focus {
              border-bottom: none !important;
              outline: none !important;
            }
    
            .voice-dictation-control {
              position: fixed;
              right: 24px;
              bottom: 128px;
              z-index: 90;
              display: flex;
              justify-content: flex-end;
              pointer-events: none;
            }
    
            .ai-selection-toolbar {
              position: fixed;
              z-index: 120;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              border: 1px solid rgba(226, 232, 240, 0.95);
              border-radius: 14px;
              background: rgba(255, 255, 255, 0.98);
              padding: 6px;
              max-width: calc(100vw - 24px);
              overflow: hidden;
              box-shadow:
                0 18px 34px rgba(15, 23, 42, 0.14),
                0 6px 14px rgba(15, 23, 42, 0.08);
              backdrop-filter: blur(14px);
            }
    
            .ai-selection-scroll {
              display: flex;
              align-items: center;
              justify-content: flex-start;
              gap: 6px;
              width: 100%;
              max-width: 100%;
              overflow: visible;
              scrollbar-width: none;
            }
    
            .ai-selection-badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              height: 36px;
              padding: 0 12px;
              border-radius: 10px;
              background: #0f172a;
              color: #ffffff;
              font-size: 13px;
              font-weight: 600;
              flex-shrink: 0;
            }
    
            .ai-selection-button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              height: 36px;
              padding: 0 12px;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              background: #ffffff;
              color: #334155;
              font-size: 13px;
              font-weight: 600;
              transition:
                border-color 160ms ease,
                background-color 160ms ease,
                color 160ms ease,
                transform 160ms ease;
              flex-shrink: 0;
            }
    
            .ai-selection-button:hover:not(:disabled) {
              border-color: #cbd5e1;
              background: #f8fafc;
              color: #0f172a;
            }
    
            .ai-selection-button:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
    
            .ai-selection-button[data-primary="true"] {
              background: #f8fafc;
              color: #0f172a;
            }
    
            .ai-selection-divider {
              width: 1px;
              height: 20px;
              background: #e2e8f0;
              flex-shrink: 0;
            }
    
            .ai-selection-menu {
              min-width: 188px;
              padding: 6px;
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.98);
              box-shadow:
                0 18px 34px rgba(15, 23, 42, 0.14),
                0 6px 14px rgba(15, 23, 42, 0.08);
              backdrop-filter: blur(14px);
            }
    
            .ai-selection-menu-header {
              padding: 6px 8px 8px;
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
            }
    
            .ai-selection-menu-item {
              display: flex;
              width: 100%;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              border: 0;
              border-radius: 10px;
              background: transparent;
              padding: 9px 10px;
              color: #1e293b;
              font-size: 13px;
              font-weight: 600;
              text-align: left;
            }
    
            .ai-selection-menu-item:hover:not(:disabled) {
              background: #f8fafc;
            }
    
            .ai-selection-scroll::-webkit-scrollbar {
              display: none;
            }
    
            .ai-editor-accept-flash {
              animation: ai-editor-flash 420ms ease-out;
            }
    
            .ai-suggestion-review {
              position: fixed;
              z-index: 121;
              width: 420px;
              max-height: calc(100vh - 24px);
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              background: #ffffff;
              color: #1a1a2e;
              overflow: hidden;
              box-shadow:
                0 18px 42px rgba(15, 23, 42, 0.13),
                0 5px 16px rgba(15, 23, 42, 0.08);
              animation: ai-popup-in 150ms ease-out both;
            }
    
            .ai-popup-mobile-handle {
              display: none;
            }
    
            .ai-popup-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              min-height: 42px;
              border-bottom: 1px solid #e2e8f0;
              background: #f8fafc;
              color: #0f172a;
              padding: 0 12px;
            }
    
            .ai-popup-body {
              max-height: min(360px, calc(100vh - 96px), 56vh);
              overflow-y: auto;
              padding: 12px;
            }
    
            .ai-popup-label {
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0;
              text-transform: uppercase;
              color: #64748b;
            }
    
            .ai-diff-box {
              margin-top: 6px;
              border-radius: 7px;
              border: 1px solid #e2e8f0;
              padding: 9px;
              font-size: 13px;
              line-height: 1.6;
              color: #334155;
            }
    
            .ai-diff-delete {
              border-radius: 4px;
              background: rgba(255, 77, 77, 0.13);
              color: #ef4444;
              text-decoration: line-through;
              text-decoration-color: #ef4444;
            }
    
            .ai-diff-insert {
              border-radius: 4px;
              background: rgba(34, 197, 94, 0.13);
              color: #22c55e;
            }
    
            .ai-change-badge {
              display: inline-flex;
              align-items: center;
              border-radius: 9999px;
              background: #f1f5f9;
              color: #475569;
              padding: 4px 9px;
              font-size: 12px;
              font-weight: 600;
            }
    
            .ai-popup-skeleton {
              height: 78px;
              border-radius: 7px;
              background: linear-gradient(
                90deg,
                #f1f5f9 0%,
                #e2e8f0 45%,
                #f1f5f9 90%
              );
              background-size: 220% 100%;
              animation: ai-shimmer 1.2s ease-in-out infinite;
            }
    
            .ai-spin-sparkle {
              animation: ai-spin 900ms linear infinite;
            }
    
            @keyframes ai-popup-in {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
    
            @keyframes ai-shimmer {
              from {
                background-position: 120% 0;
              }
              to {
                background-position: -120% 0;
              }
            }
    
            @keyframes ai-spin {
              to {
                transform: rotate(360deg);
              }
            }
    
            @keyframes ai-editor-flash {
              0% {
                background: rgba(34, 197, 94, 0);
              }
              35% {
                background: rgba(34, 197, 94, 0.14);
              }
              100% {
                background: rgba(34, 197, 94, 0);
              }
            }
    
            .voice-dictation-shell {
              pointer-events: auto;
              display: flex;
              justify-content: flex-end;
              align-items: center;
              overflow: hidden;
              height: 56px;
              border: 1px solid #e5e7eb;
              border-radius: 9999px;
              background: #ffffff;
              box-shadow:
                0 14px 30px rgba(15, 23, 42, 0.08),
                0 4px 12px rgba(15, 23, 42, 0.08);
              transform-origin: right center;
              transition:
                width 360ms cubic-bezier(0.22, 1, 0.36, 1),
                border-color 260ms ease,
                box-shadow 260ms ease,
                opacity 220ms ease,
                transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
              will-change: width, border-color, box-shadow, opacity, transform;
            }
    
            .voice-dictation-shell[data-state="idle"],
            .voice-dictation-shell[data-state="requesting"] {
              width: 56px;
            }
    
            .voice-dictation-shell[data-state="recording"] {
              width: 196px;
              border-color: #fecaca;
              box-shadow:
                0 16px 34px rgba(239, 68, 68, 0.1),
                0 5px 14px rgba(15, 23, 42, 0.08);
            }
    
            .voice-dictation-shell[data-state="transcribing"] {
              width: 172px;
            }
    
            .voice-dictation-panel {
              flex-shrink: 0;
              height: 56px;
              animation: voice-panel-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }
    
            @keyframes voice-panel-in {
              from {
                opacity: 0;
                transform: translateX(14px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
    
            @media (min-width: 1280px) {
              .voice-dictation-control {
                right: calc(50% - 444px);
              }
            }
    
            @media (max-width: 767px) {
              .voice-dictation-control {
                right: 18px;
                bottom: 118px;
              }
    
              .ai-selection-toolbar {
                max-width: calc(100vw - 24px);
              }
    
              .ai-selection-scroll {
                justify-content: flex-start;
                flex-wrap: nowrap;
                overflow-x: auto;
              }
    
              .ai-suggestion-review {
                left: 0 !important;
                right: 0;
                top: auto !important;
                bottom: 0;
                width: 100vw !important;
                max-height: 60vh;
                border-radius: 16px 16px 0 0;
                animation: ai-bottom-sheet-in 150ms ease-out both;
              }
    
              .ai-popup-body {
                max-height: calc(60vh - 48px);
                padding-top: 18px;
              }
    
              .ai-popup-mobile-handle {
                display: block;
              }
    
              @keyframes ai-bottom-sheet-in {
                from {
                  opacity: 0;
                  transform: translateY(24px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
    
              .voice-dictation-shell[data-state="recording"] {
                width: 188px;
              }
            }
          `}</style>
  );
}
