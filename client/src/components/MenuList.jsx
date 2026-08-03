import { useState } from 'react';
import { getApiErrorMessage, useGetMenuQuery } from '../store/apiSlice';
import MenuItemCard from './MenuItemCard';

export default function MenuList() {
  const { data: menu = [], isLoading, error } = useGetMenuQuery();
  const [activeCategory, setActiveCategory] = useState('All');

  if (isLoading) return <p className="status-text">Loading menu…</p>;
  if (error) {
    return <p className="status-text status-text--error">Failed to load menu: {getApiErrorMessage(error)}</p>;
  }

  const categories = ['All', ...new Set(menu.map((item) => item.category))];
  const visibleItems = activeCategory === 'All'
    ? menu
    : menu.filter((item) => item.category === activeCategory);

  return (
    <section>
      <div className="category-tabs">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-tab ${activeCategory === category ? 'category-tab--active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="menu-grid">
        {visibleItems.map((item) => <MenuItemCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}
