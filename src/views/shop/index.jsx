/* eslint-disable react/jsx-props-no-spreading */
import { AppliedFilters, ProductGrid, ProductList } from '@/components/product';
import { useDocumentTitle, useScrollTop } from '@/hooks';
import React, { useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { selectFilter } from '@/selectors/selector';
import { applyFilter, resetFilter } from '@/redux/actions/filterActions';

const CategoryBar = ({ products, activeCategory }) => {
  const dispatch = useDispatch();

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return ['Todos', ...Array.from(cats).sort()];
  }, [products]);

  const onSelect = (cat) => {
    if (cat === 'Todos') {
      dispatch(resetFilter());
    } else {
      dispatch(applyFilter({ category: cat }));
    }
  };

  if (categories.length <= 1) return null;

  return (
    <div className="category-bar">
      {categories.map((cat) => {
        const isActive = cat === 'Todos' ? !activeCategory : activeCategory === cat;
        return (
          <button
            key={cat}
            type="button"
            className={`category-pill${isActive ? ' category-pill--active' : ''}`}
            onClick={() => onSelect(cat)}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};

const Shop = () => {
  useDocumentTitle('Tienda | STL Premium');
  useScrollTop();

  const store = useSelector((state) => ({
    filteredProducts: selectFilter(state.products.items, state.filter),
    products: state.products,
    allProducts: state.products.items,
    requestStatus: state.app.requestStatus,
    isLoading: state.app.loading,
    activeCategory: state.filter.category,
  }), shallowEqual);

  return (
    <main className="content">
      <section className="product-list-wrapper">
        <CategoryBar
          products={store.allProducts || []}
          activeCategory={store.activeCategory}
        />
        <AppliedFilters filteredProductsCount={store.filteredProducts.length} />
        <ProductList {...store}>
          <ProductGrid products={store.filteredProducts} />
        </ProductList>
      </section>
    </main>
  );
};

export default Shop;
