import { Suspense } from "react"
import AuthGuard from "@/components/AuthGuard"
import EditorPageClient from "./components/EditorPageClient"

export default function EditorPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div>Loading...</div>}>
        <EditorPageClient />
      </Suspense>
    </AuthGuard>
  )
}