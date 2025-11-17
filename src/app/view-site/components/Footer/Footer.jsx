export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 pt-10 md:pt-12 pb-2 lg:pb-8 max-md:px-6">
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center w-full">
        {/* Copyright at top */}
        <div className="text-center mb-6 max-md:mb-10">
          <p className="text-base md:text-lg text-gray-300">
            © {currentYear} Joshhh blogs
          </p>
        </div>
        
        {/* Call to Action Section */}
        <div className="text-center mb-6 max-md:mb-10">
          <h2 className="text-xl md:text-3xl font-semibold text-gray-900 mb-5 md:mb-6 px-2 leading-tight">
            Eager to delve into the art of blog writing?
          </h2>
          <a
            href="/editor"
            className="inline-block px-6 py-3 max-md:px-8 max-md:py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-base max-md:text-lg font-medium"
          >
            Start Writing
          </a>
        </div>

        {/* Made with Inksigma */}
        <div className="text-center mb-4 max-md:mb-8">
          <p className="text-base md:text-lg text-gray-300">
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
        <div className="text-center mb-4 max-md:mb-8">
          <div className="flex items-center justify-center gap-3 md:gap-4 text-sm md:text-base text-gray-300 flex-wrap px-4">
            <a 
              href="https://inksigma.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500 transition-colors"
            >
              Inksigma Website
            </a>
            <span className="text-gray-300">•</span>
            <a href="/terms" className="hover:text-gray-500 transition-colors">
              Terms and Conditions
            </a>
            <span className="text-gray-300">•</span>
            <a href="/privacy" className="hover:text-gray-500 transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>

      {/* Full Width Border Line */}
      <div className="border-t border-gray-200 mt-4 max-md:mt-8"></div>

      {/* Copyright Bottom - Full Width */}
      <div className="text-center pt-5 md:pt-6 px-4">
        <p className="text-sm md:text-base text-gray-300 leading-relaxed">
          Copyright © {currentYear} designed & developed by{' '}
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
            href="https://zemuria.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-700"
          >
            Zemuria Inc
          </a>
          . brand
        </p>
      </div>
    </footer>
  );
}
