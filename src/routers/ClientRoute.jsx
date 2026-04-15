/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-nested-ternary */
import { ADMIN_DASHBOARD, SIGNIN } from '@/constants/routes';
import PropType from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route } from 'react-router-dom';

const PrivateRoute = ({
  isAuth, role, component: Component, allowUnauthenticated, ...rest
}) => (
  <Route
    {...rest}
    component={(props) => {
      // Permitir acceso si allowUnauthenticated es true
      if (allowUnauthenticated) {
        return (
          <main className="content">
            <Component {...props} />
          </main>
        );
      }

      // Verificar autenticación y roles
      if (isAuth && role === 'USER') {
        return (
          <main className="content">
            <Component {...props} />
          </main>
        );
      }

      if (isAuth && role === 'ADMIN') {
        return <Redirect to={ADMIN_DASHBOARD} />;
      }

      // Redirigir a SIGNIN si no está autenticado y allowUnauthenticated es false
      return (
        <Redirect to={{
          pathname: SIGNIN,
          state: { from: props.location }
        }}
        />
      );
    }}
  />
);

PrivateRoute.defaultProps = {
  isAuth: false,
  role: 'USER',
  allowUnauthenticated: false // Nueva prop
};

PrivateRoute.propTypes = {
  isAuth: PropType.bool,
  role: PropType.string,
  component: PropType.func.isRequired,
  allowUnauthenticated: PropType.bool, // Nueva prop
  rest: PropType.any
};

const mapStateToProps = ({ auth }) => ({
  isAuth: !!auth,
  role: auth?.role || ''
});

export default connect(mapStateToProps)(PrivateRoute);
