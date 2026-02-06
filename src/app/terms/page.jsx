import React from 'react';

export default function TermsPage() {
    return (
        <div className="w-full max-w-4xl mx-auto px-4 pt-[90px] pb-12 md:pb-20 lg:pb-24 flex flex-col items-center">
            <h1
                className="font-bold text-black mb-8 text-center"
                style={{
                    width: '276px', // Implicit from request
                    height: '24px', // Implicit from request
                    fontSize: '32px',
                    lineHeight: '24px',
                    letterSpacing: '0%',
                    color: '#000000'
                }}
            >
                Privacy and Policy
            </h1>

            <ul className="w-full max-w-sm md:max-w-md lg:max-w-lg list-disc pl-5 pr-5 space-y-2 w-[271px] h-[604px]">
                <li className="font-semibold text-[14px] leading-5 tracking-[0] text-[#14142D] w-[271px] h-[20px]">
                    Introduction
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Definitions
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969] ml-3">
                    Information Collection and Use
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Types of Data Collected
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Use of Data
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Retention of Data
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Transfer of Data
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Disclosure of Data
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Security of Data
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Your Data Protection Rights Under General Data Protection Regulation (GDPR)
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Your Data Protection Rights under the California Privacy Protection Act (CalOPPA)
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Analytics
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Advertising
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Behavioral Remarketing
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Payments
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Links to Other Sites
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Children's Privacy
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Changes to This Privacy Policy
                </li>
                <li className="font-normal text-[14px] leading-5 tracking-[0] text-[#696969]">
                    Contact Us
                </li>
            </ul>
        </div>
    );
}
