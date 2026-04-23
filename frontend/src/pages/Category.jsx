import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AdGrid from '../components/AdGrid';
import EmptyState from '../components/EmptyState';
import { Filter, X, LayoutGrid } from 'lucide-react';
import styles from './Search.module.css'; // Reusing search styles for layout

const Category = () => {
    const { slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryInfo, setCategoryInfo] = useState(null);
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        min_price: searchParams.get('min_price') || '',
        max_price: searchParams.get('max_price') || '',
        location: searchParams.get('location') || '',
        condition: searchParams.get('condition') || '',
        sort: searchParams.get('sort') || 'newest',
    });

    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        const fetchCategoryAds = async () => {
            setLoading(true);
            try {
                const queryStr = searchParams.toString();
                const res = await api.get(`/categories/${slug}/ads?${queryStr}`);
                if (res.data.success) {
                    setAds(res.data.ads.data);
                    setCategoryInfo(res.data.category);
                }
            } catch (error) {
                console.error("Fetch failed");
            } finally {
                setLoading(false);
            }
        };
        fetchCategoryAds();
    }, [slug, searchParams]);

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
            min_price: '', max_price: '',
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
                        {categoryInfo ? categoryInfo.name : <div className="skeleton" style={{width: 200, height: 30}}></div>}
                    </h1>
                    <button className={styles.mobileFilterToggle} onClick={() => setShowMobileFilters(true)}>
                        <Filter size={18} /> Filters
                    </button>
                </div>
            </div>

            <div className={styles.mainContent}>
                <aside className={`${styles.sidebar} ${showMobileFilters ? styles.showMobile : ''}`}>
                    <div className={styles.sidebarHeaderMobile}>
                        <h3>Filters</h3>
                        <button onClick={() => setShowMobileFilters(false)}><X size={24} /></button>
                    </div>

                    <form className={styles.filterForm} onSubmit={applyFilters}>
                         {/* Same filters as Search but without Category Select and Keyword */}
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
                            <button type="button" className={styles.clearBtn} onClick={clearFilters}>Clear</button>
                        </div>
                    </form>
                </aside>

                <div className={styles.resultsArea}>
                    {!loading && ads.length > 0 && (
                        <p className={styles.resultCount}>{ads.length} ads in this category</p>
                    )}
                    
                    {loading ? (
                        <AdGrid loading={true} />
                    ) : ads.length > 0 ? (
                        <AdGrid ads={ads} loading={false} />
                    ) : (
                        <EmptyState 
                            icon={LayoutGrid} 
                            message="No ads found in this category" 
                            actionLabel="Browse All Categories"
                            actionLink="/"
                            onClickAction={(e) => { e.preventDefault(); navigate('/'); }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Category;
