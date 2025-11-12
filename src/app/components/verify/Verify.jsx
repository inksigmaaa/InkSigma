export default function Verify() {
  return (
    <div
      className="
      relative left-1/2 top-[128px] w-full max-w-[1034px] -translate-x-1/2 px-5 z-[25]
      pointer-events-none 
      max-md:top-[110px]
    "
    >
      <div
        className="
        ml-[185px] bg-[#F3E8FF] border border-[#E9D5FF] rounded-lg 
        p-3 px-4 flex items-center justify-between gap-4 
        pointer-events-auto
        max-md:ml-0 max-md:flex-col max-md:items-start
      "
      >
        <div className="flex items-center gap-2">
          <img
            src="/images/icons/alert.svg"
            alt="alert"
            className="w-[18px] h-[18px] shrink-0"
          />
          <p className="m-0 font-medium text-[14px] leading-[150%] text-[#7C3AED]">
            Your Account is unverified.
          </p>
        </div>

        <button
          className="
            bg-[#8B5CF6] text-white px-5 py-2 rounded-md 
            text-[14px] font-medium whitespace-nowrap shrink-0
            hover:bg-[#7C3AED] transition
            max-md:w-full
          "
        >
          Verify your Account
        </button>
      </div>
    </div>
  );
}
