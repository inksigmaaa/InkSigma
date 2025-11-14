import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import Sidebar from "../../components/sidebar/Sidebar"

export default function PublicationSettingsPage() {
  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <div className="min-h-screen bg-white flex justify-center p-8 pt-32 pl-64" style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ width: '273px', minHeight: '927px' }} className="space-y-8">
          <h1 className="text-lg font-bold text-gray-900 text-center">Publication Settings</h1>
          
          {/* Logo Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-6 mb-3">
              <div className="w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white">
                <img src="/icons/inksigma-logo.svg" alt="Logo" className="w-16 h-16" />
              </div>
              <div className="flex flex-col gap-3">
                <button className="text-purple-500 text-sm hover:text-purple-600">Change Logo</button>
                <button className="text-gray-400 text-sm hover:text-gray-600">Remove</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded">Optimal Resolution: 400 px X 400 px</p>
          </div>

          {/* Favicon Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-6 mb-3">
              <div className="w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white">
                <img src="/icons/inksigma-logo.svg" alt="Favicon" className="w-16 h-16" />
              </div>
              <div className="flex flex-col gap-3">
                <button className="text-purple-500 text-sm hover:text-purple-600">Change Favicon</button>
                <button className="text-gray-400 text-sm hover:text-gray-600">Remove</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded">Optimal Resolution: 32 px X 32 px</p>
          </div>

          {/* Meta OG Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-6 mb-3">
              <div className="w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white">
                <img src="/icons/inksigma-logo.svg" alt="Meta OG" className="w-16 h-16" />
              </div>
              <div className="flex flex-col gap-3">
                <button className="text-purple-500 text-sm hover:text-purple-600">Change Meta OG</button>
                <button className="text-gray-400 text-sm hover:text-gray-600">Remove</button>
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
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Publication Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Publication Description</label>
            <textarea
              placeholder="Write publication description"
              rows={3}
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Subdomain */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Subdomain name</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="yoursublog"
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
              <span className="text-sm text-gray-600">.inksigma.com</span>
            </div>
          </div>

          {/* Save Button */}
          <button className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors">
            Save
          </button>
        </div>
      </div>
    </>
  )
}
