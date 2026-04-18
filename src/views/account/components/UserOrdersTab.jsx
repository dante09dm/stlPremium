import { LoadingOutlined, DownloadOutlined, ShoppingOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import firebase from '@/services/firebase';
import { displayMoney } from '@/helpers/utils';

const UserOrdersTab = () => {
  const { id: userId, email } = useSelector((state) => ({
    id: state.auth.id,
    email: state.profile.email
  }));

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [userId, email]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Buscar órdenes por userId (usuario registrado) o por email (compra sin registro)
      let ordersData = [];

      if (userId) {
        const snap = await firebase.db
          .collection('orders')
          .where('userId', '==', userId)
          .where('status', '==', 'approved')
          .orderBy('createdAt', 'desc')
          .get();
        ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // Si no encontró por userId o no está registrado, buscar por email
      if (ordersData.length === 0 && email) {
        const snap = await firebase.db
          .collection('orders')
          .where('payerEmail', '==', email)
          .where('status', '==', 'approved')
          .orderBy('createdAt', 'desc')
          .get();
        ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      setOrders(ordersData);

      // Cargar datos de productos comprados para obtener los stlURLs
      const allProductIds = [...new Set(ordersData.flatMap(o => o.productIds || []))];
      if (allProductIds.length > 0) {
        const productData = {};
        await Promise.all(
          allProductIds.map(async (pid) => {
            try {
              const doc = await firebase.db.collection('products').doc(pid).get();
              if (doc.exists) productData[pid] = { id: doc.id, ...doc.data() };
            } catch (e) {
              console.error(`Error loading product ${pid}:`, e);
            }
          })
        );
        setProducts(productData);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (stlURL, fileName, downloadKey) => {
    setDownloadingId(downloadKey);
    try {
      const response = await fetch(stlURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'modelo.stl';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error al descargar el archivo. Intentá de nuevo.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="loader" style={{ minHeight: '50vh' }}>
        <LoadingOutlined style={{ fontSize: '2rem' }} />
        <h6>Cargando archivos...</h6>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{
        minHeight: '50vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#555'
      }}>
        <ShoppingOutlined style={{ fontSize: '4rem', color: '#333' }} />
        <h3 style={{ margin: 0, color: '#94a3b8' }}>Mis archivos</h3>
        <p style={{ margin: 0 }}>No tenés ningún archivo todavía</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem 0' }}>
      <h3 style={{ marginBottom: '1.5rem', color: '#f1f5f9' }}>Mis archivos</h3>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {orders.map((order) => (
          <div key={order.id} style={{
            border: '1px solid #252525',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#161616',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)'
          }}>
            {/* Header de la orden */}
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#1a1a1a',
              borderBottom: '1px solid #252525',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#555' }}>
                  Orden #{order.paymentId}
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', fontWeight: '600' }}>
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399',
                  padding: '3px 10px', borderRadius: '20px',
                  fontSize: '0.75rem', fontWeight: '700',
                  border: '1px solid rgba(52,211,153,0.2)'
                }}>
                  ✓ Aprobado
                </span>
                {order.totalAmount && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', fontWeight: '700', color: '#ff2442' }}>
                    {displayMoney(order.totalAmount)}
                  </p>
                )}
              </div>
            </div>

            {/* Productos y descargas */}
            <div style={{ padding: '1rem 1.5rem' }}>
              {(order.productIds || []).length === 0 ? (
                <p style={{ color: '#555', fontSize: '0.875rem' }}>
                  No se encontraron productos en esta orden.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {(order.productIds || []).map((productId) => {
                    const product = products[productId];
                    if (!product) return null;

                    return (
                      <div key={productId} style={{
                        padding: '1rem',
                        backgroundColor: '#0f0f0f',
                        borderRadius: '8px',
                        border: '1px solid #1e1e1e'
                      }}>
                        {/* Info del producto */}
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          {product.previewImageURL && (
                            <img
                              src={product.previewImageURL}
                              alt={product.name}
                              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                            />
                          )}
                          <div>
                            <p style={{ margin: 0, fontWeight: '700', color: '#f1f5f9' }}>{product.name}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#555' }}>
                              {product.models?.length === 1
                                ? '1 modelo incluido'
                                : `Bundle: ${product.models?.length} modelos`}
                            </p>
                          </div>
                        </div>

                        {/* Botones de descarga por modelo — GLB + partes STL */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {(product.models || []).map((model, i) => {
                            const stlUrls = model.stlURLs || (model.stlURL ? [model.stlURL] : []);
                            const glbUrl  = model.glbURL || null;
                            if (!glbUrl && stlUrls.length === 0) return null;
                            const modelLabel = model.name || `Modelo ${i + 1}`;

                            return (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {/* Etiqueta de modelo solo si hay varios */}
                                {(product.models.length > 1) && (
                                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {modelLabel}
                                  </p>
                                )}

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                  {/* Botón GLB */}
                                  {glbUrl && (() => {
                                    const downloadKey = `${productId}-${i}-glb`;
                                    const isDownloading = downloadingId === downloadKey;
                                    const fileName = `${product.name}-${modelLabel}.glb`.toLowerCase().replace(/\s+/g, '-');
                                    return (
                                      <button
                                        key="glb"
                                        onClick={() => handleDownload(glbUrl, fileName, downloadKey)}
                                        disabled={isDownloading}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                                          padding: '0.45rem 0.9rem',
                                          backgroundColor: isDownloading ? '#1a1a1a' : 'rgba(255,36,66,0.08)',
                                          color: isDownloading ? '#444' : '#ff6680',
                                          border: '1px solid',
                                          borderColor: isDownloading ? '#252525' : 'rgba(255,36,66,0.25)',
                                          borderRadius: '7px',
                                          cursor: isDownloading ? 'not-allowed' : 'pointer',
                                          fontSize: '0.78rem', fontWeight: '600',
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        {isDownloading
                                          ? <><LoadingOutlined /> Descargando...</>
                                          : <><DownloadOutlined /> GLB</>
                                        }
                                      </button>
                                    );
                                  })()}

                                  {/* Botones STL por parte */}
                                  {stlUrls.map((stlURL, j) => {
                                    const downloadKey = `${productId}-${i}-stl-${j}`;
                                    const isDownloading = downloadingId === downloadKey;
                                    const partSuffix = stlUrls.length > 1 ? ` Parte ${j + 1}` : '';
                                    const fileName = `${product.name}-${modelLabel}${partSuffix}.stl`.toLowerCase().replace(/\s+/g, '-');
                                    return (
                                      <button
                                        key={`stl-${j}`}
                                        onClick={() => handleDownload(stlURL, fileName, downloadKey)}
                                        disabled={isDownloading}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                                          padding: '0.45rem 0.9rem',
                                          backgroundColor: isDownloading ? '#1a1a1a' : 'rgba(52,211,153,0.08)',
                                          color: isDownloading ? '#444' : '#34d399',
                                          border: '1px solid',
                                          borderColor: isDownloading ? '#252525' : 'rgba(52,211,153,0.25)',
                                          borderRadius: '7px',
                                          cursor: isDownloading ? 'not-allowed' : 'pointer',
                                          fontSize: '0.78rem', fontWeight: '600',
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        {isDownloading
                                          ? <><LoadingOutlined /> Descargando...</>
                                          : <><DownloadOutlined /> STL{stlUrls.length > 1 ? ` ${j + 1}` : ''}</>
                                        }
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserOrdersTab;
