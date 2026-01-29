"use client"

import { useState, useEffect } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function DomainPage() {
  const [customDomain, setCustomDomain] = useState("")
  const [subdomain, setSubdomain] = useState("Subdomain")
  const [loading, setLoading] = useState(true)
  const [savedCustomDomain, setSavedCustomDomain] = useState("")
  const [editDomain, setEditDomain] = useState("")

  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingDomain, setPendingDomain] = useState("")

  const [showRevertConfirmation, setShowRevertConfirmation] = useState(false)

  useEffect(() => {
    loadPublicationData()
  }, [])

  const loadPublicationData = async () => {
    try {
      const sessionRes = await fetch("http://localhost:5000/api/auth/get-session", {
        credentials: "include",
      })

      if (!sessionRes.ok) return

      const sessionData = await sessionRes.json()
      const userId = sessionData.user.id

      const pubRes = await fetch(`http://localhost:5000/api/publications/user/${userId}`, {
        credentials: "include",
      })

      if (pubRes.ok) {
        const pubData = await pubRes.json()
        setSubdomain(pubData.subdomain || "Subdomain")
      }
    } catch (err) {
      console.error("Error loading publication:", err)
    } finally {
      setLoading(false)
    }
  }

  const currentDomain = `${subdomain}.inksigma.com`

  const handleSaveChanges = () => {
    if (customDomain.trim()) {
      setPendingDomain(customDomain.trim())
      setShowConfirmation(true)
    }
  }

  const handleEditSave = () => {
    const trimmed = editDomain.trim()
    if (trimmed === "") {
      setShowRevertConfirmation(true)
    } else {
      setPendingDomain(trimmed)
      setShowConfirmation(true)
    }
  }

  const handleConfirmSave = () => {
    setSavedCustomDomain(pendingDomain)
    setEditDomain(pendingDomain)
    setCustomDomain("")
    setShowConfirmation(false)
    console.log("Saving domain changes:", pendingDomain)
  }

  const handleCancelSave = () => {
    setShowConfirmation(false)
    setPendingDomain("")
  }

  const handleConfirmRevert = () => {
    setSavedCustomDomain("")
    setEditDomain("")
    setShowRevertConfirmation(false)
  }

  const handleCancelRevert = () => {
    setShowRevertConfirmation(false)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />

      <div className="w-full min-h-screen md:absolute md:left-1/2 md:-translate-x-1/2 md:top-[120px] md:max-w-[1034px] z-20 px-5 md:px-5 pt-24 md:pt-0 pb-24 md:pb-0">
        <div className="ml-0 md:ml-[165px] md:border-r md:border-gray-200">
          <div className="flex flex-col max-md:pl-10 max-md:pr-10 pb-8 md:pb-20">
            {/* Header */}
            <div className="text-center mt-10 mb-6 max-md:mb-6  max-md:mt-8">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Custom Domain Integration</h1>
              <p className="text-sm text-gray-600 px-4 md:px-0">
                Connect your custom domain you already own <br />
                with Inksigma.{" "}
                <a
                  href="#instructions"
                  onClick={(e) => {
                    e.preventDefault()
                    const element = document.getElementById('instructions')
                    if (element) {
                      const offset = 120 // Adjust for navbar height
                      const elementPosition = element.getBoundingClientRect().top
                      const offsetPosition = elementPosition + window.pageYOffset - offset
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                      })
                    }
                  }}
                  className="text-black font-semibold cursor-pointer"
                >
                  Read instructions
                </a>
              </p>
            </div>

            {/* Current Domain Section */}
            {!savedCustomDomain ? (
              // Initial state - no custom domain saved
              <div className="bg-white mx-auto rounded-lg border border-gray-200 p-6 md:p-8 space-y-5 w-full max-w-[400px] mb-12 md:mb-20">
                <div className="border-b border-gray-200 pb-5">
                  <h2 className="text-xs font-semibold text-gray-400 mb-3">YOUR CURRENT DOMAIN</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-purple-600 font-medium text-sm md:text-base break-all">{currentDomain}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded whitespace-nowrap">{subdomain}</span>
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
                    className="bg-black text-white hover:bg-gray-800 w-full md:w-auto px-8 text-sm h-10"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              // After custom domain is saved - exact CSS styling
              <div
                className="mx-auto mb-12 md:mb-20"
                style={{
                  width: '447px',
                  height: '503px',
                  borderRadius: '8px',
                  padding: '24px 32px',
                  gap: '24px',
                  background: '#FFFFFF',
                  border: '1px solid #EDEDED',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Subdomain Domain Section */}
                <div
                  style={{
                    width: '383px',
                    borderRadius: '4px',
                    padding: '16px 24px',
                    gap: '4px',
                    background: '#FAFAFA',
                    border: '1px solid #EAEAEA',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Public Sans',
                      fontWeight: 600,
                      fontSize: '12px',
                      lineHeight: '150%',
                      color: '#A4A4A4'
                    }}
                  >
                    YOUR SUBDOMAIN DOMAIN
                  </div>
                  <div
                    style={{
                      fontFamily: 'Public Sans',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '28px',
                      color: '#202020'
                    }}
                  >
                    {currentDomain}
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentDomain)}
                    style={{
                      width: '60px',
                      height: '22px',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      gap: '4px',
                      background: '#FFFFFF',
                      border: '1px solid #EAEAEA',
                      fontFamily: 'Public Sans',
                      fontWeight: 400,
                      fontSize: '12px',
                      lineHeight: '150%',
                      color: '#696969',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img src="/images/icons/copy-domain.svg" alt="copy" style={{ width: '12px', height: '12px' }} />
                    Copy
                  </button>
                </div>

                {/* Current Domain Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #EDEDED', paddingBottom: '24px' }}>
                  <div
                    style={{
                      fontFamily: 'Public Sans',
                      fontWeight: 600,
                      fontSize: '12px',
                      lineHeight: '150%',
                      color: '#A4A4A4'
                    }}
                  >
                    YOUR CURRENT DOMAIN
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        fontFamily: 'Public Sans',
                        fontWeight: 600,
                        fontSize: '16px',
                        lineHeight: '28px',
                        color: '#7C3AED'
                      }}
                    >
                      {savedCustomDomain}
                    </span>
                    <span
                      style={{
                        width: '108px',
                        height: '26px',
                        borderRadius: '71px',
                        padding: '4px 10px',
                        background: '#F4F4F4',
                        fontFamily: 'Public Sans',
                        fontWeight: 400,
                        fontSize: '12px',
                        lineHeight: '150%',
                        color: '#808080',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      Custom Domain
                    </span>
                  </div>
                </div>

                {/* Info Box */}
                <div
                  style={{
                    width: '382px',
                    height: '88px',
                    borderRadius: '4px',
                    padding: '16px 24px',
                    background: '#ECF0FE',
                    fontFamily: 'Public Sans',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '18.5px',
                    color: '#0048B5'
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Info:</span> If you wish to switch back to your subdomain, <span style={{ fontWeight: 700 }}>COPY</span> and <span style={{ fontWeight: 700 }}>PASTE</span> the subdomain above into the below text field and click on 'Save Changes'.
                </div>

                {/* Edit Domain Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    style={{
                      fontFamily: 'Public Sans',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: '100%',
                      color: '#202020'
                    }}
                  >
                    Edit Your current Domain
                  </div>
                  <input
                    type="text"
                    value={editDomain}
                    onChange={(e) => setEditDomain(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #EAEAEA',
                      borderRadius: '4px',
                      fontFamily: 'Public Sans',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '150%',
                      color: '#202020',
                      background: '#FFFFFF'
                    }}
                    placeholder="Enter domain"
                  />
                  <button
                    onClick={handleEditSave}
                    style={{
                      width: '141px',
                      height: '32px',
                      borderRadius: '4px',
                      padding: '8px 24px',
                      background: '#080808',
                      border: 'none',
                      fontFamily: 'Public Sans',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '150%',
                      color: '#EDEDED',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Divider Line */}
            <div className="border-t border-gray-200 mb-8 md:mb-12"></div>

            {/* Instructions Section */}
            <div id="instructions" className="space-y-4 w-full px-10 max-w-[100%]  max-md:px-0">
              <h2 className="text-base md:text-lg font-bold text-gray-900">Custom Domain Integration Instructions</h2>

              <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                <p>
                  <span className="font-semibold">1.</span> Enter the correct domain name that you have bought/own in the domain field
                </p>

                <p className="text-gray-600 pl-4 md:pl-4">
                  Now to connect your existing website to your new domain, please do the following steps :
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

                <p className="text-gray-600 pl-4 md:pl-4">(or)</p>

                <p className="font-semibold">
                  If there is no existing A record, you can create your own A record by doing the following steps
                </p>

                {/* Instructional Image - Different for mobile and desktop/tablet */}
                <div className="my-6 bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                  {/* Mobile Image - Only for small screens (phones) */}
                  <img
                    src="/images/Domain/DomainMobile.jpg"
                    alt="DNS Configuration Steps showing steps 1-5 for adding A record"
                    className="w-full h-auto block sm:hidden"
                  />
                  {/* Desktop/Tablet Image - For tablets and larger */}
                  <img
                    src="/images/Domain/Imageeess.jpg"
                    alt="DNS Configuration Steps showing steps 1-5 for adding A record"
                    className="w-full h-auto hidden sm:block"
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


      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div
            style={{
              width: '489px',
              height: '286px',
              borderRadius: '4px',
              padding: '40px',
              gap: '12px',
              background: '#FEFEFE',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <h3
              style={{
                fontFamily: 'Public Sans',
                fontWeight: 700,
                fontSize: '16px',
                lineHeight: '28px',
                textAlign: 'center',
                color: '#000000',
                margin: 0
              }}
            >
              Are you sure you want to change your domain name?
            </h3>

            <div
              style={{
                width: '401px',
                height: '102px',
                borderRadius: '8px',
                border: '1px solid #EAEAEA',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <div
                style={{
                  fontFamily: 'Public Sans',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '150%',
                  color: '#A4A4A4',
                  textTransform: 'uppercase'
                }}
              >
                YOUR DOMAIN WILL BE CHANGED TO
              </div>
              <div
                style={{
                  fontFamily: 'Public Sans',
                  fontWeight: 600,
                  fontSize: '18px',
                  lineHeight: '28px',
                  background: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                {pendingDomain}
              </div>
            </div>

            <div className="flex gap-4 ml-auto" style={{ marginTop: '20px' }}>
              <button
                onClick={handleCancelSave}
                style={{
                  minWidth: '94px',
                  height: '32px',
                  borderRadius: '4px',
                  padding: '8px 24px',
                  gap: '4px',
                  background: '#F4F4F4',
                  border: 'none',
                  fontFamily: 'Public Sans',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '150%',
                  color: '#2E2E2E',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                style={{
                  minWidth: '123px',
                  height: '32px',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  gap: '10px',
                  background: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)',
                  border: 'none',
                  fontFamily: 'Public Sans',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '100%',
                  color: '#EDEDED',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showRevertConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div
            style={{
              width: '343px',
              height: '192px',
              borderRadius: '4px',
              padding: '40px',
              gap: '24px',
              background: '#FEFEFE',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <h3
              style={{
                fontFamily: 'Public Sans',
                fontWeight: 700,
                fontSize: '16px',
                lineHeight: '28px',
                textAlign: 'center',
                color: '#000000',
                margin: 0
              }}
            >
              Are you sure you want to change back to Subdomain ?
            </h3>

            <div className="flex gap-2">
              <button
                onClick={handleCancelRevert}
                style={{
                  minWidth: '94px',
                  height: '32px',
                  borderRadius: '4px',
                  padding: '8px 24px',
                  gap: '4px',
                  background: '#F4F4F4',
                  border: 'none',
                  fontFamily: 'Public Sans',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '150%',
                  color: '#2E2E2E',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                No, Cancel
              </button>
              <button
                onClick={handleConfirmRevert}
                style={{
                  minWidth: '82px',
                  height: '32px',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  gap: '10px',
                  background: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)',
                  border: 'none',
                  fontFamily: 'Public Sans',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '100%',
                  color: '#EDEDED',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
