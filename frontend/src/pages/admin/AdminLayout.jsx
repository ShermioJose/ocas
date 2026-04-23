import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Grid, Flag } from 'lucide-react';
import styles from './Admin.module.css';

const AdminLayout = () => {
    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarTitle}>Admin Console</div>
                <nav>
                    <NavLink to="/admin" end className={({isActive}) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </NavLink>
                    <NavLink to="/admin/ads" className={({isActive}) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}>
                        <Grid size={20} /> Ad Approvals
                    </NavLink>
                    <NavLink to="/admin/users" className={({isActive}) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}>
                        <Users size={20} /> Users
                    </NavLink>
                    <NavLink to="/admin/reports" className={({isActive}) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}>
                        <Flag size={20} /> Reports
                    </NavLink>
                </nav>
            </aside>
            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
