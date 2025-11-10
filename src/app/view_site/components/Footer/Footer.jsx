export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-6">
      <div className="max-w-[100%]">
        {/* Call to Action Section */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Eager to delve into the art of blog writing?
          </h2>
          <a
            href="/write"
            className="inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Start Writing
          </a>
        </div>

        {/* Made with Inksigma */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500">
            Made with{' '}
            <a
              href="https://inksigma.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Inksigma
            </a>
          </p>
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-around text-sm text-gray-500 border-y border-gray-200 py-6">
          <div className="flex items-center gap-6">
            <a href="/terms" className="hover:text-gray-700 transition-colors">
              Terms and Conditions
            </a>
            <span className="text-gray-300">•</span>
            <a href="/privacy" className="hover:text-gray-700 transition-colors">
              Privacy Policy
            </a>
          </div>

          <div>
            <p>
              Copyright © 2024 designed & developed by{' '}
              <a
                href="https://inksigma.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700"
              >
                Inksigma
              </a>
              , a{' '}
              <a
                href="https://zemuria.inc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700"
              >
                Zemuria Inc
              </a>
              . brand
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
