import React from 'react';
import { CameraOff } from 'lucide-react';
import styles from './EmptyState.module.css';

const EmptyState = ({ icon: Icon = CameraOff, message, actionLabel, actionLink }) => {
    return (
        <div className={styles.emptyContainer}>
            <div className={styles.iconCircle}>
                <Icon size={48} color="var(--text-light)" />
            </div>
            <h3 className={styles.message}>{message || "Nothing to show here"}</h3>
            {actionLabel && actionLink && (
                <a href={actionLink} className={styles.actionBtn}>
                    {actionLabel}
                </a>
            )}
        </div>
    );
};

export default EmptyState;
