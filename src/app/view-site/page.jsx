import ViewSiteHeader from './components/Header/Header';
import LatestBlog from './components/LatestBlog/LatestBlog';
import AllArticles from './components/AllArticles/AllArticles';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import mockData from '@/data/mockBlogs.json';

export default function ViewSitePage() {
  const latestBlog = mockData.blogs[0];
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ViewSiteHeader 
        userName={latestBlog.author.name} 
        userAvatar={latestBlog.author.avatar} 
      />
      <div className="flex-grow">
        <LatestBlog />
        <AllArticles />
      </div>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
