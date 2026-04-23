import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';

import { useWishlist } from '../context/WishlistContext';
import styles from './AdCard.module.css';
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const AdCard = ({ ad, inGrid = false }) => {
    const { toggle, isWishlisted } = useWishlist();
    const [imageLoaded, setImageLoaded] = useState(false);
    const wishlisted = isWishlisted(ad.id);
    const navigate = useNavigate();

    const handleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(ad.id);
    };

    const handleCardClick = () => {
        navigate(`/ads/${ad.id}`);
    };

    return (
        <div className={`${styles.card} ${inGrid ? styles.inGrid : ''}`} onClick={handleCardClick}>
            <div className={styles.imageContainer}>
                {!imageLoaded && <div className={`${styles.imageSkeleton} skeleton`}></div>}
                <img 
                    src={ad.primary_image || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    alt={ad.title} 
                    className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                />
                <button 
                    className={`${styles.wishlistBtn} ${wishlisted ? styles.active : ''}`}
                    onClick={handleWishlist}
                    aria-label="Add to Wishlist"
                >
                    <Heart fill={wishlisted ? 'var(--danger)' : 'none'} color={wishlisted ? 'var(--danger)' : 'white'} size={20} />
                </button>
            </div>
            <div className={styles.content}>
                <h3 className={styles.price}>${parseFloat(ad.price).toLocaleString()}</h3>
                <p className={styles.title}>{ad.title}</p>
                <div className={styles.meta}>
                    <span className={styles.location}>
                        <MapPin size={12} /> {ad.location}
                    </span>
                    <span className={styles.time}>
                        {formatDate(ad?.created_at)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AdCard;
