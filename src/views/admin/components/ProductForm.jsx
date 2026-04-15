import React, { useState } from 'react';
import { Check, Trash2, File, Loader, Plus, Package, Upload } from 'lucide-react';
import { FILAMENT_COLORS } from '@/components/common/ModelViewer';

// ─── Estilos base ─────────────────────────────────────────────────────────────
const labelStyle   = { display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.875rem' };
const inputStyle   = { width: '100%', padding: '0.75rem', border: '1px solid #252525', borderRadius: '8px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#1e1e1e', color: '#f1f5f9' };
const errorStyle   = { display: 'block', marginTop: '0.25rem', color: '#ff2442', fontSize: '0.75rem' };
const deleteBtnSt  = { padding: '0.35rem', backgroundColor: 'rgba(255,36,66,0.12)', color: '#ff2442', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' };

const fmt = (bytes) => {
  if (!bytes) return '';
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Zona de upload PNG (imagen de portada del producto) ─────────────────────
const PNGUpload = ({ fileObject, fileName, url, onFile, onRemove, isLoading }) => {
  const has = fileName || url;
  const preview = fileObject ? URL.createObjectURL(fileObject) : url;
  return (
    <div>
      <label style={{ ...labelStyle, color: '#a78bfa' }}>* Imagen de portada (PNG/JPG)</label>
      <div style={{ border: has ? '1px solid rgba(167,139,250,0.3)' : '2px dashed #333', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#0f0f0f', transition: 'all 0.2s' }}>
        {!has ? (
          <label htmlFor="product-png" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '0.4rem', padding: '1.5rem' }}>
            <input id="product-png" type="file" accept="image/png,image/jpeg,image/webp"
              onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }}
              disabled={isLoading} style={{ display: 'none' }} />
            <Upload size={22} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: '600' }}>Subir PNG / JPG · collage de modelos</span>
            <span style={{ fontSize: '0.72rem', color: '#444' }}>Se muestra en la card del producto · máx 10 MB</span>
          </label>
        ) : (
          <div style={{ position: 'relative' }}>
            <img src={preview} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: '0.4rem' }}>
              <label htmlFor="product-png-replace" style={{ ...deleteBtnSt, backgroundColor: 'rgba(167,139,250,0.15)', color: '#a78bfa', cursor: 'pointer', padding: '0.45rem' }}>
                <input id="product-png-replace" type="file" accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }}
                  disabled={isLoading} style={{ display: 'none' }} />
                <Upload size={13} />
              </label>
              <button type="button" onClick={onRemove} disabled={isLoading} style={{ ...deleteBtnSt, padding: '0.45rem' }}><Trash2 size={13} /></button>
            </div>
            {fileName && <p style={{ margin: 0, padding: '0.4rem 0.7rem', fontSize: '0.72rem', color: '#555', backgroundColor: '#0a0a0a' }}>{fileName}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Zona de upload GLB (única por modelo) ────────────────────────────────────
const GLBUpload = ({ id, model, onFile, onRemove, isLoading }) => {
  const has = model.glbFileName || model.glbURL;
  return (
    <div>
      <label style={{ ...labelStyle, color: '#ff2442' }}>* GLB — visor 3D</label>
      <div style={{ border: has ? '1px solid rgba(255,36,66,0.3)' : '2px dashed #333', borderRadius: '8px', padding: '0.85rem', backgroundColor: '#0f0f0f', transition: 'all 0.2s' }}>
        {!has ? (
          <label htmlFor={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '0.3rem' }}>
            <input id={id} type="file" accept=".glb" onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }} disabled={isLoading} style={{ display: 'none' }} />
            <Upload size={20} style={{ color: '#ff2442' }} />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Subir .glb · máx 150 MB</span>
          </label>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <File size={14} style={{ color: '#ff2442', flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600', color: '#ff2442' }}>{model.glbFileName || 'archivo.glb'}</p>
                {model.glbFileObject && <p style={{ margin: 0, fontSize: '0.68rem', color: '#555' }}>{fmt(model.glbFileObject.size)}</p>}
              </div>
            </div>
            <button type="button" onClick={onRemove} disabled={isLoading} style={deleteBtnSt}><Trash2 size={13} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Lista de STL (múltiples partes) ─────────────────────────────────────────
const STLList = ({ modelIndex, parts, onChange, isLoading }) => {
  const addPart = () => onChange([...parts, { fileObject: null, fileName: null, url: null }]);

  const setFile = (i, file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.stl')) { alert('El archivo debe ser .stl'); return; }
    if (file.size > 150 * 1024 * 1024) { alert('El STL debe ser menor a 150 MB'); return; }
    onChange(parts.map((p, idx) => idx === i ? { ...p, fileObject: file, fileName: file.name } : p));
  };

  const removePart = (i) => {
    if (parts.length === 1) return; // mantener al menos uno
    onChange(parts.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{ ...labelStyle, color: '#34d399', marginBottom: 0 }}>* STL — descarga post-compra ({parts.length} parte{parts.length !== 1 ? 's' : ''})</label>
        <button type="button" onClick={addPart} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.7rem', backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
          <Plus size={12} /> Agregar parte
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {parts.map((part, i) => {
          const has = part.fileName || part.url;
          return (
            <div key={i} style={{ border: has ? '1px solid rgba(52,211,153,0.25)' : '2px dashed #2a2a2a', borderRadius: '7px', padding: '0.65rem 0.85rem', backgroundColor: '#0f0f0f' }}>
              {!has ? (
                <label htmlFor={`stl-${modelIndex}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input id={`stl-${modelIndex}-${i}`} type="file" accept=".stl" onChange={(e) => { setFile(i, e.target.files[0]); e.target.value = ''; }} disabled={isLoading} style={{ display: 'none' }} />
                  <Upload size={15} style={{ color: '#34d399' }} />
                  <span style={{ fontSize: '0.78rem', color: '#666' }}>Parte {i + 1} — subir .stl</span>
                </label>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <File size={13} style={{ color: '#34d399', flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '600', color: '#34d399' }}>{part.fileName || 'archivo.stl'}</p>
                      {part.fileObject && <p style={{ margin: 0, fontSize: '0.68rem', color: '#555' }}>{fmt(part.fileObject.size)} · parte {i + 1}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {/* Reemplazar */}
                    <label htmlFor={`stl-replace-${modelIndex}-${i}`} style={{ ...deleteBtnSt, backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399', cursor: 'pointer' }}>
                      <input id={`stl-replace-${modelIndex}-${i}`} type="file" accept=".stl" onChange={(e) => { setFile(i, e.target.files[0]); e.target.value = ''; }} disabled={isLoading} style={{ display: 'none' }} />
                      <Upload size={12} />
                    </label>
                    {parts.length > 1 && (
                      <button type="button" onClick={() => removePart(i)} disabled={isLoading} style={deleteBtnSt}><Trash2 size={12} /></button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Editor de un modelo ──────────────────────────────────────────────────────
const ModelEditor = ({ model, index, onChange, onRemove, isLoading, canRemove }) => (
  <div style={{ border: '1px solid #252525', borderRadius: '10px', padding: '1.25rem', backgroundColor: '#161616' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Package size={15} style={{ color: '#ff2442' }} />
        <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#94a3b8' }}>Modelo {index + 1}</span>
      </div>
      {canRemove && <button type="button" onClick={() => onRemove(index)} disabled={isLoading} style={deleteBtnSt}><Trash2 size={14} /></button>}
    </div>

    {/* Nombre */}
    <div style={{ marginBottom: '1rem' }}>
      <label style={labelStyle}>Nombre del modelo</label>
      <input type="text" value={model.name} onChange={(e) => onChange(index, { name: e.target.value })}
        disabled={isLoading} placeholder="Ej: Caballero Medieval" style={inputStyle} />
    </div>

    {/* GLB arriba, STL parts abajo */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <GLBUpload
        id={`glb-${index}`}
        model={model}
        onFile={(file) => {
          if (!file) return;
          if (!file.name.toLowerCase().endsWith('.glb')) { alert('El archivo debe ser .glb'); return; }
          if (file.size > 150 * 1024 * 1024) { alert('El GLB debe ser menor a 150 MB'); return; }
          onChange(index, { glbFileObject: file, glbFileName: file.name, glbURL: null });
        }}
        onRemove={() => onChange(index, { glbFileObject: null, glbFileName: null, glbURL: null })}
        isLoading={isLoading}
      />
      <STLList
        modelIndex={index}
        parts={model.stlParts}
        onChange={(newParts) => onChange(index, { stlParts: newParts })}
        isLoading={isLoading}
      />
    </div>
  </div>
);

// ─── ProductForm principal ────────────────────────────────────────────────────
const ProductForm = ({ product, onSubmit, isLoading }) => {
  const emptyPart  = () => ({ fileObject: null, fileName: null, url: null });
  const emptyModel = () => ({ name: '', stlParts: [emptyPart()], glbFileObject: null, glbFileName: null, glbURL: null });

  const initModels = () => {
    if (product?.models?.length > 0) {
      return product.models.map((m) => ({
        name: m.name || '',
        glbFileObject: null, glbFileName: null, glbURL: m.glbURL || null,
        stlParts: m.stlURLs?.length > 0
          ? m.stlURLs.map((url, i) => ({ fileObject: null, fileName: `parte_${i + 1}.stl`, url }))
          : [emptyPart()],
      }));
    }
    return [emptyModel()];
  };

  const [formData, setFormData] = useState({
    name: product?.name || '', category: product?.category || '',
    price: product?.price || 0, description: product?.description || '',
    isFeatured: product?.isFeatured || false, isRecommended: product?.isRecommended || false,
  });
  const [models, setModels]   = useState(initModels);
  const [errors, setErrors]   = useState({});
  const [previewImg, setPreviewImg] = useState({
    fileObject: null,
    fileName:   null,
    url:        product?.previewImageURL || null,
  });
  const [showColorPicker, setShowColorPicker]   = useState(false);
  const [selectedColorNames, setSelectedColorNames] = useState(
    product?.availableColors?.map((c) => c.name) || FILAMENT_COLORS.map((c) => c.name)
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleModelChange = (index, changes) =>
    setModels((prev) => prev.map((m, i) => (i === index ? { ...m, ...changes } : m)));

  const addModel    = () => setModels((prev) => [...prev, emptyModel()]);
  const removeModel = (index) => setModels((prev) => prev.filter((_, i) => i !== index));

  const toggleColor = (colorName) =>
    setSelectedColorNames((prev) =>
      prev.includes(colorName)
        ? prev.length > 1 ? prev.filter((n) => n !== colorName) : prev
        : [...prev, colorName]
    );

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim())        newErrors.name        = 'Nombre requerido';
    if (!formData.category.trim())    newErrors.category    = 'Categoría requerida';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Precio debe ser mayor a 0';
    if (!formData.description.trim()) newErrors.description = 'Descripción requerida';
    if (!previewImg.fileObject && !previewImg.url)
      newErrors.previewImg = 'Imagen de portada requerida';
    models.forEach((m, i) => {
      if (!m.glbFileObject && !m.glbURL)
        newErrors[`model_glb_${i}`] = `Modelo ${i + 1}: GLB requerido para el visor`;
      const hasAllSTL = m.stlParts.every((p) => p.fileObject || p.url);
      if (!hasAllSTL)
        newErrors[`model_stl_${i}`] = `Modelo ${i + 1}: completá todos los archivos STL`;
      if (m.stlParts.length === 0 || (!m.stlParts[0].fileObject && !m.stlParts[0].url))
        newErrors[`model_stl_empty_${i}`] = `Modelo ${i + 1}: al menos 1 STL es requerido`;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const availableColors = FILAMENT_COLORS.filter((c) => selectedColorNames.includes(c.name));
    onSubmit({
      ...formData,
      price: parseFloat(formData.price),
      models,
      availableColors,
      previewImg,                                        // { fileObject, fileName, url }
      dateAdded: product?.dateAdded || new Date().getTime(),
      id: product?.id || `product_${Date.now()}`,
    });
  };

  const modelErrors = Object.entries(errors).filter(([k]) => k.startsWith('model_'));

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', backgroundColor: '#0f0f0f', borderRadius: '12px', boxShadow: '0 2px 24px rgba(0,0,0,0.4)' }}>
      <h2 style={{ marginBottom: '0.25rem', color: '#f1f5f9' }}>
        {product?.id ? 'Editar Producto' : 'Nuevo Producto STL'}
      </h2>
      <p style={{ color: '#555', fontSize: '0.875rem', marginBottom: '2rem' }}>
        <span style={{ color: '#a78bfa' }}>PNG</span> portada de la card ·&nbsp;
        <span style={{ color: '#ff2442' }}>GLB</span> visor 3D al hacer hover ·&nbsp;
        <span style={{ color: '#34d399' }}>STL</span> descarga post-compra
      </p>

      <div style={{ display: 'grid', gap: '1.5rem' }}>

        {/* Imagen de portada PNG */}
        <PNGUpload
          fileObject={previewImg.fileObject}
          fileName={previewImg.fileName}
          url={previewImg.url}
          isLoading={isLoading}
          onFile={(file) => {
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) { alert('La imagen debe ser menor a 10 MB'); return; }
            setPreviewImg({ fileObject: file, fileName: file.name, url: null });
          }}
          onRemove={() => setPreviewImg({ fileObject: null, fileName: null, url: null })}
        />
        {errors.previewImg && <span style={errorStyle}>{errors.previewImg}</span>}

        {/* Nombre + Categoría */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>* Nombre del producto</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange}
              disabled={isLoading} placeholder="Ej: Bundle Miniaturas Medievales" style={inputStyle} />
            {errors.name && <span style={errorStyle}>{errors.name}</span>}
          </div>
          <div>
            <label style={labelStyle}>* Categoría</label>
            <select name="category" value={formData.category} onChange={handleInputChange}
              disabled={isLoading} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Seleccionar categoría</option>
              <option value="Figuras">Figuras</option>
              <option value="Miniaturas">Miniaturas</option>
              <option value="Decoración">Decoración</option>
              <option value="Utilidad">Utilidad</option>
              <option value="Juegos">Juegos</option>
              <option value="Arte">Arte</option>
              <option value="Arquitectura">Arquitectura</option>
            </select>
            {errors.category && <span style={errorStyle}>{errors.category}</span>}
          </div>
        </div>

        {/* Precio */}
        <div style={{ maxWidth: '260px' }}>
          <label style={labelStyle}>* Precio (USD)</label>
          <input type="number" name="price" value={formData.price} onChange={handleInputChange}
            disabled={isLoading} placeholder="0.00" step="0.01" min="0" style={inputStyle} />
          {errors.price && <span style={errorStyle}>{errors.price}</span>}
        </div>

        {/* Descripción */}
        <div>
          <label style={labelStyle}>* Descripción</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange}
            disabled={isLoading} rows={4}
            placeholder="Describe el bundle, cantidad de modelos, tamaño recomendado de impresión, material sugerido..."
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          {errors.description && <span style={errorStyle}>{errors.description}</span>}
        </div>

        {/* Opciones — toggles visuales */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            ['isFeatured',    'Producto destacado', '⭐'],
            ['isRecommended', 'Recomendado',         '👍'],
          ].map(([name, label, icon]) => {
            const active = formData[name];
            return (
              <button
                key={name}
                type="button"
                disabled={isLoading}
                onClick={() => setFormData((prev) => ({ ...prev, [name]: !prev[name] }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  border: active ? '1px solid rgba(255,36,66,0.5)' : '1px solid #303030',
                  backgroundColor: active ? 'rgba(255,36,66,0.12)' : '#161616',
                  color: active ? '#ff2442' : '#555',
                  fontSize: '0.85rem', fontWeight: active ? '700' : '500',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                  boxShadow: active ? '0 0 0 1px rgba(255,36,66,0.18)' : 'none',
                }}
              >
                <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>{icon}</span>
                {label}
                {active && (
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    backgroundColor: '#ff2442',
                    display: 'inline-block', marginLeft: '0.15rem',
                    boxShadow: '0 0 5px #ff2442',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Colores de filamento */}
        <div style={{ padding: '1.25rem', backgroundColor: '#161616', borderRadius: '10px', border: '1px solid #252525' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>Colores de filamento</h3>
              <p style={{ fontSize: '0.75rem', color: '#555', margin: '0.2rem 0 0' }}>
                {selectedColorNames.length === FILAMENT_COLORS.length ? 'Paleta completa (15 colores)' : `${selectedColorNames.length} seleccionados`}
              </p>
            </div>
            <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} style={{
              padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: '600',
              backgroundColor: showColorPicker ? '#ff2442' : '#252525', color: '#f1f5f9',
              border: '1px solid #333', borderRadius: '8px', cursor: 'pointer'
            }}>
              {showColorPicker ? 'Listo' : 'Personalizar'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: showColorPicker ? '8px' : '6px' }}>
            {FILAMENT_COLORS
              .filter((c) => showColorPicker || selectedColorNames.includes(c.name))
              .map((c) => (
                <button key={c.name} type="button" title={c.name}
                  onClick={() => showColorPicker && toggleColor(c.name)}
                  style={{
                    width: showColorPicker ? 32 : 24, height: showColorPicker ? 32 : 24,
                    borderRadius: '50%', backgroundColor: c.hex,
                    border: selectedColorNames.includes(c.name) ? '3px solid #ff2442' : '2px solid #333',
                    cursor: showColorPicker ? 'pointer' : 'default',
                    boxShadow: selectedColorNames.includes(c.name) ? '0 0 0 2px rgba(255,36,66,0.3)' : 'none',
                    opacity: showColorPicker && !selectedColorNames.includes(c.name) ? 0.3 : 1,
                    transition: 'all 0.15s',
                  }} />
              ))}
          </div>
        </div>

        {/* Modelos del bundle */}
        <div style={{ padding: '1.5rem', backgroundColor: '#161616', borderRadius: '10px', border: '2px solid #252525' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '0.2rem' }}>
                Modelos del bundle ({models.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#555' }}>
                Cada modelo tiene 1 GLB y uno o más STL
              </p>
            </div>
            <button type="button" onClick={addModel} disabled={isLoading} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', backgroundColor: '#ff2442', color: '#fff',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600'
            }}>
              <Plus size={16} /> Agregar modelo
            </button>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {models.map((model, i) => (
              <ModelEditor key={i} index={i} model={model} onChange={handleModelChange}
                onRemove={removeModel} isLoading={isLoading} canRemove={models.length > 1} />
            ))}
          </div>
          {modelErrors.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              {modelErrors.map(([key, msg]) => (
                <span key={key} style={{ ...errorStyle, display: 'block' }}>{msg}</span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={isLoading} style={{
          padding: '0.875rem 2rem', backgroundColor: isLoading ? '#333' : '#ff2442',
          color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          boxShadow: isLoading ? 'none' : '0 0 20px rgba(255,36,66,0.3)'
        }}>
          {isLoading
            ? <><Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</>
            : <><Check size={20} /> Guardar producto</>
          }
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ProductForm;
