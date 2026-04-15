import { CloseOutlined } from '@ant-design/icons';
import { ImageLoader } from '@/components/common';
import { displayMoney } from '@/helpers/utils';
import PropType from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { removeFromBasket } from '@/redux/actions/basketActions';

const BasketItem = ({ product }) => {
  const dispatch = useDispatch();
  const onRemoveFromBasket = () => dispatch(removeFromBasket(product.id));

  return (
    <div className="basket-item">
      <div className="basket-item-wrapper">
        <div className="basket-item-img-wrapper">
          <ImageLoader
            alt={product.name}
            className="basket-item-img"
            src={product.previewImageURL || product.image}
          />
        </div>
        <div className="basket-item-details">
          <Link to={`/product/${product.id}`} onClick={() => document.body.classList.remove('is-basket-open')}>
            <h4 className="underline basket-item-name">
              {product.name}
            </h4>
          </Link>
          <div className="basket-item-specs">
            {product.selectedFlavor && (
              <div>
                <span className="spec-title">Talle</span>
                <h5 className="my-0">{product.selectedFlavor}</h5>
              </div>
            )}
            {product.selectedColor && (
              <div>
                <span className="spec-title">Color</span>
                <div style={{
                  backgroundColor: product.selectedColor,
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%'
                }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="basket-item-price">
          <h4 className="my-0">{displayMoney(product.price || 0)}</h4>
        </div>
        <button
          className="basket-item-remove button button-border button-border-gray button-small"
          onClick={onRemoveFromBasket}
          type="button"
        >
          <CloseOutlined />
        </button>
      </div>
    </div>
  );
};

BasketItem.propTypes = {
  product: PropType.shape({
    id: PropType.string,
    name: PropType.string,
    price: PropType.number,
    quantity: PropType.number,
    selectedFlavor: PropType.string, // New prop for flavor
    selectedColor: PropType.string,  // Keep color prop
    image: PropType.string,
  }).isRequired
};

export default BasketItem;



