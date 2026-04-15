import { LoadingOutlined } from '@ant-design/icons';
import PropType from 'prop-types';
import React, { useState, useRef, useEffect } from 'react';

const ImageLoader = ({ src, alt, className }) => {
  const loadedImages = useRef({});
  const [loaded, setLoaded] = useState(!!loadedImages.current[src]);

  useEffect(() => {
    setLoaded(!!loadedImages.current[src]);
  }, [src]);

  const onLoad = () => {
    loadedImages.current[src] = true;
    setLoaded(true);
  };

  return (
    <>
      {!loaded && (
        <LoadingOutlined
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            margin: 'auto',
          }}
        />
      )}
      <img
        alt={alt || ''}
        className={`${className || ''} ${loaded ? 'is-img-loaded' : 'is-img-loading'}`}
        onLoad={onLoad}
        src={src}
      />
    </>
  );
};

ImageLoader.defaultProps = {
  className: 'image-loader',
};

ImageLoader.propTypes = {
  src: PropType.string.isRequired,
  alt: PropType.string,
  className: PropType.string,
};

export default ImageLoader;

