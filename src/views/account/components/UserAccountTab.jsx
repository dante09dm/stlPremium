/* eslint-disable indent */
import { ImageLoader } from '@/components/common';
import { ACCOUNT_EDIT } from '@/constants/routes';
import { displayDate } from '@/helpers/utils';
import PropType from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import { withRouter } from 'react-router-dom';

const UserProfile = (props) => {
  const profile = useSelector((state) => state.profile);

  return (
    <div className="user-profile">
      <div className="user-profile-block">
        <div className="user-profile-banner">
          <div className="user-profile-banner-wrapper">
            <ImageLoader
              alt="Banner"
              className="user-profile-banner-img"
              src={profile.banner}
            />
          </div>
          <div className="user-profile-avatar-wrapper">
            {profile.avatar && profile.avatar.startsWith('http') ? (
              <img
                alt="Avatar"
                className="user-profile-img"
                src={profile.avatar}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div style={{
              display: (profile.avatar && profile.avatar.startsWith('http')) ? 'none' : 'flex',
              width: '100%', height: '100%', borderRadius: '50%',
              alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #ff2442, #ff5566)',
              color: '#fff', fontWeight: 700, fontSize: '2.4rem',
            }}>
              {profile.fullname ? profile.fullname[0].toUpperCase() : '?'}
            </div>
          </div>
          <button
            className="button button-small user-profile-edit"
            onClick={() => props.history.push(ACCOUNT_EDIT)}
            type="button"
          >
            Editar Cuenta
          </button>
        </div>
        <div className="user-profile-details">
          <h2 className="user-profile-name">{profile.fullname}</h2>
          <span>Email</span>
          <br />
          <h5>{profile.email}</h5>
          <span>Dirección</span>
          <br />
          {profile.address ? (
            <h5>{profile.address}</h5>
          ) : (
            <h5 className="text-subtle text-italic">Address not set</h5>
          )}
          <span>Celular</span>
          <br />
          {profile.mobile ? (
            <h5>{profile.mobile.value}</h5>
          ) : (
            <h5 className="text-subtle text-italic">Mobile not set</h5>
          )}
          <span>Fecha de Registro</span>
          <br />
          {profile.dateJoined ? (
            <h5>{displayDate(profile.dateJoined)}</h5>
          ) : (
            <h5 className="text-subtle text-italic">Not available</h5>
          )}
        </div>
      </div>
    </div>
  );
};

UserProfile.propTypes = {
  history: PropType.shape({
    push: PropType.func
  }).isRequired
};

export default withRouter(UserProfile);
