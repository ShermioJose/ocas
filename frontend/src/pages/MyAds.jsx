import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit3, Trash2, CheckCircle, Clock, XCircle, LayoutGrid } from 'lucide-react';

import { toast } from 'react-toastify';
import api from '../api/axios';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import styles from './MyAds.module.css';
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const MyAds = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAds = async () => {
        try {
            const res = await api.get('/my-ads');
            if (res.data.success) {
                setAds(res.data.ads.data);
            }
        } catch (error) {
            toast.error("Failed to load your ads");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    const markAsSold = async (id) => {
        try {
            await api.post(`/ads/${id}/sold`);
            toast.success("Ad marked as sold");
            fetchAds();
        } catch (e) {
            toast.error("Failed to update status");
        }
    };

    const deleteAd = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this ad?")) return;
        try {
            await api.delete(`/ads/${id}`);
            toast.success("Ad deleted successfully");
            fetchAds();
        } catch (e) {
            toast.error("Failed to delete ad");
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'active': return <span className="badge active"><CheckCircle size={12}/> Active</span>;
            case 'pending': return <span className="badge pending"><Clock size={12}/> Pending Review</span>;
            case 'sold': return <span className="badge sold">Sold</span>;
            case 'rejected': return <span className="badge rejected"><XCircle size={12}/> Rejected</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    if (loading) return <Loader fullScreen />;

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Ads</h1>
                <Link to="/post-ad" className={styles.postBtn}>Post New Ad</Link>
            </div>

            {ads.length === 0 ? (
                <EmptyState 
                    icon={LayoutGrid}
                    message="You haven't posted any ads yet."
                    actionLabel="Sell on OCAS"
                    actionLink="/post-ad"
                />
            ) : (
                <div className={styles.list}>
                    {ads.map(ad => (
                        <div key={ad.id} className={styles.adCard}>
                            <div className={styles.imageWrap}>
                                <img src={ad.primary_image || 'https://via.placeholder.com/200x150?text=No+Image'} alt={ad.title} />
                            </div>
                            <div className={styles.content}>
                                <div className={styles.mainInfo}>
                                    <div>
                                        <h3 className={styles.adTitle}><Link to={`/ads/${ad.id}`}>{ad.title}</Link></h3>
                                        <p className={styles.adPrice}>${parseFloat(ad.price).toLocaleString()}</p>
                                    </div>
                                    <div className={styles.badgeWrap}>
                                        {getStatusBadge(ad.status)}
                                    </div>
                                </div>
                                <div className={styles.meta}>
                                    <span><Eye size={14}/> {ad.views_count} Views</span>
                                    <span>{ad.images_count} Images</span>
                                    <span>Posted {formatDate(ad?.created_at)}</span>
                                </div>
                            </div>
                            <div className={styles.actions}>
                                {ad.status !== 'sold' && ad.status !== 'rejected' && (
                                    <>
                                        <Link to={`/edit-ad/${ad.id}`} className={styles.actionBtn}>
                                            <Edit3 size={16} /> Edit
                                        </Link>
                                        <button className={styles.actionBtn} onClick={() => markAsSold(ad.id)}>
                                            Mark as Sold
                                        </button>
                                    </>
                                )}
                                <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={() => deleteAd(ad.id)}>
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyAds;
