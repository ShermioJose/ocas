import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Car, Smartphone, Home as HomeIcon, Monitor, Briefcase, Camera } from 'lucide-react';
import api from '../api/axios';
import AdGrid from '../components/AdGrid';
import styles from './Home.module.css';

const ICONS = {
    'properties': HomeIcon,
    'vehicles': Car,
    'electronics': Monitor,
    'mobiles': Smartphone,
    'jobs': Briefcase,
    'services': Camera
};

const Home = () => {
    const [ads, setAds] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [adsRes, catsRes] = await Promise.all([
                    api.get('/ads?sort=newest'),
                    api.get('/categories')
                ]);
                
                if (adsRes.data.success) {
                    setAds(adsRes.data.ads.data);
                }
                if (catsRes.data.success) {
                    setCategories(catsRes.data.categories);
                }
            } catch (error) {
                console.error("Failed to fetch home data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);
        if (location) params.append('location', location);
        navigate(`/search?${params.toString()}`);
    };

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Buy & Sell Anything on OCAS</h1>
                    <p className={styles.heroSubtitle}>Join millions of buyers and sellers in your local community.</p>
                    
                    <form className={styles.heroSearch} onSubmit={handleSearch}>
                        <div className={styles.inputWrap}>
                            <MapPin className={styles.inputIcon} size={20} />
                            <input 
                                type="text" 
                                placeholder="Where?" 
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                        <div className={styles.inputWrapMain}>
                            <input 
                                type="text" 
                                placeholder="Find Cars, Mobile Phones and more..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className={styles.heroSearchBtn}>
                                <Search size={20} />
                                <span>Search</span>
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Categories */}
            <section className={styles.sectionWrap}>
                <h2 className={styles.sectionTitle}>Browse Categories</h2>
                <div className={styles.categoryGrid}>
                    {categories.map((cat) => {
                        const IconComponent = ICONS[cat.slug] || Monitor; // fallback
                        return (
                            <Link key={cat.id} to={`/category/${cat.slug}`} className={styles.categoryItem}>
                                <div className={styles.categoryIconWrap}>
                                    <IconComponent size={32} />
                                </div>
                                <span className={styles.categoryName}>{cat.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* Featured / Recent Ads */}
            <section className={`${styles.sectionWrap} ${styles.bgGray}`}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Fresh Recommendations</h2>
                    <Link to="/search" className={styles.viewAll}>View All →</Link>
                </div>
                <AdGrid ads={ads} loading={loading} />
            </section>
            
            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerBrand}>
                        <h2>OCAS</h2>
                        <p>Your trusted marketplace to buy and sell anything.</p>
                    </div>
                    <div className={styles.footerLinks}>
                        <Link to="/">About Us</Link>
                        <Link to="/">Contact Support</Link>
                        <Link to="/">Terms of Service</Link>
                        <Link to="/">Privacy Policy</Link>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <p>&copy; {new Date().getFullYear()} OCAS. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
