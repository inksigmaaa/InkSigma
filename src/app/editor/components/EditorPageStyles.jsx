export default function EditorPageStyles() {
  return (
          <style jsx global>{`
            input.title-input::placeholder,
            input.desc-input::placeholder {
              color: #d2d2d2;
            }
    
            input.date-time-input::placeholder {
              color: #b8b8b8;
            }
    
            .saving-spinner {
              width: 16px;
              height: 16px;
              border: 2px solid #8aa4ff4d;
              border-top: 2px solid #2659bc;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
            }
    
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
    
            .stats-bar-container {
              position: fixed;
              display: flex;
              align-items: center;
              justify-content: flex-end;
              height: 39px;
              z-index: 100;
              bottom: 72px;
              left: 0;
              right: 0;
              border-top: 1px solid #eaeaea;
              background: #ffffff;
            }
    
            @media (min-width: 1280px) {
              .stats-bar-container {
                left: calc(50% - 448px);
                right: auto;
                width: 916px;
              }
            }
    
            @media (max-width: 767px) {
              .mobile-publish-btn {
                min-width: 74px;
                padding: 8px 16px;
                font-size: 12px;
                line-height: 150%;
              }
    
              .mobile-schedule-container {
                min-width: 212px;
                max-width: 212px;
                flex-shrink: 0;
              }
    
              .mobile-schedule-container .date-time-input:first-of-type {
                width: 76px;
              }
    
              .mobile-schedule-container .date-time-input:nth-of-type(2) {
                width: 36px;
                margin-left: 4px;
              }
    
              .mobile-schedule-container > div {
                padding-left: 6px;
                padding-right: 6px;
              }
    
              .mobile-schedule-container svg {
                margin-left: 4px;
                margin-right: 0;
              }
    
              .mobile-schedule-btn {
                min-width: 64px;
                max-width: 64px;
                padding: 8px 4px;
                font-size: 12px;
                line-height: 150%;
              }
    
              .mobile-footer-buttons {
                gap: 8px;
                flex-wrap: nowrap;
              }
            }
          `}</style>
  );
}
