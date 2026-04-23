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
                                <td><span className={`badge ${report.status === 'open' ? 'rejected' : 'active'}`}>{report.status}</span></td>
                                <td>
                                    {report.status === 'open' && (
                                        <button className={`${styles.actionBtn} ${styles.approve}`} onClick={() => handleResolve(report.id)}>
                                            Mark Resolved
                                        </button>
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
