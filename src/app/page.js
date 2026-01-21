import Link from "next/link"

export default function Home() {
  return (
    <div className="w-full bg-white mx-auto overflow-hidden">
      {/* Hero Section */}
      <section 
        id="hero"
        className="w-full h-[719px] absolute top-[68px] left-0 opacity-100 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/background/bg.png)' }}
      >
        {/* Hero Content */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-[151.63px] gap-6">
          {/* Hero Title with exact specifications */}
          <div className="w-[642px] h-[96px] flex items-center justify-center text-center">
            <h1 className="leading-none tracking-normal text-text-primary text-center">
              <span className="font-[family-name:var(--font-allison)] font-normal text-[96px] leading-none tracking-normal">Write</span>
              <span className="font-extrabold text-[48px] leading-none tracking-normal"> something every day</span>
            </h1>
          </div>
          
          {/* Subtitle with exact specifications */}
          <div className="w-[531px] h-[57px] flex items-center justify-center text-center">
            <p className="w-[531px] h-[57px] opacity-100 font-light text-base leading-[120%] tracking-normal text-center text-[#2E2E2E]">
              Welcome to the home of writers - pen down your innermost musings, ideas, stories, and inspire others to grow through words that connect. Write daily, inspire & be heard
            </p>
          </div>
          
          {/* CTA Button */}
          <div className="flex items-center justify-center">
            <Link href="/signup" className="w-[200px] h-[37px] py-2 px-4 gap-1 rounded-[20px] border border-gray-300 opacity-100 font-medium text-sm leading-[150%] tracking-normal text-black bg-white hover:bg-gray-50 transition-colors shadow-sm font-sans flex items-center justify-center">
              <span>Start Writing for FREE</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.72659 14.4598C9.67429 14.4076 9.6328 14.3455 9.60449 14.2772C9.57619 14.209 9.56162 14.1358 9.56162 14.0618C9.56162 13.9879 9.57619 13.9147 9.60449 13.8464C9.6328 13.7781 9.67429 13.7161 9.72659 13.6639L13.8293 9.56184L2.81206 9.56184C2.66287 9.56184 2.5198 9.50257 2.41431 9.39708C2.30882 9.2916 2.24956 9.14852 2.24956 8.99934C2.24956 8.85015 2.30882 8.70708 2.41431 8.60159C2.5198 8.4961 2.66287 8.43684 2.81206 8.43684L13.8293 8.43684L9.72659 4.33481C9.62104 4.22926 9.56175 4.0861 9.56175 3.93684C9.56175 3.78757 9.62104 3.64442 9.72659 3.53887C9.83214 3.43332 9.97529 3.37402 10.1246 3.37402C10.2738 3.37402 10.417 3.43332 10.5225 3.53887L15.585 8.60137C15.6373 8.65361 15.6788 8.71565 15.7071 8.78393C15.7354 8.85222 15.75 8.92542 15.75 8.99934C15.75 9.07326 15.7354 9.14645 15.7071 9.21474C15.6788 9.28303 15.6373 9.34506 15.585 9.39731L10.5225 14.4598C10.4703 14.5121 10.4082 14.5536 10.34 14.5819C10.2717 14.6102 10.1985 14.6248 10.1246 14.6248C10.0506 14.6248 9.97744 14.6102 9.90915 14.5819C9.84087 14.5536 9.77883 14.5121 9.72659 14.4598Z" fill="black"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Main content area - ready for additional content */}
      <main className="pt-20 w-full h-full px-[151.63px]">
        {/* Additional content sections will go here */}
        <div className="pt-[719px]">
          {/* Content placeholder */}
        </div>
      </main>
      
      {/* Features Section - Outside padded container for true centering */}
      <section id="features" className="w-full flex items-center justify-center py-20">
        <div className="w-full max-w-screen-xl px-8">
          <h2 className="font-extrabold text-5xl text-gray-800 text-center leading-none tracking-normal font-sans mb-16">
            Features
          </h2>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[106px] gap-y-8 max-w-4xl mx-auto">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="flex items-start gap-3">
                <img src="/svg/tick.svg" alt="Check" className="w-11 h-11 flex-shrink-0" />
                <div>
                  <p className="font-normal text-base leading-[155%] text-[#2E2E2E] font-sans">Write as much as you can. Unlimited blog articles</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <img src="/svg/tick.svg" alt="Check" className="w-11 h-11 flex-shrink-0" />
                <div>
                  <p className="font-normal text-base leading-[155%] text-[#2E2E2E] font-sans">Seamless Text editor</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <img src="/svg/tick.svg" alt="Check" className="w-11 h-11 flex-shrink-0" />
                <div>
                  <p className="font-normal text-base leading-[155%] text-[#2E2E2E] font-sans mb-4">Search engine optimized</p>
                  <ul className="space-y-2 font-normal text-base leading-[155%] text-[#2E2E2E] font-sans">
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
            <div className="space-y-8">
              <div className="flex items-start gap-3">
                <img src="/svg/tick.svg" alt="Check" className="w-11 h-11 flex-shrink-0" />
                <div>
                  <p className="font-normal text-base leading-[155%] text-[#2E2E2E] font-sans">Basic analytics (visits, revisits)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <img src="/svg/tick.svg" alt="Check" className="w-11 h-11 flex-shrink-0" />
                <div>
                  <p className="font-normal text-base leading-[155%] text-[#2E2E2E] font-sans">Google SSO</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <img src="/svg/tick.svg" alt="Check" className="w-11 h-11 flex-shrink-0" />
                <div>
                  <p className="font-normal text-base leading-[155%] text-[#2E2E2E] font-sans">Rich Text Editor</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <img src="/svg/tick.svg" alt="Check" className="w-11 h-11 flex-shrink-0" />
                <div>
                  <p className="font-normal text-base leading-[155%] text-[#2E2E2E] font-sans">Free subdomain</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <img src="/svg/tick.svg" alt="Check" className="w-11 h-11 flex-shrink-0" />
                <div>
                  <p className="font-normal text-base leading-[155%] text-[#2E2E2E] font-sans">Category</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Roadmap Section */}
      <section id="roadmap" className="w-full flex items-center justify-center py-20">
        <div className="w-full max-w-screen-xl px-8">
          <h2 className="w-[218px] h-12 font-extrabold text-5xl leading-[100%] text-center align-middle text-[#2E2E2E] font-sans mx-auto mb-16">
            Roadmap
          </h2>
          
          {/* Roadmap Content */}
          <div className="w-[1094px] h-[325px] mx-auto p-8">
            <div className="flex gap-[59px] h-full justify-center">
              {/* V1 - Launched */}
              <div className="w-[325px] h-[325px] p-8 border border-[#EAEAEA] rounded-3xl flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="w-[41px] h-9 font-bold text-4xl leading-[100%] text-center align-middle text-[#D3D3D3] font-sans">V1</h3>
                  <span className="w-[148px] h-4 font-medium text-base leading-[100%] text-center align-middle text-black font-sans whitespace-nowrap">Launched right now</span>
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <hr className="border-t border-gray-200 mb-6 -mx-8" />
                <div className="flex-1 flex flex-col justify-center items-center">
                  <p className="w-[196px] h-4 font-medium text-sm leading-[100%] text-center align-middle text-[#2E2E2E] font-sans mb-6">Experience the Product now</p>
                  <Link href="/signup" className="w-[121px] h-[37px]  py-2 rounded-[20px] border border-[#2E2E2E] bg-transparent hover:bg-gray-50 transition-colors flex items-center justify-center">
                    <span className="font-medium text-sm leading-[150%] text-[#2E2E2E] font-sans">Start here</span>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                      <path d="M9.72659 14.4598C9.67429 14.4076 9.6328 14.3455 9.60449 14.2772C9.57619 14.209 9.56162 14.1358 9.56162 14.0618C9.56162 13.9879 9.57619 13.9147 9.60449 13.8464C9.6328 13.7781 9.67429 13.7161 9.72659 13.6639L13.8293 9.56184L2.81206 9.56184C2.66287 9.56184 2.5198 9.50257 2.41431 9.39708C2.30882 9.2916 2.24956 9.14852 2.24956 8.99934C2.24956 8.85015 2.30882 8.70708 2.41431 8.60159C2.5198 8.4961 2.66287 8.43684 2.81206 8.43684L13.8293 8.43684L9.72659 4.33481C9.62104 4.22926 9.56175 4.0861 9.56175 3.93684C9.56175 3.78757 9.62104 3.64442 9.72659 3.53887C9.83214 3.43332 9.97529 3.37402 10.1246 3.37402C10.2738 3.37402 10.417 3.43332 10.5225 3.53887L15.585 8.60137C15.6373 8.65361 15.6788 8.71565 15.7071 8.78393C15.7354 8.85222 15.75 8.92542 15.75 8.99934C15.75 9.07326 15.7354 9.14645 15.7071 9.21474C15.6788 9.28303 15.6373 9.34506 15.585 9.39731L10.5225 14.4598C10.4703 14.5121 10.4082 14.5536 10.34 14.5819C10.2717 14.6102 10.1985 14.6248 10.1246 14.6248C10.0506 14.6248 9.97744 14.6102 9.90915 14.5819C9.84087 14.5536 9.77883 14.5121 9.72659 14.4598Z" fill="#2E2E2E"/>
                    </svg>
                  </Link>
                </div>
              </div>
              
              {/* V2 - Coming Soon */}
              <div className="w-[325px] h-[325px] p-8 border border-[#EAEAEA] rounded-3xl flex flex-col">
                <div className="flex items-center gap-[10px] mb-4">
                  <h3 className="w-[49px] h-9 font-bold text-4xl leading-[100%] text-center align-middle text-[#D3D3D3] font-sans">V2</h3>
                  <div className="w-[124px] h-10 p-3 rounded-lg bg-[#F4F4F4] flex items-center justify-center">
                    <span className="w-[100px] h-4 font-medium text-base leading-[100%] text-center align-middle text-black font-sans">Coming Soon</span>
                  </div>
                </div>
                <hr className="border-t border-gray-200 mb-6 -mx-8" />
                <div className="flex-1 flex justify-center items-center">
                  <ul className="w-[199px] h-44 font-normal text-base leading-[100%] align-middle text-black font-sans space-y-3">
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
              <div className="w-[325px] h-[325px] p-8 border border-[#EAEAEA] rounded-3xl flex flex-col">
                <div className="flex items-center gap-[10px] mb-4">
                  <h3 className="w-[50px] h-9 font-bold text-4xl leading-[100%] text-center align-middle text-[#D3D3D3] font-sans">V3</h3>
                  <div className="w-[124px] h-10 p-3 rounded-lg bg-[#F4F4F4] flex items-center justify-center">
                    <span className="w-[100px] h-4 font-medium text-base leading-[100%] text-center align-middle text-black font-sans">Coming Soon</span>
                  </div>
                </div>
                <hr className="border-t border-gray-200 mb-6 -mx-8" />
                <ul className="w-[156px] h-36 font-normal text-base leading-[100%] align-middle text-black font-sans space-y-3 flex-1">
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
      
      {/* New Section after Roadmap */}
      <section className="w-full flex items-center justify-center py-20">
        <div className="w-full max-w-screen-xl px-8">
          <h2 className="w-[648px] h-12 font-extrabold text-5xl leading-[100%] text-center align-middle text-[#2E2E2E] font-sans mx-auto mb-8 whitespace-nowrap">
            Unleash your Creativity now
          </h2>
          <div className="w-[531px] h-[57px] mx-auto mb-8 text-center">
            <p className="font-[300] text-base leading-[120%] text-[#2E2E2E] opacity-100">
              Welcome to the home of writers - pen down your innermost musings,
            </p>
            <p className="font-[300] text-base leading-[120%] text-[#2E2E2E] opacity-100">
              ideas, stories, and inspire others to grow through words that connect.
            </p>
            <p className="font-[300] text-base leading-[120%] text-[#2E2E2E] opacity-100">
              Write daily, inspire & be heard
            </p>
          </div>
          
          <div className="flex items-center justify-center">
            <Link href="/signup" className="w-[201px] h-[37px] py-2 px-4 gap-1 rounded-[20px] border border-[#2E2E2E] bg-transparent hover:bg-gray-50 transition-colors flex items-center justify-center font-[500] text-sm leading-[150%] text-black font-sans">
              <span>Start Writing for FREE</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.72659 14.4598C9.67429 14.4076 9.6328 14.3455 9.60449 14.2772C9.57619 14.209 9.56162 14.1358 9.56162 14.0618C9.56162 13.9879 9.57619 13.9147 9.60449 13.8464C9.6328 13.7781 9.67429 13.7161 9.72659 13.6639L13.8293 9.56184L2.81206 9.56184C2.66287 9.56184 2.5198 9.50257 2.41431 9.39708C2.30882 9.2916 2.24956 9.14852 2.24956 8.99934C2.24956 8.85015 2.30882 8.70708 2.41431 8.60159C2.5198 8.4961 2.66287 8.43684 2.81206 8.43684L13.8293 8.43684L9.72659 4.33481C9.62104 4.22926 9.56175 4.0861 9.56175 3.93684C9.56175 3.78757 9.62104 3.64442 9.72659 3.53887C9.83214 3.43332 9.97529 3.37402 10.1246 3.37402C10.2738 3.37402 10.417 3.43332 10.5225 3.53887L15.585 8.60137C15.6373 8.65361 15.6788 8.71565 15.7071 8.78393C15.7354 8.85222 15.75 8.92542 15.75 8.99934C15.75 9.07326 15.7354 9.14645 15.7071 9.21474C15.6788 9.28303 15.6373 9.34506 15.585 9.39731L10.5225 14.4598C10.4703 14.5121 10.4082 14.5536 10.34 14.5819C10.2717 14.6102 10.1985 14.6248 10.1246 14.6248C10.0506 14.6248 9.97744 14.6102 9.90915 14.5819C9.84087 14.5536 9.77883 14.5121 9.72659 14.4598Z" fill="black"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
