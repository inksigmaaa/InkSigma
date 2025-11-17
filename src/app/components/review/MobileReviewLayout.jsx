import ReviewMeta from "./ReviewMeta"

export default function MobileReviewLayout({ article }) {
  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {article.author}
          </h1>
        </div>
        <div className="ml-4">
          <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded border">
            {article.status}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-700 border-b border-[#fff] pb-1 mb-6">
          {article.title}
        </h2>
        
        <div className="flex gap-3 flex-wrap mb-8">
          {article.tags.map((tag, index) => (
            <span 
              key={index}
              className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <ReviewMeta date={article.date} />
    </div>
  )
}