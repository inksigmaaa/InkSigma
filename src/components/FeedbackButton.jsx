import { FeedbackIcon } from './icons/SvgIcons'

export default function FeedbackButton() {
  return (
    <a 
      href="https://inksigma.canny.io/" 
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-20 left-4 w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg z-[100] cursor-pointer transition-all duration-300 hover:bg-purple-500 hover:border-purple-500 hover:shadow-[0_6px_16px_rgba(139,92,246,0.3)] md:hidden"
      title="Send Feedback"
    >
      <FeedbackIcon className="w-5 h-5 text-gray-500 transition-colors duration-300 group-hover:text-white" />
    </a>
  )
}
