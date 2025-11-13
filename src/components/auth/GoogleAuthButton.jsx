import { Button } from "@/components/ui/button"
import GoogleIcon from "@/components/common/GoogleIcon"

/**
 * Reusable Google authentication button
 * @param {Object} props - Component props
 * @param {string} props.text - Button text
 * @param {Function} [props.onClick] - Click handler
 */
export default function GoogleAuthButton({ text, onClick }) {
  return (
    <Button 
      type="button"
      variant="outline"
      onClick={onClick}
      className="w-full border-gray-300 text-black hover:bg-gray-50 rounded-md py-3 flex items-center justify-center space-x-2"
    >
      <GoogleIcon />
      <span>{text}</span>
    </Button>
  )
}