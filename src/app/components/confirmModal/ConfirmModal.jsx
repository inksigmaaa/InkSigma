export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText, confirmStyle = 'danger' }) {
  if (!isOpen) return null

  const titleColor = confirmStyle === 'danger' ? 'text-red-600' : 'text-gray-800'

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-8 max-w-[500px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.3)] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={`font-['Public_Sans'] font-bold text-lg sm:text-xl leading-[1.4] mb-3 ${titleColor}`}>
          {title}
        </h2>
        {message && (
          <p className="font-['Public_Sans'] font-normal text-sm sm:text-base leading-[1.6] text-gray-400 mb-6">
            {message}
          </p>
        )}
        <div className="flex gap-3 flex-col sm:flex-row">
          <button
            className="font-['Public_Sans'] font-semibold text-sm sm:text-base px-5 py-2.5 sm:py-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200 flex-1 min-w-[100px]"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="font-['Public_Sans'] font-semibold text-sm sm:text-base px-5 py-2.5 sm:py-3 rounded-lg bg-black text-white hover:opacity-90 transition-opacity duration-200 flex-1 min-w-[120px]"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
