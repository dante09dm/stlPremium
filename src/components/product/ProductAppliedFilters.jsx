/* eslint-disable no-nested-ternary */
import { CloseCircleOutlined } from '@ant-design/icons';
import PropType from 'prop-types';
import React from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { applyFilter } from '@/redux/actions/filterActions';

const ProductAppliedFilters = ({ filteredProductsCount }) => {
  const filter = useSelector((state) => state.filter, shallowEqual);
  const fields = ['category', 'minPrice', 'maxPrice', 'sortBy', 'keyword'];
  const isFiltered = fields.some((key) => !!filter[key]);
  const dispatch = useDispatch();

  const onRemoveKeywordFilter = () => dispatch(applyFilter({ keyword: '' }));
  const onRemovePriceRangeFilter = () => dispatch(applyFilter({ minPrice: 0, maxPrice: 0 }));
  const onRemoveCategoryFilter = () => dispatch(applyFilter({ category: '' }));
  const onRemoveSortFilter = () => dispatch(applyFilter({ sortBy: '' }));

  return !isFiltered ? null : (
    <>
      <div className="product-list-header">
        <div className="product-list-header-title">
          <h5>
            {filteredProductsCount > 0
              && `${filteredProductsCount} ${filteredProductsCount > 1 ? 'productos encontrados' : 'producto encontrado'}`}
          </h5>
        </div>
      </div>
      <div className="product-applied-filters">
        {filter.keyword && (
          <div className="pill-wrapper">
            <span className="d-block">Palabra clave</span>
            <div className="pill padding-right-l">
              <h5 className="pill-content margin-0">{filter.keyword}</h5>
              <div className="pill-remove" onClick={onRemoveKeywordFilter} role="presentation">
                <h5 className="margin-0 text-subtle"><CloseCircleOutlined /></h5>
              </div>
            </div>
          </div>
        )}
        {filter.category && (
          <div className="pill-wrapper">
            <span className="d-block">Categoría</span>
            <div className="pill padding-right-l">
              <h5 className="pill-content margin-0">{filter.category}</h5>
              <div className="pill-remove" onClick={onRemoveCategoryFilter} role="presentation">
                <h5 className="margin-0 text-subtle"><CloseCircleOutlined /></h5>
              </div>
            </div>
          </div>
        )}
        {(!!filter.minPrice || !!filter.maxPrice) && (
          <div className="pill-wrapper">
            <span className="d-block">Precio</span>
            <div className="pill padding-right-l">
              <h5 className="pill-content margin-0">
                ${filter.minPrice} - ${filter.maxPrice}
              </h5>
              <div className="pill-remove" onClick={onRemovePriceRangeFilter} role="presentation">
                <h5 className="margin-0 text-subtle"><CloseCircleOutlined /></h5>
              </div>
            </div>
          </div>
        )}
        {filter.sortBy && (
          <div className="pill-wrapper">
            <span className="d-block">Ordenado por</span>
            <div className="pill padding-right-l">
              <h5 className="pill-content margin-0">
                {filter.sortBy === 'price-desc' ? 'Precio Mayor - Menor'
                  : filter.sortBy === 'price-asc' ? 'Precio Menor - Mayor'
                  : filter.sortBy === 'name-desc' ? 'Nombre Z - A'
                  : 'Nombre A - Z'}
              </h5>
              <div className="pill-remove" onClick={onRemoveSortFilter} role="presentation">
                <h5 className="margin-0 text-subtle"><CloseCircleOutlined /></h5>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

ProductAppliedFilters.defaultProps = {
  filteredProductsCount: 0
};

ProductAppliedFilters.propTypes = {
  filteredProductsCount: PropType.number
};

export default ProductAppliedFilters;
