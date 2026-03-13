import { Suspense } from "react";

import EditorClient from "./EditorClient";

export default function EditorPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-gray-500">
                    Loading editor...
                </div>
            }
        >
            <EditorClient />
        </Suspense>
    );
}
