import { ADMIN_PRODUCTS, ADMIN_USERS, ADMIN_BANNER } from '@/constants/routes';
import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidePanel = () => (
  <aside className="sidenavigation">
    <div className="sidenavigation-wrapper">
      <div className="sidenavigation-item">
        <NavLink
          activeClassName="sidenavigation-menu-active"
          className="sidenavigation-menu"
          to={ADMIN_PRODUCTS}
        >
          Products
        </NavLink>
      </div>
      <div className="sidenavigation-item">
        <NavLink
          activeClassName="sidenavigation-menu-active"
          className="sidenavigation-menu"
          to={ADMIN_USERS}
        >
          Users
        </NavLink>
      </div>
      <div className="sidenavigation-item">
        <NavLink
          activeClassName="sidenavigation-menu-active"
          className="sidenavigation-menu"
          to={ADMIN_BANNER}
        >
          Banner Settings
        </NavLink>
      </div>
    </div>
  </aside>
);

export default AdminSidePanel;