"use client"

import { useState } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy } from "lucide-react"

export default function DomainPage() {
  const [customDomain, setCustomDomain] = useState("")
  const currentDomain = "Joshhh.inksigma.com"
  const subdomain = "Subdomain"
  const ipAddress = "192.168.1.1"

  const handleCopyIP = () => {
    navigator.clipboard.writeText(ipAddress)
  }

  const handleSaveChanges = () => {
    console.log("Saving domain:", customDomain)
  }

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      
      <div className="absolute left-1/2 -translate-x-1/2 top-[200px] w-full max-w-[1034px] z-20 px-5">
        <div className="ml-0 md:ml-[185px]">
          <div className="flex flex-col items-center pl-10 pb-20">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-gray-900 mb-1">Custom Domain Integration</h1>
              <p className="text-sm text-gray-600">
                Connect your custom domain you already own<br />
                with Inksigma.{" "}
                <a href="#" className="text-black font-semibold underline">Read instructions</a>
              </p>
            </div>

            {/* Current Domain Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-5 w-full max-w-[400px] mb-20">
              <div className="border-b border-gray-200 pb-5">
                <h2 className="text-xs font-semibold text-gray-400 mb-3">YOUR CURRENT DOMAIN</h2>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 font-medium text-base">{currentDomain}</span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded">{subdomain}</span>
                </div>
              </div>

              {/* Warning Box */}
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="text-orange-700 text-sm">
                  <span className="font-semibold">Warning:</span> If you change your domain, you can only change it after 14 days.
                </p>
              </div>

              {/* Custom Domain Input */}
              <div className="space-y-3 border-t border-gray-200 pt-5">
                <label className="block text-sm font-semibold text-gray-900">
                  Create your Custom Domain
                </label>
                <Input
                  type="text"
                  placeholder="joshhh.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full bg-gray-50 border-gray-300"
                />
                <Button 
                  onClick={handleSaveChanges}
                  className="bg-black text-white hover:bg-gray-800 px-8 text-sm h-10"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Instructions Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Custom Domain Integration Instructions</h2>
              
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">1.</span> Enter the correct domain name that you have bought/own in the domain field
                </p>
                
                <p className="text-gray-600 pl-4">
                  Now to connect your existing website to your new domain, please do the following steps:
                </p>
                
                <p>
                  <span className="font-semibold">2.</span> Copy the IP Address that's given there by clicking the copy button
                </p>
                
                <p>
                  <span className="font-semibold">3.</span> Open your domain's <span className="font-semibold">DNS</span> (Domain Name System) Management in your domain provider -like GoDaddy, Cloudflare, Bluehost, Hostgator, etc.
                </p>
                
                <p>
                  <span className="font-semibold">4.</span> If there's an existing A record in your domain- please click edit and remove the existing IP Address and paste the NEW copied IP Address in the respective IP/IPv4 address field
                </p>
                
                <p className="text-gray-600 pl-4">(or)</p>
                
                <p className="font-semibold">
                  If there is no existing A record, you can create your own A record by doing the following steps
                </p>
                
                <p>
                  <span className="font-semibold">Step 1:</span> Click Add Record in your DNS
                </p>
                
                {/* Instructional Image */}
                <div className="my-6 bg-white rounded-lg border border-gray-200 p-6">
                  <img 
                    src="/images/Domain/Imageeess.jpg" 
                    alt="DNS Configuration Steps showing steps 1-5 for adding A record" 
                    className="w-full h-auto"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      console.log('Image not found. Please add domain-instructions.png to /public/images/')
                    }}
                  />
                </div>

                <p>
                  <span className="font-semibold">5.</span> Ensure the TTL is in the lowest time possible or Auto and click SAVE.
                </p>

                <p>
                  <span className="font-semibold">6.</span> Now come back to your admin panel and click the checkbox - that you have read all the instructions and click UPDATE.
                </p>

                <p>
                  <span className="font-semibold">7.</span> A pop-up will appear to re-confirm your domain change request. Click YES.
                </p>

                <p>
                  <span className="font-semibold">8.</span> You will be redirected to a 404 Error Page. Please don't worry. We are just now transferring your blog site to your new domain.
                </p>

                <p>
                  <span className="font-semibold">9.</span> After 5 minutes, enter your newly connected domain name in the search bar of your browser to experience your own blog site.
                </p>

                <p className="mt-4">
                  Your blog website should be now loaded to your new domain.
                </p>

                <p className="mt-2">
                  Welcome to your own blog website, built with love from Inksigma
                </p>

                {/* Query/Support Section */}
                <div className="mt-8 space-y-4">
                  <h3 className="font-semibold text-gray-900">Query/Support:</h3>
                  
                  <p>
                    Your website should be reflected within less than 15 minutes which is our maximum waiting time. In case, you are facing trouble or if you have messed up at any of the steps including entering the wrong email address,
                  </p>

                  <p>
                    Please write to us from your registered email address explaining your problem to support@zemuria.com and we will be happy to assist you to solve it as soon as possible.
                  </p>

                  <p className="mt-4">
                    Aspiring to help every small business,
                  </p>

                  <p className="mt-2">
                    With love,<br />
                    <span className="font-semibold">Inksigma</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
