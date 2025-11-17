import Image from 'next/image';
import Link from 'next/link';
import ShareMenu from '../ShareMenu/ShareMenu';
import mockData from '../../mockData.json';

export default function AllArticles({ searchQuery = '', selectedCategory = '' }) {
  const articles = mockData.blogs;

  // Filter articles based on search query and selected category
  const filteredArticles = articles.filter((article) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query) ||
        article.author?.name.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }
    
    // Filter by selected category
    if (selectedCategory && article.category !== selectedCategory) {
      return false;
    }
    
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return {
      day: days[date.getDay()],
      date: `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`,
    };
  };

  return (
    <section className="w-full max-w-[90%] md:max-w-[70%] mx-auto py-6 md:py-12 px-4 md:px-0">
      <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-black">
        All Blog {searchQuery && `(${filteredArticles.length} results)`}
      </h2>
      
      {filteredArticles.length === 0 ? (
        <p className="text-gray-500">
          {searchQuery ? `No articles found for "${searchQuery}"` : 'No articles available yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-20 md:mb-40 pb-10">
          {filteredArticles.map((article) => {
            const dateFormatted = formatDate(article.createdAt);
            return (
              <div key={article.id} className="border border-gray-200 rounded-md hover:shadow-lg transition-shadow bg-white p-3.5 flex flex-col">
                {/* Author and Date */}
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                      {article.author?.avatar && (
                        <Image src={article.author.avatar} alt={article.author.name} width={40} height={40} unoptimized />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800 font-medium text-sm md:text-base">{article.author?.name || 'Anonymous'}</span>
                      {article.author?.role && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium border ${
                          article.author.role === 'ADMIN' 
                            ? 'bg-purple-50 text-purple-600 border-purple-200' 
                            : 'bg-purple-50 text-purple-600 border-purple-200'
                        }`}>
                          {article.author.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-700 text-xs md:text-sm font-medium whitespace-nowrap">
                      {dateFormatted.date.split(',')[0]}
                    </div>
                  </div>
                </div>

            {/* Blog Card */}
            <div className="relative w-full h-[200px] md:h-[280px] rounded-xl md:rounded-2xl group mb-3 md:mb-4">
              {/* Share Button */}
              <div className="absolute top-3 right-3 md:top-4 md:right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-50">
                <ShareMenu 
                  title={article.title}
                  slug={article.slug}
                />
              </div>

              <Link href={`/view-site/blog/${article.slug}`} className="absolute inset-0 rounded-md md:rounded-md overflow-hidden cursor-pointer block">
                {/* Background Image */}
                <Image 
                  src={article.thumbnail} 
                  alt={article.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </Link>
            </div>

            {/* Title and Description - Flex grow to push category down */}
            <div className="flex-grow mb-3 md:mb-4">
              <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2 text-black line-clamp-2">{article.title}</h3>
              <p className="text-gray-700 text-xs md:text-sm line-clamp-2">{article.description}</p>
            </div>

            {/* Category - Always at bottom */}
            <div className="flex flex-wrap gap-2 mt-auto">
              <span className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-xs md:text-sm hover:bg-gray-50 transition-colors cursor-pointer">
                {article.category}
              </span>
            </div>
          </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
