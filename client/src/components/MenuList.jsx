import { useEffect, useState } from 'react';
import { getApiErrorMessage, useGetMenuQuery } from '../store/apiSlice';
import MenuItemCard from './MenuItemCard';

export default function MenuList({ searchQuery = '', onClearSearch }) {
  const { data: menu = [], isLoading, isFetching, error, refetch } = useGetMenuQuery();
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setPage(1);
    if (!searchQuery.trim()) return undefined;
    const timer = setTimeout(() => {
      document.querySelector('.menu-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (isLoading || isFetching) return <div className="menu-status menu-status--loading" role="status"><div className="menu-loader"><span></span><span></span><span></span></div><h2>{error ? 'Reconnecting to the kitchen' : 'Preparing the menu'}</h2><p>{error ? 'Trying to reach the menu service again…' : 'Gathering something delicious for you…'}</p></div>;
  if (error) {
    const errorMessage = getApiErrorMessage(error);
    const friendlyMessage = /failed to fetch|network/i.test(errorMessage) ? 'The menu service is currently unreachable. Please check that the server is running and try again.' : errorMessage;
    return <div className="menu-status menu-status--error" role="alert"><div className="menu-status__icon">!</div><p className="eyebrow">Kitchen connection lost</p><h2>We couldn’t load the menu</h2><p>{friendlyMessage}</p><button type="button" onClick={() => refetch()}>Try again</button></div>;
  }

  const categories = ['All', ...new Set(menu.map((item) => item.category))];
  const categoryItems = activeCategory === 'All'
    ? menu
    : menu.filter((item) => item.category === activeCategory);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleItems = normalizedQuery ? categoryItems.filter((item) => `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(normalizedQuery)) : categoryItems;
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / itemsPerPage));
  const pageItems = visibleItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <section>
      <div className="category-tabs">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-tab ${activeCategory === category ? 'category-tab--active' : ''}`}
            onClick={() => { setActiveCategory(category); setPage(1); }}
          >
            <span className="category-tab__image">{category === 'All' ? <span>✦</span> : <img src={menu.find((item) => item.category === category)?.image} alt="" />}</span>
            <span>{category}</span>
          </button>
        ))}
      </div>
      <div className="menu-grid">
        {pageItems.map((item) => <MenuItemCard key={item.id} item={item} />)}
      </div>
      {visibleItems.length === 0 && <div className="menu-empty"><div className="menu-empty__icon"><span>⌕</span><i>✦</i></div><p className="eyebrow">Nothing on the plate</p><h3>No dishes found</h3><p>We couldn’t find a match for <strong>“{searchQuery || activeCategory}”</strong>. Try a different dish name or choose another category.</p><button type="button" onClick={() => { setActiveCategory('All'); onClearSearch?.(); window.dispatchEvent(new Event('clear-menu-search')); }}>Browse all categories</button></div>}
      {visibleItems.length > itemsPerPage && <nav className="pagination" aria-label="Menu pages"><button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>←</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button type="button" key={number} aria-label={`Page ${number}`} aria-current={page === number ? 'page' : undefined} className={page === number ? 'pagination__active' : ''} onClick={() => { setPage(number); document.querySelector('.category-tabs')?.scrollIntoView({ behavior: 'smooth' }); }}>{number}</button>)}<button type="button" aria-label="Next page" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>→</button></nav>}
    </section>
  );
}
