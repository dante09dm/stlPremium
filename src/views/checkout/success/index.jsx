import { CheckCircleOutlined, DownloadOutlined, LoadingOutlined, UserOutlined } from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import firebase from '@/services/firebase';
import { displayMoney } from '@/helpers/utils';
import { ACCOUNT } from '@/constants/routes';

const CheckoutSuccess = () => {
  const history = useHistory();
  const location = useLocation();
  const { id: userId } = useSelector((state) => ({ id: state.auth?.id }));

  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState({});
  const [status, setStatus] = useState('loading'); // loading | found | timeout
  const [downloadingId, setDownloadingId] = useState(null);

  const pollRef = useRef(null);
  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 20; // 20 × 3s = 60s máximo

  // Leer payment_id de la URL que manda MP
  const params = new URLSearchParams(location.search);
  const paymentId = params.get('payment_id') || params.get('collection_id');

  useEffect(() => {
    if (!paymentId) {
      setStatus('timeout');
      return;
    }
    pollOrder();
    return () => clearTimeout(pollRef.current);
  }, [paymentId]);

  const pollOrder = async () => {
    attemptsRef.current += 1;

    try {
      const snap = await firebase.db
        .collection('orders')
        .where('paymentId', '==', paymentId)
        .where('status', '==', 'approved')
        .limit(1)
        .get();

      if (!snap.empty) {
        const orderData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setOrder(orderData);
        await loadProducts(orderData.productIds || []);
        setStatus('found');
        return;
      }
    } catch (e) {
      console.error('Poll error:', e);
    }

    if (attemptsRef.current >= MAX_ATTEMPTS) {
      setStatus('timeout');
      return;
    }

    pollRef.current = setTimeout(pollOrder, 3000);
  };

  const loadProducts = async (productIds) => {
    const data = {};
    await Promise.all(productIds.map(async (pid) => {
      try {
        const doc = await firebase.db.collection('products').doc(pid).get();
        if (doc.exists) data[pid] = { id: doc.id, ...doc.data() };
      } catch (e) { console.error(e); }
    }));
    setProducts(data);
  };

  const handleDownload = async (url, fileName, key) => {
    setDownloadingId(key);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = fileName || 'archivo.stl';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(a.href);
      document.body.removeChild(a);
    } catch (e) {
      alert('Error al descargar. Intentá desde "Mis archivos" en tu perfil.');
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={styles.center}>
        <LoadingOutlined style={{ fontSize: '3rem', color: '#ff2442' }} />
        <h3 style={styles.title}>Confirmando tu pago...</h3>
        <p style={styles.sub}>Esto puede tardar unos segundos.</p>
      </div>
    );
  }

  // ── Timeout — pago no confirmado aún ──────────────────────────────────────
  if (status === 'timeout') {
    return (
      <div style={styles.center}>
        <CheckCircleOutlined style={{ fontSize: '3.5rem', color: '#34d399' }} />
        <h3 style={styles.title}>¡Pago recibido!</h3>
        <p style={styles.sub}>
          Tu pago fue procesado. Los archivos estarán disponibles en tu perfil en unos minutos.
        </p>
        <button
          className="button"
          onClick={() => history.push(ACCOUNT)}
          style={styles.btn}
        >
          <UserOutlined /> &nbsp; Ir a Mis archivos
        </button>
      </div>
    );
  }

  // ── Éxito — orden encontrada ───────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <CheckCircleOutlined style={{ fontSize: '3rem', color: '#34d399' }} />
        <h2 style={{ margin: '0.75rem 0 0.25rem', color: '#f1f5f9' }}>¡Compra aprobada!</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          Orden #{paymentId} · {order?.totalAmount && displayMoney(order.totalAmount)}
        </p>
      </div>

      {/* Archivos para descargar */}
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Tus archivos
        </h4>

        {(order.productIds || []).map((productId) => {
          const product = products[productId];
          if (!product) return null;

          return (
            <div key={productId} style={styles.productRow}>
              {/* Imagen + nombre */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                {product.previewImageURL && (
                  <img src={product.previewImageURL} alt={product.name}
                    style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                )}
                <div>
                  <p style={{ margin: 0, fontWeight: '700', color: '#f1f5f9' }}>{product.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#555' }}>
                    {product.models?.length === 1 ? '1 modelo' : `${product.models?.length} modelos`}
                  </p>
                </div>
              </div>

              {/* Botones de descarga */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(product.models || []).map((model, i) => {
                  const stlUrls = model.stlURLs || (model.stlURL ? [model.stlURL] : []);
                  const glbUrl = model.glbURL || null;
                  const label = product.models.length > 1 ? (model.name || `Modelo ${i + 1}`) : null;

                  return (
                    <div key={i}>
                      {label && (
                        <p style={{ margin: '0 0 0.3rem', fontSize: '0.7rem', color: '#444', fontWeight: '700', textTransform: 'uppercase' }}>
                          {label}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {glbUrl && (() => {
                          const key = `${productId}-${i}-glb`;
                          const loading = downloadingId === key;
                          return (
                            <button key="glb" onClick={() => handleDownload(glbUrl, `${product.name}-${i + 1}.glb`, key)}
                              disabled={loading} style={loading ? styles.btnDownloadLoading : styles.btnDownloadRed}>
                              {loading ? <><LoadingOutlined /> Descargando...</> : <><DownloadOutlined /> GLB</>}
                            </button>
                          );
                        })()}
                        {stlUrls.map((url, j) => {
                          const key = `${productId}-${i}-stl-${j}`;
                          const loading = downloadingId === key;
                          const suffix = stlUrls.length > 1 ? ` ${j + 1}` : '';
                          return (
                            <button key={key} onClick={() => handleDownload(url, `${product.name}-${i + 1}.stl`, key)}
                              disabled={loading} style={loading ? styles.btnDownloadLoading : styles.btnDownloadGreen}>
                              {loading ? <><LoadingOutlined /> Descargando...</> : <><DownloadOutlined /> STL{suffix}</>}
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

      {/* Acción al perfil */}
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#555', marginTop: '1.5rem' }}>
        También podés descargar tus archivos en cualquier momento desde tu perfil.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
        <button className="button button-muted" onClick={() => history.push(ACCOUNT)} style={{ marginRight: '1rem' }}>
          <UserOutlined /> &nbsp; Mis archivos
        </button>
        <button className="button" onClick={() => history.push('/')}>
          Seguir comprando
        </button>
      </div>
    </div>
  );
};

// ── Estilos ────────────────────────────────────────────────────────────────────
const styles = {
  page: { maxWidth: 600, margin: '4rem auto', padding: '0 1.5rem' },
  center: {
    minHeight: '60vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '1rem',
    textAlign: 'center', padding: '2rem'
  },
  title: { margin: 0, color: '#f1f5f9' },
  sub: { margin: 0, color: '#64748b', maxWidth: 360 },
  btn: { marginTop: '0.5rem' },
  header: {
    textAlign: 'center', padding: '2rem',
    borderBottom: '1px solid #1e1e1e', marginBottom: '1.5rem'
  },
  card: {
    backgroundColor: '#161616', border: '1px solid #252525',
    borderRadius: 12, padding: '1.5rem'
  },
  productRow: {
    backgroundColor: '#0f0f0f', border: '1px solid #1e1e1e',
    borderRadius: 8, padding: '1rem', marginBottom: '0.75rem'
  },
  btnDownloadRed: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.45rem 0.9rem', fontSize: '0.78rem', fontWeight: '600',
    backgroundColor: 'rgba(255,36,66,0.08)', color: '#ff6680',
    border: '1px solid rgba(255,36,66,0.25)', borderRadius: 7, cursor: 'pointer'
  },
  btnDownloadGreen: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.45rem 0.9rem', fontSize: '0.78rem', fontWeight: '600',
    backgroundColor: 'rgba(52,211,153,0.08)', color: '#34d399',
    border: '1px solid rgba(52,211,153,0.25)', borderRadius: 7, cursor: 'pointer'
  },
  btnDownloadLoading: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.45rem 0.9rem', fontSize: '0.78rem', fontWeight: '600',
    backgroundColor: '#1a1a1a', color: '#444',
    border: '1px solid #252525', borderRadius: 7, cursor: 'not-allowed'
  },
};

export default CheckoutSuccess;
