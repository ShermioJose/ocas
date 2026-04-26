import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Heart, Flag, Eye, Calendar, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import styles from './AdDetail.module.css';

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const AdDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toggle, isWishlisted } = useWishlist();
    
    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [creatingChat, setCreatingChat] = useState(false);

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const res = await api.get(`/ads/${id}`);
                if (res.data.success) {
                    setAd(res.data.ad);
                }
            } catch (error) {
                toast.error("Ad not found");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchAd();
    }, [id, navigate]);

    const handleChatClick = async () => {
        if (!user) {
            toast.info("Please login to chat with the seller");
            navigate('/login');
            return;
        }

        if (user.id === ad.seller.id) {
            toast.error("You cannot chat with yourself");
            return;
        }

        setCreatingChat(true);
        try {
            const res = await api.post('/conversations', { ad_id: ad.id });
            if (res.data.success) {
                navigate('/messages', { state: { conversationId: res.data.conversation.id } });
            }
        } catch (e) {
            toast.error(e.response?.data?.message || "Could not start conversation");
        } finally {
            setCreatingChat(false);
        }
    };

    const handleReport = async () => {
        if (!user) {
            toast.info("Please login to report an ad");
            navigate('/login');
            return;
        }
        
        const reason = window.prompt("Reason for reporting this ad:");
        if (!reason || reason.trim() === '') return;

        try {
            await api.post(`/ads/${ad.id}/report`, { reason });
            toast.success("Ad reported successfully to OCAS team");
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to report ad");
        }
    };

    if (loading) return <Loader fullScreen />;
    if (!ad) return <EmptyState message="Ad not found" />;

    const wishlisted = isWishlisted(ad.id);

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.grid}>
                {/* Left Column: Images & Description */}
                <div className={styles.mainCol}>
                    <div className={styles.galleryCard}>
                        <div className={styles.mainImageContainer}>
                            {ad?.images?.length > 0 ? (
                                <img 
                                    src={ad?.images?.[activeImageIndex]?.image_url} 
                                    alt={ad?.title} 
                                    className={styles.mainImage}
                                />
                            ) : (
                                <div className={styles.noImage}>No images available</div>
                            )}
                        </div>
                        
                        {ad.images && ad.images.length > 1 && (
                            <div className={styles.thumbnailStrip}>
                                {ad.images.map((img, idx) => (
                                    <div 
                                        key={img.id} 
                                        className={`${styles.thumbnail} ${activeImageIndex === idx ? styles.activeThumb : ''}`}
                                        onClick={() => setActiveImageIndex(idx)}
                                    >
                                        <img src={img.image_url} alt="" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.detailsCard}>
                        <h2>Description</h2>
                        <div className={styles.description}>
                            {(ad?.description || '').split('\n').map((para, i) => (
                                <p key={i}>{para}</p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Price & Seller */}
                <div className={styles.sideCol}>
                    <div className={styles.priceCard}>
                        <div className={styles.priceHeader}>
                            <h1 className={styles.price}>${parseFloat(ad.price).toLocaleString()}</h1>
                            <button 
                                className={styles.iconBtn}
                                onClick={() => toggle(ad.id)}
                            >
                                <Heart fill={wishlisted ? 'var(--danger)' : 'none'} color={wishlisted ? 'var(--danger)' : 'var(--text)'} size={28} />
                            </button>
                        </div>
                        <h2 className={styles.title}>{ad.title}</h2>
                        
                        <div className={styles.metaRow}>
                            <div className={styles.metaItem}>
                                <MapPin size={16} /> <span>{ad.location}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <Calendar size={16} /> <span>{formatDate(ad?.created_at)}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <Eye size={16} /> <span>{ad.views_count} views</span>
                            </div>
                        </div>

                        <div className={styles.specsRow}>
                            <span className={styles.specLabel}>Condition</span>
                            <span className={styles.specValue}>{ad.condition}</span>
                        </div>
                    </div>

                    <div className={styles.sellerCard}>
                        <h3>Seller Information</h3>
                        <div className={styles.sellerHeader}>
                            <img src={ad?.seller?.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e2e8f0'/%3E%3Ctext x='20' y='25' text-anchor='middle' font-size='16' fill='%2394a3b8'%3E%3F%3C/text%3E%3C/svg%3E"} alt={ad?.seller?.name} className={styles.avatar} />
                            <div>
                                <h4 className={styles.sellerName}>{ad?.seller?.name}</h4>
                                <p className={styles.memberSince}>Member since {formatDate(ad?.seller?.member_since)}</p>
                            </div>
                        </div>
                        <div className={styles.sellerStats}>
                            <div className={styles.stat}>
                                <strong>{ad.seller.total_ads}</strong>
                                <span>Ads on OCAS</span>
                            </div>
                            <div className={styles.stat}>
                                <strong>{ad.seller.city || 'Unknown'}</strong>
                                <span>Location</span>
                            </div>
                        </div>
                        
                        <button 
                            className={styles.chatBtn} 
                            onClick={handleChatClick}
                            disabled={creatingChat || user?.id === ad.seller.id}
                        >
                            {creatingChat ? <div className="spinner"></div> : (
                                <>
                                    <MessageSquare size={20} />
                                    Chat with Seller
                                </>
                            )}
                        </button>

                        <div className={styles.sellerFooterLinks}>
                            <Link to={`/user/${ad.seller.id}`}>View Profile</Link>
                            {user?.id !== ad.seller.id && (
                                <button className={styles.reportBtn} onClick={handleReport}>
                                    <Flag size={14} /> Report ad
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdDetail;
