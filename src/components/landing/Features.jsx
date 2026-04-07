export default function Features() {
  return (
    <section
      id="features"
      className="w-full flex items-center justify-center py-8 md:py-16"
    >
      <div className="w-full max-w-screen-xl px-4 md:px-8">
        <h2 className="font-extrabold text-3xl md:text-5xl text-gray-800 text-center leading-none tracking-normal font-sans mb-6 md:mb-12">
          Features
        </h2>

        {/* Features Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-[106px] md:gap-y-6 max-w-4xl mx-auto">
          {/* Left Column */}
          <div className="space-y-3 md:space-y-6">
            <div className="flex items-start gap-3">
              <img
                src="/svg/tick.svg"
                alt="Check"
                className="w-8 h-8 md:w-11 md:h-11 flex-shrink-0"
              />
              <div>
                <p className="font-normal text-sm md:text-base leading-[155%] text-[#2E2E2E] font-sans">
                  Write as much as you can - Unlimited blog articles (exclusive
                  only for first 500 sign-up)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <img
                src="/svg/tick.svg"
                alt="Check"
                className="w-8 h-8 md:w-11 md:h-11 flex-shrink-0"
              />
              <div>
                <p className="font-normal text-sm md:text-base leading-[155%] text-[#2E2E2E] font-sans">
                  Seamless Text editor
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <img
                src="/svg/tick.svg"
                alt="Check"
                className="w-8 h-8 md:w-11 md:h-11 flex-shrink-0"
              />
              <div>
                <p className="font-normal text-sm md:text-base leading-[155%] text-[#2E2E2E] font-sans mb-1 md:mb-2">
                  Search engine optimized
                </p>
                <ul className="ml-4 md:ml-6 space-y-0.5 md:space-y-1 font-normal text-sm md:text-base leading-[155%] text-[#2E2E2E] font-sans">
                  <li>• Meta title</li>
                  <li>• Meta description</li>
                  <li>• URL</li>
                  <li>• Schema Automate</li>
                  <li>• Image Optimization</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3 md:space-y-6">
            <div className="flex items-start gap-3">
              <img
                src="/svg/tick.svg"
                alt="Check"
                className="w-8 h-8 md:w-11 md:h-11 flex-shrink-0"
              />
              <div>
                <p className="font-normal text-sm md:text-base leading-[155%] text-[#2E2E2E] font-sans">
                  Basic analytics (visits, revisits)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <img
                src="/svg/tick.svg"
                alt="Check"
                className="w-8 h-8 md:w-11 md:h-11 flex-shrink-0"
              />
              <div>
                <p className="font-normal text-sm md:text-base leading-[155%] text-[#2E2E2E] font-sans">
                  Google SSO
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <img
                src="/svg/tick.svg"
                alt="Check"
                className="w-8 h-8 md:w-11 md:h-11 flex-shrink-0"
              />
              <div>
                <p className="font-normal text-sm md:text-base leading-[155%] text-[#2E2E2E] font-sans">
                  Rich Text Editor
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <img
                src="/svg/tick.svg"
                alt="Check"
                className="w-8 h-8 md:w-11 md:h-11 flex-shrink-0"
              />
              <div>
                <p className="font-normal text-sm md:text-base leading-[155%] text-[#2E2E2E] font-sans">
                  Free subdomain
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <img
                src="/svg/tick.svg"
                alt="Check"
                className="w-8 h-8 md:w-11 md:h-11 flex-shrink-0"
              />
              <div>
                <p className="font-normal text-sm md:text-base leading-[155%] text-[#2E2E2E] font-sans">
                  Category
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
