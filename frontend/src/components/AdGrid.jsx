import React from 'react';
import AdCard from './AdCard';
import styles from './AdGrid.module.css';

const AdGrid = ({ ads, loading }) => {
    if (loading) {
        return (
            <div className={styles.grid}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className={styles.skeletonWrapper}>
                        <div className={`skeleton ${styles.skeletonImg}`}></div>
                        <div className={`skeleton ${styles.skeletonPrice}`}></div>
                        <div className={`skeleton ${styles.skeletonTitle}`}></div>
                        <div className={`skeleton ${styles.skeletonMeta}`}></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!ads || ads.length === 0) {
        return null; // Empty state usually handled by parent
    }

    return (
        <div className={styles.grid}>
            {ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} inGrid={true} />
            ))}
        </div>
    );
};

export default AdGrid;
