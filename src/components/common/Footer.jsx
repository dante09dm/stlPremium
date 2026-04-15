import * as Route from '@/constants/routes';
import logo from '@/images/logo-full.png';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { FaInstagram, FaFacebook, FaWhatsapp } from 'react-icons/fa'; // Agregado FaWhatsapp

const Footer = () => {
  const { pathname } = useLocation();

  const visibleOnlyPath = [
    Route.HOME,
    Route.SHOP
  ];

  return !visibleOnlyPath.includes(pathname) ? null : (
    <footer className="footer">
      <div className="footer-col-1">
        <strong>
          <span>
            Developed by
            {' '}
            <a>DM</a>
          </span>
        </strong>
      </div>
      <div className="footer-col-2">
        <img alt="Footer logo" className="footer-logo" src={logo} />
        <h5>
          &copy;&nbsp;
          {new Date().getFullYear()}
        </h5>
      </div>
      <div className="footer-col-3" style={{ textAlign: 'right' }}>
        <a 
          href="https://www.facebook.com/profile.php?id=61575033034023"
          target="_blank" 
          rel="noopener noreferrer"
          style={{ display: 'inline-block', marginRight: '20px' }}
        >
          <FaFacebook 
            style={{ 
              fontSize: '60px',
              color: '#3b5998',
              width: '60px', 
              height: '60px' 
            }} 
          />
        </a>
        <a 
          href="https://www.instagram.com/bodnes.tienda/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ display: 'inline-block', marginRight: '20px' }}
        >
          <FaInstagram 
            style={{ 
              fontSize: '60px',
              color: '#E4405F', 
              width: '60px', 
              height: '60px' 
            }} 
          />
        </a>
        <a 
          href="https://wa.me/+5492323641481" // Reemplaza con tu número de WhatsApp
          target="_blank" 
          rel="noopener noreferrer"
          style={{ display: 'inline-block' }}
        >
          <FaWhatsapp 
            style={{ 
              fontSize: '60px',
              color: '#25D366', // Color verde de WhatsApp
              width: '60px', 
              height: '60px' 
            }} 
          />
        </a>
      </div>
    </footer>
  );
};

export default Footer;


