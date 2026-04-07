import Link from "next/link";

export default function Roadmap() {
  return (
    <section
      id="roadmap"
      className="w-full flex items-center justify-center py-8 md:py-16"
    >
      <div className="w-full max-w-screen-xl px-4 md:px-8">
        <h2 className="font-extrabold text-3xl md:text-5xl leading-[100%] text-center text-[#2E2E2E] font-sans mx-auto mb-6 md:mb-12">
          Roadmap
        </h2>

        {/* Roadmap Content - Mobile Responsive */}
        <div className="w-full max-w-[1094px] mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-[40px] justify-center">
            {/* V1 - Launched */}
            <div className="w-full md:w-[325px] h-auto md:h-[300px] p-4 md:p-6 border border-[#EAEAEA] rounded-3xl flex flex-col">
              <div className="flex items-center gap-2 md:gap-4 mb-3">
                <h3 className="font-bold text-2xl md:text-4xl leading-[100%] text-[#D3D3D3] font-sans">
                  V1
                </h3>
                <span className="font-medium text-sm md:text-base leading-[100%] text-black font-sans whitespace-nowrap">
                  Launched right now
                </span>
                <div className="w-5 h-5 md:w-6 md:h-6 bg-black rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 md:w-4 md:h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <hr className="border-t border-gray-200 mb-3 md:mb-4 -mx-4 md:-mx-6" />
              <div className="flex-1 flex flex-col justify-center items-center">
                <p className="font-medium text-sm leading-[100%] text-center text-[#2E2E2E] font-sans mb-3 md:mb-4">
                  Experience the Product now
                </p>
                <Link
                  href="/signup"
                  className="w-[121px] h-[37px] py-2 rounded-[20px] border border-[#2E2E2E] bg-transparent hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <span className="font-medium text-sm leading-[150%] text-[#2E2E2E] font-sans">
                    Start here
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-1"
                  >
                    <path
                      d="M9.72659 14.4598C9.67429 14.4076 9.6328 14.3455 9.60449 14.2772C9.57619 14.209 9.56162 14.1358 9.56162 14.0618C9.56162 13.9879 9.57619 13.9147 9.60449 13.8464C9.6328 13.7781 9.67429 13.7161 9.72659 13.6639L13.8293 9.56184L2.81206 9.56184C2.66287 9.56184 2.5198 9.50257 2.41431 9.39708C2.30882 9.2916 2.24956 9.14852 2.24956 8.99934C2.24956 8.85015 2.30882 8.70708 2.41431 8.60159C2.5198 8.4961 2.66287 8.43684 2.81206 8.43684L13.8293 8.43684L9.72659 4.33481C9.62104 4.22926 9.56175 4.0861 9.56175 3.93684C9.56175 3.78757 9.62104 3.64442 9.72659 3.53887C9.83214 3.43332 9.97529 3.37402 10.1246 3.37402C10.2738 3.37402 10.417 3.43332 10.5225 3.53887L15.585 8.60137C15.6373 8.65361 15.6788 8.71565 15.7071 8.78393C15.7354 8.85222 15.75 8.92542 15.75 8.99934C15.75 9.07326 15.7354 9.14645 15.7071 9.21474C15.6788 9.28303 15.6373 9.34506 15.585 9.39731L10.5225 14.4598C10.4703 14.5121 10.4082 14.5536 10.34 14.5819C10.2717 14.6102 10.1985 14.6248 10.1246 14.6248C10.0506 14.6248 9.97744 14.6102 9.90915 14.5819C9.84087 14.5536 9.77883 14.5121 9.72659 14.4598Z"
                      fill="black"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* V2 - Coming Soon */}
            <div className="w-full md:w-[325px] h-auto md:h-[300px] p-4 md:p-6 border border-[#EAEAEA] rounded-3xl flex flex-col">
              <div className="flex items-center gap-2 md:gap-[10px] mb-3">
                <h3 className="font-bold text-2xl md:text-4xl leading-[100%] text-[#D3D3D3] font-sans">
                  V2
                </h3>
                <div className="px-3 py-2 md:w-[124px] md:h-10 md:p-3 rounded-lg bg-[#F4F4F4] flex items-center justify-center">
                  <span className="font-medium text-sm md:text-base leading-[100%] text-center text-black font-sans">
                    Coming Soon
                  </span>
                </div>
              </div>
              <hr className="border-t border-gray-200 mb-3 md:mb-4 -mx-4 md:-mx-6" />
              <div className="flex-1 flex justify-start items-center">
                <ul className="font-normal text-sm md:text-base leading-[100%] text-black font-sans space-y-1.5 md:space-y-2">
                  <li>• Infinite publications</li>
                  <li>• Roles for publication</li>
                  <li>• Custom domain hosting</li>
                  <li>• Scheduler</li>
                  <li>• Analytics</li>
                  <li>• Basic SEO</li>
                </ul>
              </div>
            </div>

            {/* V3 - Coming Soon */}
            <div className="w-full md:w-[325px] h-auto md:h-[300px] p-4 md:p-6 border border-[#EAEAEA] rounded-3xl flex flex-col">
              <div className="flex items-center gap-2 md:gap-[10px] mb-3">
                <h3 className="font-bold text-2xl md:text-4xl leading-[100%] text-[#D3D3D3] font-sans">
                  V3
                </h3>
                <div className="px-3 py-2 md:w-[124px] md:h-10 md:p-3 rounded-lg bg-[#F4F4F4] flex items-center justify-center">
                  <span className="font-medium text-sm md:text-base leading-[100%] text-center text-black font-sans">
                    Coming Soon
                  </span>
                </div>
              </div>
              <hr className="border-t border-gray-200 mb-3 md:mb-4 -mx-4 md:-mx-6" />
              <ul className="font-normal text-sm md:text-base leading-[100%] text-black font-sans space-y-1.5 md:space-y-2 flex-1">
                <li>• Advanced SEO</li>
                <li>• Monetization</li>
                <li>• AI search bar</li>
                <li>• Download reports</li>
                <li>• Version History</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
