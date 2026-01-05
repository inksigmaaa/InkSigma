"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import Sidebar from "../../components/sidebar/Sidebar"

export default function SettingsPage() {
  const router = useRouter()
  const [showResetModal, setShowResetModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // Publication data
  const [publicationId, setPublicationId] = useState(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [originalSubdomain, setOriginalSubdomain] = useState("")
  const [logo, setLogo] = useState("/icons/inksigma-logo.svg")
  const [favicon, setFavicon] = useState("/icons/inksigma-logo.svg")
  const [metaOg, setMetaOg] = useState("/icons/inksigma-logo.svg")

  // Load publication data - removed API call

  const loadPublicationData = async () => {
    // Frontend only - no API call
    setLoading(false)
  }

  const handleImageUpload = async (file, type) => {
    // Frontend only - just preview the image
    try {
      setUploading(true)
      setError(null)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'logo') {
          setLogo(reader.result)
          setSuccess('Logo updated!')
        } else if (type === 'favicon') {
          setFavicon(reader.result)
          setSuccess('Favicon updated!')
        } else if (type === 'meta_og') {
          setMetaOg(reader.result)
          setSuccess('Meta OG image updated!')
        }
        setTimeout(() => setSuccess(null), 3000)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Upload error:', err)
      setError(`Failed to upload ${type}: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleLogoChange = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        await handleImageUpload(file, 'logo')
      }
    }
    input.click()
  }

  const handleFaviconChange = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        await handleImageUpload(file, 'favicon')
      }
    }
    input.click()
  }

  const handleMetaOgChange = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        await handleImageUpload(file, 'meta_og')
      }
    }
    input.click()
  }

  const handleImageRemove = async (type) => {
    if (type === 'logo') setLogo("/icons/inksigma-logo.svg")
    else if (type === 'favicon') setFavicon("/icons/inksigma-logo.svg")
    else if (type === 'meta_og') setMetaOg("/icons/inksigma-logo.svg")
  }

  const handleLogoRemove = () => handleImageRemove('logo')
  const handleFaviconRemove = () => handleImageRemove('favicon')
  const handleMetaOgRemove = () => handleImageRemove('meta_og')

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      // Frontend only - just show success
      setShowSuccessModal(true)
    } catch (err) {
      console.error('Save error:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <div className="min-h-screen bg-white flex justify-center p-4 sm:p-6 md:p-8 pt-[140px] md:pt-32 md:pl-64 mb-20 md:mb-0">
        <div className="w-[400px] h-[1100px] space-y-8">
          <h1 className="text-lg font-bold text-gray-900 text-center">Publication Settings</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          
          {uploading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
              Uploading image...
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              {success}
            </div>
          )}
          
          {/* Logo Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-6 mb-3">
              <div className="w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                <img src={logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleLogoChange} className="text-purple-500 text-sm hover:text-purple-600">Change Logo</button>
                <button onClick={handleLogoRemove} className="text-gray-400 text-sm hover:text-gray-600">Remove</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded">Optimal Resolution: 400 px X 400 px</p>
          </div>

          {/* Favicon Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-6 mb-3">
              <div className="w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                <img src={favicon} alt="Favicon" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleFaviconChange} className="text-purple-500 text-sm hover:text-purple-600">Change Favicon</button>
                <button onClick={handleFaviconRemove} className="text-gray-400 text-sm hover:text-gray-600">Remove</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded">Optimal Resolution: 32 px X 32 px</p>
          </div>

          {/* Meta OG Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-6 mb-3">
              <div className="w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                <img src={metaOg} alt="Meta OG" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleMetaOgChange} className="text-purple-500 text-sm hover:text-purple-600">Change Meta OG</button>
                <button onClick={handleMetaOgRemove} className="text-gray-400 text-sm hover:text-gray-600">Remove</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded">Optimal Resolution: 630 px X 1200 px</p>
          </div>

          {/* Publication Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Publication Name</label>
            <input
              type="text"
              placeholder="Publication name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={50}
              className="w-full border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Publication Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Publication Description</label>
            <textarea
              placeholder="Write publication Description"
              value={description || ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Subdomain */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Subdomain name</label>
            <div className="flex items-center gap-2 border-b border-gray-300 pb-2">
              <input
                type="text"
                placeholder="Graceblog"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                minLength={3}
                maxLength={63}
                className="flex-1 text-sm focus:outline-none"
              />
              <span className="text-sm text-gray-600">.inksigma.com</span>
            </div>
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors mb-6 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Do you want to reset your password?
            </h2>
            <p className="text-gray-500 mb-8">
              we will send you a link to your Email and You will be logged out
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false)
                  setShowSuccessModal(true)
                }}
                className="flex-1 bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Settings Saved
              </h2>
              <p className="text-gray-500">
                Your publication settings have been updated successfully
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
