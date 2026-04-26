import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Calendar, LayoutGrid } from 'lucide-react';

import api from '../api/axios';
import AdGrid from '../components/AdGrid';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import styles from './PublicUser.module.css';
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const PublicUser = () => {
    const { id } = useParams();
    const [userProfile, setUserProfile] = useState(null);
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await api.get(`/users/${id}`);
                if (res.data.success) {
                    setUserProfile(res.data.user);
                    setAds(res.data.profile?.active_ads?.data || res.data.profile?.active_ads || []); // Endpoint handles filtering
                }
            } catch (error) {
                console.error("Failed to load user profile");
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [id]);

    if (loading) return <Loader fullScreen />;
    if (!userProfile) return null;

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                    <img 
                        src={userProfile.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e2e8f0'/%3E%3Ctext x='20' y='25' text-anchor='middle' font-size='16' fill='%2394a3b8'%3E%3F%3C/text%3E%3C/svg%3E"} 
                        alt={userProfile.name} 
                        className={styles.avatar} 
                    />
                    <div className={styles.userInfo}>
                        <h1 className={styles.name}>{userProfile?.name}</h1>
                        <p className={styles.bio}>{userProfile?.bio || "No bio provided."}</p>
                        
                        <div className={styles.metaRow}>
                            <span className={styles.metaBadge}>
                                <MapPin size={16} /> {userProfile?.city || "Unknown Location"}
                            </span>
                            <span className={styles.metaBadge}>
                                <Calendar size={16} /> Joined {formatDate(userProfile?.created_at)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.adsSection}>
                <h2 className={styles.sectionTitle}>{userProfile?.name}'s Active Ads</h2>
                
                {ads.length > 0 ? (
                    <AdGrid ads={ads} loading={false} />
                ) : (
                    <EmptyState 
                        icon={LayoutGrid} 
                        message="No ads posted yet" 
                    />
                )}
            </div>
        </div>
    );
};

export default PublicUser;
