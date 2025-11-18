"use client"

import { useState } from "react"
import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import Sidebar from "../../components/sidebar/Sidebar"

export default function PublicationSettingsPage() {
  const [logo, setLogo] = useState("/icons/inksigma-logo.svg")
  const [favicon, setFavicon] = useState("/icons/inksigma-logo.svg")
  const [metaOg, setMetaOg] = useState("/icons/inksigma-logo.svg")

  const handleLogoChange = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setLogo(event.target.result)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleFaviconChange = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setFavicon(event.target.result)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleMetaOgChange = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setMetaOg(event.target.result)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleLogoRemove = () => {
    setLogo("/icons/inksigma-logo.svg")
  }

  const handleFaviconRemove = () => {
    setFavicon("/icons/inksigma-logo.svg")
  }

  const handleMetaOgRemove = () => {
    setMetaOg("/icons/inksigma-logo.svg")
  }

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <div className="min-h-screen bg-white p-4 sm:p-6 md:p-8 pt-[140px] md:pt-32 mb-20 md:mb-0">
        <div className="w-full max-w-[800px] md:max-w-[273px] min-h-[927px] space-y-8 mx-auto md:ml-[calc(50%+82.5px)] md:-translate-x-1/2">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 text-center">Publication Settings</h1>

          {/* Logo Upload */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white flex-shrink-0 overflow-hidden">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-row sm:flex-col gap-4 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
                <button onClick={handleLogoChange} className="text-purple-500 text-xs sm:text-sm hover:text-purple-600">Change Logo</button>
                <button onClick={handleLogoRemove} className="text-gray-400 text-xs sm:text-sm hover:text-gray-600">Remove</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded text-center sm:text-left">Optimal Resolution: 400 px X 400 px</p>
          </div>

          {/* Favicon Upload */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white flex-shrink-0 overflow-hidden">
                <img src={favicon} alt="Favicon" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-row sm:flex-col gap-4 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
                <button onClick={handleFaviconChange} className="text-purple-500 text-xs sm:text-sm hover:text-purple-600">Change Favicon</button>
                <button onClick={handleFaviconRemove} className="text-gray-400 text-xs sm:text-sm hover:text-gray-600">Remove</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded text-center sm:text-left">Optimal Resolution: 32 px X 32 px</p>
          </div>

          {/* Meta OG Upload */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white flex-shrink-0 overflow-hidden">
                <img src={metaOg} alt="Meta OG" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-row sm:flex-col gap-4 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
                <button onClick={handleMetaOgChange} className="text-purple-500 text-xs sm:text-sm hover:text-purple-600">Change Meta OG</button>
                <button onClick={handleMetaOgRemove} className="text-gray-400 text-xs sm:text-sm hover:text-gray-600">Remove</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded text-center sm:text-left">Optimal Resolution: 630 px X 1200 px</p>
          </div>

          {/* Publication Name */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Publication Name</label>
            <input
              type="text"
              placeholder="Publication name"
              className="w-full border-b border-gray-300 py-2 text-xs sm:text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Publication Description */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Publication Description</label>
            <input
              type="text"
              placeholder="Write publication Description"
              className="w-full border-b border-gray-300 py-2 text-xs sm:text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Subdomain */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Subdomain name</label>
            <div className="flex items-center gap-2 border-b border-gray-300 pb-2">
              <input
                type="text"
                placeholder="Graceblog"
                className="flex-1 text-xs sm:text-sm focus:outline-none min-w-0"
              />
              <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">.inksigma.com</span>
            </div>
          </div>

          {/* Save Button */}
          <button className="w-full bg-black text-white py-2.5 sm:py-3 rounded-md hover:bg-gray-800 transition-colors text-sm sm:text-base">
            Save
          </button>
        </div>
      </div>
    </>
  )
}
