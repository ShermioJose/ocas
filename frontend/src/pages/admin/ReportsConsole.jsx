import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import styles from './Admin.module.css';

const ReportsConsole = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get('/admin/reports');
            if (res.data.success) {
                setReports(res.data.reports.data);
            }
        } catch (error) {
            toast.error("Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        try {
            const res = await api.post(`/admin/reports/${id}/resolve`);
            if (res.data.success) {
                toast.success("Report resolved");
                fetchReports();
            }
        } catch (e) {
            toast.error("Failed to resolve report");
        }
    };

    const handleDeleteAd = async (adId) => {
        if (!window.confirm("Are you sure you want to delete this ad permanently?")) return;
        try {
            const res = await api.delete(`/admin/ads/${adId}`);
            if (res.data.success) {
                toast.success("Ad deleted permanently");
                fetchReports();
            }
        } catch (e) {
            toast.error("Failed to delete ad");
        }
    };

    const handleSuspendUser = async (userId) => {
        if (!window.confirm("Are you sure you want to suspend this user?")) return;
        try {
            const res = await api.post(`/admin/users/${userId}/suspend`);
            if (res.data.success) {
                toast.success("User suspended successfully");
                fetchReports();
            }
        } catch (e) {
            toast.error("Failed to suspend user");
        }
    };

    const handleDismiss = async (id) => {
        try {
            const res = await api.post(`/admin/reports/${id}/dismiss`);
            if (res.data.success) {
                toast.success("Report dismissed");
                fetchReports();
            }
        } catch (e) {
            toast.error("Failed to dismiss report");
        }
    };

    if (loading) return <Loader />;

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Ad Reports</h1>
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Ad & Link</th>
                            <th>Reported By</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map(report => (
                            <tr key={report.id}>
                                <td><a href={`/ads/${report.ad?.id}`} target="_blank" rel="noreferrer" style={{color:'var(--primary)', fontWeight:600}}>{report.ad?.title}</a></td>
                                <td>{report.reporter?.name}</td>
                                <td style={{maxWidth: '300px'}}>{report.reason}</td>
                                <td><span className={`badge ${report.status === 'pending' ? 'rejected' : 'active'}`}>{report.status}</span></td>
                                <td style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                                    {report.status === 'pending' && (
                                        <>
                                            <button className={`${styles.actionBtn} ${styles.approve}`} onClick={() => handleResolve(report.id)}>
                                                Mark Resolved
                                            </button>
                                            <button className={`${styles.actionBtn}`} style={{backgroundColor: '#9ca3af', color: '#fff'}} onClick={() => handleDismiss(report.id)}>
                                                Dismiss
                                            </button>
                                            {report.ad && (
                                                <button className={`${styles.actionBtn}`} style={{backgroundColor: '#ef4444', color: '#fff'}} onClick={() => handleDeleteAd(report.ad.id)}>
                                                    Delete Ad
                                                </button>
                                            )}
                                            {report.ad?.user_id && (
                                                <button className={`${styles.actionBtn}`} style={{backgroundColor: '#f97316', color: '#fff'}} onClick={() => handleSuspendUser(report.ad.user_id)}>
                                                    Suspend User
                                                </button>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{textAlign: 'center', padding: '24px'}}>No reports found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportsConsole;
