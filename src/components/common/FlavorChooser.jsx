import React, { useEffect, useState } from 'react';

const FlavorChooser = ({ initialFlavors = [], onFlavorsChange }) => {
  const [flavorInput, setFlavorInput] = useState('');
  const [flavors, setFlavors] = useState([]);

  useEffect(() => {
    if (Array.isArray(initialFlavors) && initialFlavors.length) {
      setFlavors(initialFlavors);
    }
  }, [initialFlavors]);

  const handleAddFlavor = () => {
    const trimmed = flavorInput.trim();
    if (trimmed && !flavors.includes(trimmed)) {
      const next = [...flavors, trimmed];
      setFlavors(next);
      onFlavorsChange(next);
      setFlavorInput('');
    }
  };

  const handleRemoveFlavor = (flavor) => {
    const next = flavors.filter(f => f !== flavor);
    setFlavors(next);
    onFlavorsChange(next);
  };

  return (
 <div style={{ maxWidth: '500px'}}>
  <div style={{
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '1rem',
    marginBottom: '2rem',
    background: '#f9f9f9'
  }}>
    <h3 style={{
      margin: 0,
      marginBottom: '1rem',
      fontSize: '1.1rem',
      color: '#000',
      fontWeight: '600'
    }}>
      Agregar talles
    </h3>

    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
      <input
        type="text"
        placeholder="Ej: M, L, XL"
        value={flavorInput}
        onChange={e => setFlavorInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAddFlavor()}
        style={{
          flex: 1,
          padding: '0.5rem 0.75rem',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
      <button
        type="button"
        onClick={handleAddFlavor}
        style={{
          backgroundColor: 'black',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '0.5rem 1rem',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.color = 'black';
          e.target.style.border = '1px solid black';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'black';
          e.target.style.color = 'white';
          e.target.style.border = 'none';
        }}
      >
        +
      </button>
    </div>

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {flavors.map((flavor, index) => (
        <div key={index} style={{
          background: '#eee',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          color: '#000'
        }}>
          <span>{flavor}</span>
          <button
            type="button"
            onClick={() => handleRemoveFlavor(flavor)}
            style={{
              background: 'none',
              border: 'none',
              color: 'red',
              fontWeight: 'bold',
              marginLeft: '0.5rem',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  </div>
</div>

  );
};

export default FlavorChooser;



