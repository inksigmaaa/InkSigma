import Image from 'next/image';
import Link from 'next/link';
import ShareMenu from '../ShareMenu/ShareMenu';

export default function AllArticles() {
  const articles = [];

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
      <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-black">All Blog</h2>
      
      {articles.length === 0 ? (
        <p className="text-gray-500">No articles available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-20 md:mb-40 pb-10">
          {articles.map((article) => {
            const dateFormatted = formatDate(article.createdAt);
            return (
              <div key={article.id} className="flex flex-col">
                {/* Author and Date */}
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                      {article.author?.avatar && (
                        <Image src={article.author.avatar} alt={article.author.name} width={40} height={40} />
                      )}
                    </div>
                    <span className="text-gray-800 font-medium text-sm md:text-base">{article.author?.name || 'Anonymous'}</span>
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

              <Link href={`/view-site/blog/${article.slug}`} className="absolute inset-0 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer block">
                {/* Background Image */}
                <Image 
                  src={article.thumbnail} 
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </Link>
            </div>

            {/* Title and Description */}
            <div className="mb-3 md:mb-4">
              <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2 text-black line-clamp-2">{article.title}</h3>
              <p className="text-gray-700 text-xs md:text-sm line-clamp-2">{article.description}</p>
            </div>

            {/* Category */}
            <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
              <span className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-xs md:text-sm hover:bg-gray-50 transition-colors cursor-pointer">
                {article.category}
              </span>
            </div>

            {/* Read Article Button */}
            <Link href={`/view-site/blog/${article.slug}`} className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors w-full md:w-fit mt-4 md:mt-10 text-sm md:text-base">
              Read Article
              <Image 
                src="/svg/arrow-right.svg" 
                alt="Arrow"
                width={16}
                height={16}
              />
            </Link>
          </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
