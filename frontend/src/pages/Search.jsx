import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import AdGrid from '../components/AdGrid';
import EmptyState from '../components/EmptyState';
import { Filter, X, Search as SearchIcon } from 'lucide-react';
import styles from './Search.module.css';

const Search = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    
    // Filter State
    const [filters, setFilters] = useState({
        q: searchParams.get('q') || '',
        category_id: searchParams.get('category_id') || '',
        min_price: searchParams.get('min_price') || '',
        max_price: searchParams.get('max_price') || '',
        location: searchParams.get('location') || '',
        condition: searchParams.get('condition') || '',
        sort: searchParams.get('sort') || 'newest',
    });

    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                if (res.data.success) {
                    setCategories(res.data.categories);
                }
            } catch (error) {
                console.error("Categories fetch failed");
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchAds = async () => {
            setLoading(true);
            try {
                const queryStr = searchParams.toString();
                const res = await api.get(`/ads?${queryStr}`);
                if (res.data.success) {
                    setAds(res.data.ads.data);
                }
            } catch (error) {
                console.error("Ads fetch failed");
            } finally {
                setLoading(false);
            }
        };
        fetchAds();
        
        // Sync state with URL if URL changes externally
        setFilters(prev => ({
            ...prev,
            q: searchParams.get('q') || '',
            location: searchParams.get('location') || ''
        }));
    }, [searchParams]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = (e) => {
        if(e) e.preventDefault();
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) params.append(key, filters[key]);
        });
        setSearchParams(params);
        setShowMobileFilters(false);
    };

    const clearFilters = () => {
        setFilters({
            q: '', category_id: '', min_price: '', max_price: '',
            location: '', condition: '', sort: 'newest'
        });
        setSearchParams(new URLSearchParams());
        setShowMobileFilters(false);
    };

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.headerWrap}>
                <div className={styles.headerInner}>
                    <h1 className={styles.title}>
                        {filters.q ? `Search results for "${filters.q}"` : "Browse Ads"}
                    </h1>
                    <button className={styles.mobileFilterToggle} onClick={() => setShowMobileFilters(true)}>
                        <Filter size={18} /> Filters
                    </button>
                </div>
            </div>

            <div className={styles.mainContent}>
                {/* Filter Sidebar */}
                <aside className={`${styles.sidebar} ${showMobileFilters ? styles.showMobile : ''}`}>
                    <div className={styles.sidebarHeaderMobile}>
                        <h3>Filters</h3>
                        <button onClick={() => setShowMobileFilters(false)}><X size={24} /></button>
                    </div>

                    <form className={styles.filterForm} onSubmit={applyFilters}>
                        <div className={styles.filterGroup}>
                            <label>Keyword</label>
                            <input type="text" name="q" value={filters.q} onChange={handleFilterChange} placeholder="Search..." />
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Category</label>
                            <select name="category_id" value={filters.category_id} onChange={handleFilterChange}>
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <optgroup key={cat.id} label={cat.name}>
                                        <option value={cat.id}>{cat.name} (All)</option>
                                        {cat.subcategories.map(sub => (
                                            <option key={sub.id} value={sub.id}>-- {sub.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Price Range</label>
                            <div className={styles.priceInputs}>
                                <input type="number" name="min_price" value={filters.min_price} onChange={handleFilterChange} placeholder="Min" />
                                <span>-</span>
                                <input type="number" name="max_price" value={filters.max_price} onChange={handleFilterChange} placeholder="Max" />
                            </div>
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Condition</label>
                            <div className={styles.radioGroup}>
                                <label><input type="radio" name="condition" value="" checked={filters.condition === ''} onChange={handleFilterChange} /> Any</label>
                                <label><input type="radio" name="condition" value="new" checked={filters.condition === 'new'} onChange={handleFilterChange} /> New</label>
                                <label><input type="radio" name="condition" value="used" checked={filters.condition === 'used'} onChange={handleFilterChange} /> Used</label>
                            </div>
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Location</label>
                            <input type="text" name="location" value={filters.location} onChange={handleFilterChange} placeholder="City or Zip" />
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Sort By</label>
                            <select name="sort" value={filters.sort} onChange={handleFilterChange}>
                                <option value="newest">Newest First</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                                <option value="popular">Most Popular</option>
                            </select>
                        </div>

                        <div className={styles.filterActions}>
                            <button type="submit" className={styles.applyBtn}>Apply Filters</button>
                            <button type="button" className={styles.clearBtn} onClick={clearFilters}>Clear All</button>
                        </div>
                    </form>
                </aside>

                {/* Ad Grid Section */}
                <div className={styles.resultsArea}>
                    {!loading && ads.length > 0 && (
                        <p className={styles.resultCount}>{ads.length} ads found</p>
                    )}
                    
                    {loading ? (
                        <AdGrid loading={true} />
                    ) : ads.length > 0 ? (
                        <AdGrid ads={ads} loading={false} />
                    ) : (
                        <EmptyState 
                            icon={SearchIcon} 
                            message="No ads found matching your filters" 
                            actionLabel="Clear Filters"
                            actionLink="#"
                            onClickAction={(e) => { e.preventDefault(); clearFilters(); }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Search;
