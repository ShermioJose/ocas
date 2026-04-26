import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, Menu, Plus, User, MessageSquare, Heart, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const navigate = useNavigate();
    const locationPath = useLocation().pathname;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setDropdownOpen(false);
    }, [locationPath]);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchTerm) params.append('q', searchTerm);
        if (locationInput) params.append('location', locationInput);
        navigate(`/search?${params.toString()}`);
    };

    return (
        <>
            <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
                <div className={styles.container}>
                    {/* Logo */}
                    <Link to="/" className={styles.logo}>
                        OCAS
                    </Link>

                    {/* Desktop Search bar */}
                    <form className={styles.searchBar} onSubmit={handleSearch}>
                        <div className={styles.locationInputGrp}>
                            <MapPin size={18} className={styles.searchIcon} />
                            <input 
                                type="text"
                                placeholder="Location..."
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                            />
                        </div>
                        <div className={styles.keywordInputGrp}>
                            <input 
                                type="text"
                                placeholder="Find Cars, Mobile Phones and more..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button type="submit" className={styles.searchBtn}>
                                <Search size={20} color="white" />
                            </button>
                        </div>
                    </form>

                    {/* Desktop Actions */}
                    <div className={styles.actions}>
                        {user ? (
                            <div className={styles.userMenu}>
                                <div 
                                    className={styles.avatarWrap} 
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    <img 
                                        src={user.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e2e8f0'/%3E%3Ctext x='20' y='25' text-anchor='middle' font-size='16' fill='%2394a3b8'%3E%3F%3C/text%3E%3C/svg%3E"} 
                                        alt={user.name} 
                                        className={styles.avatar} 
                                    />
                                </div>
                                
                                {dropdownOpen && (
                                    <div className={styles.dropdown}>
                                        <div className={styles.dropdownHeader}>
                                            <p className={styles.dropdownName}>{user.name}</p>
                                            <Link to="/profile" className={styles.dropdownViewProfile}>View and edit profile</Link>
                                        </div>
                                        <div className={styles.dropdownLinks}>
                                            <Link to="/my-ads">My Ads</Link>
                                            <Link to="/wishlist">Saved Ads</Link>
                                            <Link to="/messages">Messages</Link>
                                            {isAdmin() && <Link to="/admin" className={styles.adminLink}>Admin Panel</Link>}
                                            <button onClick={logout} className={styles.logoutBtn}>Logout</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className={styles.loginLink}>Login</Link>
                        )}

                        <Link to="/post-ad" className={styles.sellBtn}>
                            <Plus size={20} />
                            Sell on OCAS
                        </Link>
                    </div>
                </div>

                {/* Mobile Search Bar - Shows under header */}
                <div className={styles.mobileSearchWrapper}>
                    <form className={styles.mobileSearch} onSubmit={handleSearch}>
                        <input 
                            type="text"
                            placeholder="Find Cars, Mobile Phones and more..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit"><Search size={18} /></button>
                    </form>
                </div>
            </header>

            {/* Mobile Bottom Navigation */}
            <nav className={styles.bottomNav}>
                <Link to="/" className={`${styles.navItem} ${locationPath === '/' ? styles.navActive : ''}`}>
                    <Home size={24} />
                    <span>Home</span>
                </Link>
                <Link to="/search" className={`${styles.navItem} ${locationPath === '/search' ? styles.navActive : ''}`}>
                    <Search size={24} />
                    <span>Search</span>
                </Link>
                <Link to="/post-ad" className={styles.navItemSell}>
                    <div className={styles.sellCircle}>
                        <Plus size={24} />
                    </div>
                    <span>Sell</span>
                </Link>
                <Link to="/messages" className={`${styles.navItem} ${locationPath === '/messages' ? styles.navActive : ''}`}>
                    <MessageSquare size={24} />
                    <span>Messages</span>
                </Link>
                <Link to={user ? "/profile" : "/login"} className={`${styles.navItem} ${locationPath === '/profile' ? styles.navActive : ''}`}>
                    <User size={24} />
                    <span>{user ? 'Profile' : 'Login'}</span>
                </Link>
            </nav>
        </>
    );
};

export default Navbar;
