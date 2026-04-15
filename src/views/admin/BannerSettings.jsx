import React, { useState, useEffect } from 'react';
import firebaseInstance from "@/services/firebase";
import { useHistory } from 'react-router-dom';
import { ADMIN_PRODUCTS } from '@/constants/routes';

const BannerSettings = () => {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const fetchBannerSettings = async () => {
      try {
        const doc = await firebaseInstance.db.collection('bannerSettings').doc('current').get();
        if (doc.exists) {
          const data = doc.data();
          setImageUrl(data.imageUrl || '');
        }
      } catch (error) {
        console.error("Error loading banner settings:", error);
      }
    };
    fetchBannerSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let url = imageUrl;
      if (image) {
        const snapshot = await firebaseInstance.storage.ref(`banners/${image.name}`).put(image);
        url = await snapshot.ref.getDownloadURL();
        setImageUrl(url); // Actualizar la vista previa
      }
      
      await firebaseInstance.db.collection('bannerSettings').doc('current').update({
        imageUrl: url,
        updatedAt: new Date()
      });
      
      history.push(ADMIN_PRODUCTS);
    } catch (error) {
      console.error("Error updating banner image:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="banner-settings-container">
      <h2>Update Banner Image</h2>
      <form onSubmit={handleSubmit} className="banner-form">
        <div className="form-group">
          <label>New Banner Image</label>
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="form-control-file"
            accept="image/*"
            required
          />
          {imageUrl && (
            <div className="current-image mt-3">
              <p>Current Image Preview:</p>
              <img 
                src={imageUrl} 
                alt="Current Banner" 
                className="img-thumbnail" 
                style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }}
              />
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary mt-3" 
          disabled={loading || !image}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Uploading...
            </>
          ) : 'Update Banner Image'}
        </button>
      </form>
    </div>
  );
};

export default BannerSettings;