import React, { useState, useEffect } from 'react';
import { Users, Grid, CheckCircle, Flag } from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import styles from './Admin.module.css';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/dashboard');
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (error) {
                console.error("Failed to load admin stats");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <Loader />;

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Dashboard Overview</h1>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{background: '#e0f2fe', color: '#0284c7'}}>
                        <Users size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <h3>{stats?.total_users || 0}</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{background: '#dcfce7', color: '#166534'}}>
                        <Grid size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <h3>{stats?.total_ads || 0}</h3>
                        <p>Total Ads</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{background: '#fef3c7', color: '#d97706'}}>
                        <CheckCircle size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <h3>{stats?.pending_ads || 0}</h3>
                        <p>Pending Approvals</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{background: '#fee2e2', color: '#991b1b'}}>
                        <Flag size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <h3>{stats?.total_reports || 0}</h3>
                        <p>Open Reports</p>
                    </div>
                </div>
            </div>
            
            <div style={{background: 'white', padding: 24, borderRadius: 8, border: '1px solid var(--border)'}}>
                <h3>Welcome to the OCAS Admin Console</h3>
                <p style={{color: 'var(--text-light)', marginTop: 8}}>Use the sidebar navigation to manage ads, users, and platform integrity.</p>
            </div>
        </div>
    );
};

export default Dashboard;
