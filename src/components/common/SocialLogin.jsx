import { GoogleOutlined } from '@ant-design/icons';
import PropType from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import { signInWithGoogle } from '@/redux/actions/authActions';

const SocialLogin = ({ isLoading }) => {
  const dispatch = useDispatch();

  const onSignInWithGoogle = () => {
    dispatch(signInWithGoogle());
  };

  return (
    <div className="auth-provider">
      <button
        className="button auth-provider-button provider-google"
        disabled={isLoading}
        onClick={onSignInWithGoogle}
        type="button"
      >
        <GoogleOutlined />
        Continuar con Google
      </button>
    </div>
  );
  
};

SocialLogin.propTypes = {
  isLoading: PropType.bool.isRequired
};

export default SocialLogin;
