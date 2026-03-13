import Link from "next/link";

export default function Hero() {
  return (
    <section
      id="home"
      className="w-full h-screen md:h-[719px] relative bg-cover bg-center bg-no-repeat hero-bg pt-16 md:pt-[68px]"
    >
      {/* Hero Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-end pb-10 md:justify-center px-4 md:px-[151.63px] gap-6">
        {/* Hero Title with responsive specifications */}
        <div className="w-full max-w-[642px] flex items-center justify-center text-center">
          <h1 className="leading-none tracking-normal text-text-primary text-center">
            <span className="font-[family-name:var(--font-allison)] font-normal text-[48px] md:text-[96px] leading-none tracking-normal">
              Write
            </span>
            <span className="font-extrabold text-[24px] md:text-[48px] leading-none tracking-normal">
              {" "}
              something every day
            </span>
          </h1>
        </div>

        {/* Subtitle with responsive specifications */}
        <div className="w-full max-w-[531px] flex items-center justify-center text-center px-4">
          <p className="opacity-100 font-light text-sm md:text-base leading-[120%] tracking-normal text-center text-[#2E2E2E]">
            Welcome to the home of writers - pen down your innermost musings,
            ideas, stories, and inspire others to grow through words that
            connect. Write daily, inspire & be heard
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex items-center justify-center">
          <Link
            href="/signup"
            className="w-[200px] h-[37px] py-2 px-4 gap-1 rounded-[20px] border border-gray-300 opacity-100 font-medium text-sm leading-[150%] tracking-normal text-black bg-white hover:bg-gray-50 transition-colors shadow-sm font-sans flex items-center justify-center"
          >
            <span>Start Writing for FREE</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.72659 14.4598C9.67429 14.4076 9.6328 14.3455 9.60449 14.2772C9.57619 14.209 9.56162 14.1358 9.56162 14.0618C9.56162 13.9879 9.57619 13.9147 9.60449 13.8464C9.6328 13.7781 9.67429 13.7161 9.72659 13.6639L13.8293 9.56184L2.81206 9.56184C2.66287 9.56184 2.5198 9.50257 2.41431 9.39708C2.30882 9.2916 2.24956 9.14852 2.24956 8.99934C2.24956 8.85015 2.30882 8.70708 2.41431 8.60159C2.5198 8.4961 2.66287 8.43684 2.81206 8.43684L13.8293 8.43684L9.72659 4.33481C9.62104 4.22926 9.56175 4.0861 9.56175 3.93684C9.56175 3.78757 9.62104 3.64442 9.72659 3.53887C9.83214 3.43332 9.97529 3.37402 10.1246 3.37402C10.2738 3.37402 10.417 3.43332 10.5225 3.53887L15.585 8.60137C15.6373 8.65361 15.6788 8.71565 15.7071 8.78393C15.7354 8.85222 15.75 8.92542 15.75 8.99934C15.75 9.07326 15.7354 9.14645 15.7071 9.21474C15.6788 9.28303 15.6373 9.34506 15.585 9.39731L10.5225 14.4598C10.4703 14.5121 10.4082 14.5536 10.34 14.5819C10.2717 14.6102 10.1985 14.6248 10.1246 14.6248C10.0506 14.6248 9.97744 14.6102 9.90915 14.5819C9.84087 14.5536 9.77883 14.5121 9.72659 14.4598Z"
                fill="black"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
