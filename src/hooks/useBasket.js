import { displayActionMessage } from '@/helpers/utils';
import { useDispatch, useSelector } from 'react-redux';
import { addToBasket as dispatchAddToBasket, removeFromBasket as dispatchRemoveFromBasket } from '@/redux/actions/basketActions';

const useBasket = () => {
  const { basket } = useSelector((state) => ({ basket: state.basket }));
  const dispatch = useDispatch();

  const isItemOnBasket = (id) => !!basket.find((item) => item.id === id);

  // Separate add and remove actions
  const addToBasket = (product) => {
    if (!isItemOnBasket(product.id)) {
      dispatch(dispatchAddToBasket(product));
      displayActionMessage('Producto agregado al carrito', 'success');
    }
  };

  const removeFromBasket = (id) => {
    if (isItemOnBasket(id)) {
      dispatch(dispatchRemoveFromBasket(id));
      displayActionMessage('Producto eliminado del carrito', 'info');
    }
  };

  return { basket, isItemOnBasket, addToBasket, removeFromBasket };
};

export default useBasket;



