/* eslint-disable indent */
import {
  DownOutlined, LoadingOutlined, LogoutOutlined, UserOutlined
} from '@ant-design/icons';
import { ACCOUNT } from '@/constants/routes';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { signOut } from '@/redux/actions/authActions';

const UserNav = () => {
  const { profile, isAuthenticating } = useSelector((state) => ({
    profile: state.profile,
    isAuthenticating: state.app.isAuthenticating
  }));
  const userNav = useRef(null);
  const dispatch = useDispatch();

  const toggleDropdown = (e) => {
    const closest = e.target.closest('div.user-nav');

    try {
      if (!closest && userNav.current.classList.contains('user-sub-open')) {
        userNav.current.classList.remove('user-sub-open');
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    document.addEventListener('click', toggleDropdown);

    return () => document.removeEventListener('click', toggleDropdown);
  }, []);

  const onClickNav = () => {
    userNav.current.classList.toggle('user-sub-open');
  };

  return isAuthenticating ? (
    <div className="user-nav">
      <span>Signing Out</span>
      &nbsp;
      <LoadingOutlined />
    </div>
  ) : (
    <div
      className="user-nav"
      onClick={onClickNav}
      onKeyDown={() => { }}
      ref={userNav}
      role="button"
      tabIndex={0}
    >
      <h5 className="text-overflow-ellipsis">{profile.fullname && profile.fullname.split(' ')[0]}</h5>
      <div className="user-nav-img-wrapper">
        {profile.avatar && profile.avatar.startsWith('http') ? (
          <img
            alt=""
            className="user-nav-img"
            src={profile.avatar}
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div
          className="user-nav-img user-nav-img--initials"
          style={{
            display: (profile.avatar && profile.avatar.startsWith('http')) ? 'none' : 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #ff2442, #ff5566)',
            color: '#fff', fontWeight: 700, fontSize: '1.4rem',
            borderRadius: '50%', width: '100%', height: '100%',
          }}
        >
          {profile.fullname ? profile.fullname[0].toUpperCase() : '?'}
        </div>
      </div>
      <DownOutlined style={{ fontSize: '1.2rem', marginLeft: '1rem' }} />
      <div className="user-nav-sub">
        {profile.role !== 'ADMIN' && (
          <Link
            to={ACCOUNT}
            className="user-nav-sub-link"
          >
            Ver Perfil
            <UserOutlined />
          </Link>
        )}
        <h6
          className="user-nav-sub-link margin-0 d-flex"
          onClick={() => dispatch(signOut())}
          role="presentation"
        >
          Cerrar sesión
          <LogoutOutlined />
        </h6>
      </div>
    </div>
  );
};

UserNav.propType = {
  profile: PropTypes.object.isRequired
};

export default withRouter(UserNav);
