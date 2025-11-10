import ViewSiteHeader from './components/Header/Header';
import LatestBlog from './components/LatestBlog/LatestBlog';
import AllArticles from './components/AllArticles/AllArticles';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';

export default function ViewSitePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ViewSiteHeader userName="Rajeswari" />
      <LatestBlog />
      <AllArticles />
      <Footer />
      <ScrollToTop />
    </div>
  );
}
