import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import styles from './Auth.module.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            if (res.data.success) {
                toast.success('Password reset OTP sent to your email');
                navigate(`/reset-password?email=${encodeURIComponent(email)}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.card}>
                <Link to="/" className={styles.logo}>OCAS</Link>
                <h1 className={styles.title}>Reset your OCAS password</h1>
                <p className={styles.subtitle}>Enter your email to receive a reset code</p>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            name="email" 
                            className={styles.input} 
                            required 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? <div className="spinner"></div> : "Send Reset Code"}
                    </button>
                </form>

                <div className={`${styles.links} ${styles.linksCenter}`}>
                    <Link to="/login">← Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
