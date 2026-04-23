import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Check, X } from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import styles from './Admin.module.css';

const AdsManager = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        try {
            const res = await api.get('/admin/ads?status=pending');
            if (res.data.success) {
                setAds(res.data.ads.data);
            }
        } catch (error) {
            toast.error("Failed to load pending ads");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (adId, action) => {
        if (action === 'reject') {
            const reason = window.prompt("Reason for rejection:");
            if (!reason) return;
            
            try {
                await api.post(`/admin/ads/${adId}/reject`, { reason });
                toast.success("Ad rejected");
                fetchAds();
            } catch (e) {
                toast.error("Action failed");
            }
        } else {
            try {
                await api.post(`/admin/ads/${adId}/approve`);
                toast.success("Ad approved");
                fetchAds();
            } catch (e) {
                toast.error("Action failed");
            }
        }
    };

    if (loading) return <Loader />;

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Pending Ad Approvals</h1>
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Ad</th>
                            <th>Seller</th>
                            <th>Price</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ads.map(ad => (
                            <tr key={ad.id}>
                                <td>
                                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                                        <img src={ad.primary_image || 'https://via.placeholder.com/40'} alt="ad" style={{width:40, height:40, borderRadius:4, objectFit:'cover'}}/>
                                        <a href={`/ads/${ad.id}`} target="_blank" rel="noreferrer" style={{color:'var(--primary)', fontWeight:600}}>{ad.title}</a>
                                    </div>
                                </td>
                                <td>{ad.seller_name}</td>
                                <td>${ad.price}</td>
                                <td>{new Date(ad.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div className={styles.btnGroup}>
                                        <button className={`${styles.actionBtn} ${styles.approve}`} onClick={() => handleAction(ad.id, 'approve')}>
                                            <Check size={14}/> Approve
                                        </button>
                                        <button className={`${styles.actionBtn} ${styles.reject}`} onClick={() => handleAction(ad.id, 'reject')}>
                                            <X size={14}/> Reject
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {ads.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{textAlign: 'center', padding: '24px'}}>No pending ads at the moment.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdsManager;
