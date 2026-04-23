import React, { useState, useEffect } from 'react';
import { X, HeartOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useWishlist } from '../context/WishlistContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import styles from './Wishlist.module.css';

const Wishlist = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toggle } = useWishlist();

    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const res = await api.get('/wishlist');
                if (res.data.success) {
                    setAds(res.data.wishlist);
                }
            } catch (error) {
                console.error("Failed to fetch wishlist");
            } finally {
                setLoading(false);
            }
        };
        fetchWishlist();
    }, []);

    const handleRemove = async (e, adId) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Optimistic UI
        setAds(prev => prev.filter(ad => ad.id !== adId));
        await toggle(adId); // Let context handle exact deletion call
    };

    if (loading) return <Loader fullScreen />;

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <h1 className={styles.title}>Saved Ads</h1>
            
            {ads.length === 0 ? (
                <EmptyState 
                    icon={HeartOff}
                    message="No saved ads yet. Start exploring OCAS!"
                    actionLabel="Browse Ads"
                    actionLink="/search"
                />
            ) : (
                <div className={styles.grid}>
                    {ads.map(ad => (
                        <Link to={`/ads/${ad.id}`} key={ad.id} className={styles.card}>
                            <div className={styles.imageContainer}>
                                <img src={ad.primary_image || 'https://via.placeholder.com/300x200'} alt={ad.title} />
                                <button className={styles.removeBtn} onClick={(e) => handleRemove(e, ad.id)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className={styles.content}>
                                <h3 className={styles.price}>${parseFloat(ad.price).toLocaleString()}</h3>
                                <p className={styles.adTitle}>{ad.title}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
