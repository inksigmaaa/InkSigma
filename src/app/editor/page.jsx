import { Suspense } from "react"
import AuthGuard from "@/components/auth/AuthGuard"
import { AuthProvider } from "@/contexts/AuthContext"
import { PublicationProvider } from "@/contexts/PublicationContext"
import { ArticlesProvider } from "@/contexts/ArticlesContext"
import EditorPageClient from "./components/EditorPageClient"

export default function EditorPage() {
  return (
    <AuthProvider>
      <PublicationProvider>
        <ArticlesProvider>
          <AuthGuard>
            <Suspense fallback={<div>Loading...</div>}>
              <EditorPageClient />
            </Suspense>
          </AuthGuard>
        </ArticlesProvider>
      </PublicationProvider>
    </AuthProvider>
  )
}
