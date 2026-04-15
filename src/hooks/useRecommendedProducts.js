import { useDidMount } from '@/hooks';
import { useEffect, useState } from 'react';
import firebase from '@/services/firebase';

const useRecommendedProducts = (itemsCount) => {
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const didMount = useDidMount(true);

  const fetchRecommendedProducts = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching recommended products...'); // Log start of fetch
  
      const docs = await firebase.getRecommendedProducts(itemsCount);
      console.log('Query result:', docs); // Log query result
  
      if (docs.empty) {
        if (didMount) {
          setError('No se encontraron productos recomendados');
          setLoading(false);
        }
      } else {
        const items = [];
  
        docs.forEach((snap) => {
          const data = snap.data();
          console.log('Fetched product:', data); // Log each product

          // Include flavors if available
          const flavors = data.flavors || [];
          items.push({ id: snap.ref.id, ...data, flavors });
        });
  
        if (didMount) {
          setRecommendedProducts(items);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error('Error fetching recommended products:', e.message); // Log error
      if (didMount) {
        setError('Failed to fetch recommended products');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (recommendedProducts.length === 0 && didMount) {
      fetchRecommendedProducts();
    }
  }, []);

  return {
    recommendedProducts, fetchRecommendedProducts, isLoading, error
  };
};

export default useRecommendedProducts;
