export default function EditorContentSkeleton() {
  return (
    <div className="w-full">
      <div
        className="hidden xl:flex items-center gap-2 px-4 bg-white border-b border-gray-200"
        style={{ height: "52px" }}
      >
        <div className="h-5 w-20 rounded bg-gray-200 animate-pulse" />
        <div className="h-6 w-px bg-gray-200" />
        <div className="h-7 w-10 rounded bg-gray-200 animate-pulse" />
        <div className="h-6 w-px bg-gray-200" />
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="h-8 w-8 rounded bg-gray-200 animate-pulse"
          />
        ))}
      </div>

      <div className="px-4 py-6">
        <div className="space-y-4">
          <div className="h-5 w-11/12 rounded bg-gray-200 animate-pulse" />
          <div className="h-5 w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-5 w-10/12 rounded bg-gray-200 animate-pulse" />
          <div className="h-5 w-8/12 rounded bg-gray-200 animate-pulse" />
          <div className="pt-4 space-y-3">
            <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-11/12 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-9/12 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
