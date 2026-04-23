import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const { token } = useAuth();
    const [wishlistIds, setWishlistIds] = useState([]);

    useEffect(() => {
        if (token) {
            fetchWishlist();
        } else {
            setWishlistIds([]);
        }
    }, [token]);

    const fetchWishlist = async () => {
        try {
            const res = await api.get('/wishlist');
            if (res.data.success) {
                setWishlistIds(res.data.wishlist.map(ad => ad.id));
            }
        } catch (e) {
            console.error("Failed to load wishlist");
        }
    };

    const toggle = async (adId) => {
        if (!token) {
            toast.error("Please login to save ads");
            return;
        }

        const isCurrentlySaved = wishlistIds.includes(adId);
        
        // Optimistic UI update
        if (isCurrentlySaved) {
            setWishlistIds(prev => prev.filter(id => id !== adId));
        } else {
            setWishlistIds(prev => [...prev, adId]);
        }

        try {
            if (isCurrentlySaved) {
                await api.delete(`/wishlist/${adId}`);
                toast.success("Removed from saved ads");
            } else {
                await api.post(`/wishlist/${adId}`);
                toast.success("Saved to your wishlist");
            }
        } catch (e) {
            // Revert optimistic update on failure
            if (e.response?.status !== 403) { // Ignore 'Cannot wishlist own ad'
                if (isCurrentlySaved) {
                    setWishlistIds(prev => [...prev, adId]);
                } else {
                    setWishlistIds(prev => prev.filter(id => id !== adId));
                }
                toast.error(e.response?.data?.message || "Action failed");
            }
        }
    };

    const isWishlisted = (adId) => {
        return wishlistIds.includes(adId);
    };

    return (
        <WishlistContext.Provider value={{ wishlistIds, toggle, isWishlisted }}>
            {children}
        </WishlistContext.Provider>
    );
};
