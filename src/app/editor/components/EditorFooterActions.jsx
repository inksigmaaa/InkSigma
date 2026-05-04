export default function EditorFooterActions({
  existingBlogStatus,
  isSaving,
  canPublishCurrentArticle,
  publicationId,
  currentPublication,
  dateError,
  timeError,
  dateInput,
  timeInput,
  selectedDate,
  selectedTime,
  handleSave,
  handleDraft,
  handleRevertFromTrash,
  handlePublish,
  handleSendForReview,
  handleDateInputChange,
  handleDateInputBlur,
  handleTimeInputChange,
  handleTimeInputBlur,
  toggleSchedulePicker,
  handleScheduleAction,
}) {
  return (
    <>
          {/* Footer */}
          <div className="fixed bottom-0 left-0 right-0 w-full h-[72px] flex items-center justify-center bg-white rounded-lg pt-4 pr-4 pb-6 pl-4 shadow-lg z-[100]">
            <div className="mobile-footer-buttons flex items-center justify-center md:gap-4 h-8 flex-wrap max-w-full">
              {/* Show different buttons based on article status */}
              {existingBlogStatus === "published" ? (
                <>
                  <button
                    className="flex items-center justify-center gap-2 h-8 rounded px-6 py-2 transition-colors disabled:opacity-50"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      width: "160px",
                      height: "32px",
                      borderRadius: "4px",
                      padding: "8px 24px",
                      background: "#080808",
                      fontFamily: "Public Sans",
                      fontWeight: 500,
                      fontSize: "14px",
                      lineHeight: "150%",
                      letterSpacing: "0%",
                      color: "#EDEDED",
                    }}
                  >
                    {isSaving ? "Updating..." : "Update"}
                  </button>
    
                  <button
                    className="flex items-center justify-center rounded transition-colors disabled:opacity-50"
                    onClick={handleDraft}
                    disabled={isSaving}
                    style={{
                      width: "160px",
                      height: "32px",
                      borderRadius: "4px",
                      border: "1px solid #F3F3F3",
                      padding: "8px 24px",
                      gap: "4px",
                      background: "#F8F8F8",
                      fontFamily: "Public Sans",
                      fontWeight: 500,
                      fontSize: "14px",
                      lineHeight: "150%",
                      letterSpacing: "0%",
                      color: "#2E2E2E",
                    }}
                  >
                    <img
                      src="/images/icons/draft.svg"
                      alt="Revert to draft"
                      className="w-5 h-5"
                      style={{ filter: "brightness(0) saturate(100%)" }}
                    />
                    <span className="whitespace-nowrap">Revert to Draft</span>
                  </button>
                </>
              ) : existingBlogStatus === "trash" ? (
                <>
                  <button
                    className="flex items-center justify-center gap-2 h-8 rounded px-6 py-2 transition-colors disabled:opacity-50"
                    onClick={handleRevertFromTrash}
                    disabled={isSaving}
                    style={{
                      width: "160px",
                      height: "32px",
                      borderRadius: "4px",
                      padding: "8px 24px",
                      background: "#080808",
                      fontFamily: "Public Sans",
                      fontWeight: 500,
                      fontSize: "14px",
                      lineHeight: "150%",
                      letterSpacing: "0%",
                      color: "#EDEDED",
                    }}
                  >
                    {isSaving ? "Reverting..." : "Revert to Draft"}
                  </button>
                </>
              ) : existingBlogStatus === "scheduled" ? (
                <>
                  <button
                    className="flex items-center justify-center gap-2 h-8 rounded bg-gray-900 text-sm text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                    style={{
                      minWidth: "74px",
                      width: "auto",
                      padding: "0 1rem",
                    }}
                    onClick={handlePublish}
                    disabled={isSaving || !canPublishCurrentArticle}
                  >
                    {isSaving ? "Publishing..." : "Publish Now"}
                    <img
                      src="/images/icons/Publish.svg"
                      alt="Publish"
                      className="w-4 h-4 brightness-0 invert"
                    />
                  </button>
    
                  <div
                    className="flex items-center h-8"
                    style={{
                      width: "auto",
                      maxWidth: "100%",
                    }}
                  >
                    <div
                      className={`flex items-center h-8 border rounded overflow-hidden ${
                        dateError || timeError ? "border-red-300" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center h-full pl-2 pr-2">
                        <input
                          type="text"
                          placeholder="dd-mm-yyyy"
                          value={dateInput}
                          onChange={handleDateInputChange}
                          onBlur={handleDateInputBlur}
                          maxLength={10}
                          className="date-time-input h-[21px] w-[98px] text-sm bg-transparent outline-none"
                          aria-invalid={Boolean(dateError)}
                          title={dateError || "Date format: dd-mm-yyyy"}
                          style={{ color: "#2e2e2e", fontWeight: 500 }}
                        />
                        <input
                          type="text"
                          placeholder="--:--"
                          value={timeInput}
                          onChange={handleTimeInputChange}
                          onBlur={handleTimeInputBlur}
                          maxLength={5}
                          className="date-time-input h-[21px] w-[50px] text-sm bg-transparent outline-none ml-2"
                          aria-invalid={Boolean(timeError)}
                          title={timeError || "24-hour format: HH:mm"}
                          style={{ color: "#2e2e2e", fontWeight: 500 }}
                        />
                        <svg
                          className="w-4 h-4 flex-shrink-0 cursor-pointer ml-2"
                          fill="none"
                          stroke="#2e2e2e"
                          viewBox="0 0 24 24"
                          onClick={toggleSchedulePicker}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <span
                        className="text-sm flex-shrink-0 h-full flex items-center justify-center border-l border-gray-200 cursor-pointer px-3 hover:bg-gray-200 transition-colors"
                        style={{
                          backgroundColor: "#F8F8F8",
                          color: selectedDate && selectedTime ? "#2E2E2E" : "#C8C8C8",
                          opacity: isSaving ? 0.5 : 1,
                          pointerEvents: isSaving ? "none" : "auto",
                        }}
                        onClick={handleScheduleAction}
                      >
                        Reschedule
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* For authors in joined publications, show "Send for Review" button */}
                  {/* Editors get same controls as admin (Publish + Schedule) */}
                  {publicationId &&
                  currentPublication &&
                  !currentPublication.isOwner &&
                  currentPublication.role === "author" ? (
                    <button
                      className="flex items-center justify-center gap-2 h-8 rounded bg-gray-900 text-sm text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                      style={{
                        minWidth: "74px",
                        width: "auto",
                        padding: "0 1rem",
                      }}
                      onClick={handleSendForReview}
                      disabled={isSaving}
                    >
                      {isSaving ? "Sending..." : "Send for Review"}
                    </button>
                  ) : (
                    <>
                      <button
                        className="md:w-40 flex items-center justify-center gap-2 h-8 rounded bg-gray-900 md:px-6 md:py-2 text-sm text-white hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap mobile-publish-btn"
                        onClick={handlePublish}
                        disabled={isSaving || !canPublishCurrentArticle}
                      >
                        {isSaving ? "Publishing..." : "Publish"}
                        <img
                          src="/images/icons/Publish.svg"
                          alt="Publish"
                          className="w-4 h-4 brightness-0 invert"
                        />
                      </button>
    
                      <div
                        className={`flex items-center h-8 border rounded overflow-hidden mobile-schedule-container ${
                          dateError || timeError ? "border-red-300" : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center h-full px-2">
                          <input
                            type="text"
                            placeholder="dd-mm-yyyy"
                            value={dateInput}
                            onChange={handleDateInputChange}
                            onBlur={handleDateInputBlur}
                            maxLength={10}
                            className="date-time-input h-[21px] w-[86px] text-xs md:text-sm bg-transparent outline-none"
                            aria-invalid={Boolean(dateError)}
                            title={dateError || "Date format: dd-mm-yyyy"}
                            style={{ color: "#2e2e2e", fontWeight: 500 }}
                          />
                          <input
                            type="text"
                            placeholder="--:--"
                            value={timeInput}
                            onChange={handleTimeInputChange}
                            onBlur={handleTimeInputBlur}
                            maxLength={5}
                            className="date-time-input h-[21px] w-[42px] text-xs md:text-sm bg-transparent outline-none ml-2"
                            aria-invalid={Boolean(timeError)}
                            title={timeError || "24-hour format: HH:mm"}
                            style={{ color: "#2e2e2e", fontWeight: 500 }}
                          />
                          <svg
                            className="w-4 h-4 flex-shrink-0 cursor-pointer ml-2 md:mx-2"
                            fill="none"
                            stroke="#2e2e2e"
                            viewBox="0 0 24 24"
                            onClick={toggleSchedulePicker}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span
                          className="mobile-schedule-btn md:text-sm text-xs flex-shrink-0 h-full flex items-center justify-center border-l border-gray-200 cursor-pointer md:px-3 hover:bg-gray-200 transition-colors"
                          style={{
                            backgroundColor: "#F8F8F8",
                            color: selectedDate && selectedTime ? "#2E2E2E" : "#C8C8C8",
                            opacity: isSaving ? 0.5 : 1,
                            pointerEvents: isSaving ? "none" : "auto",
                          }}
                          onClick={handleScheduleAction}
                        >
                          Schedule
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
    </>
  );
}
