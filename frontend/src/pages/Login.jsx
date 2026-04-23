import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showResendLink, setShowResendLink] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', formData);
            if (res.data.success) {
                login(res.data.user, res.data.token);
                toast.success('Welcome back to OCAS!');
                navigate('/');
            }
        } catch (err) {
            if (err.response?.status === 403) {
                setError(err.response.data.message);
                if (err.response.data.message.includes('verify')) {
                    setShowResendLink(true);
                }
            } else if (err.response?.status === 401) {
                setError('Invalid email or password');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.card}>
                <Link to="/" className={styles.logo}>OCAS</Link>
                <h1 className={styles.title}>Welcome back</h1>
                <p className={styles.subtitle}>Login to post ads and chat with sellers</p>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-text" style={{textAlign: 'center', marginBottom: 16, fontSize: '1rem'}}>{error}</div>}
                    {showResendLink && (
                        <div style={{textAlign: 'center', marginBottom: 16}}>
                            <Link to={`/verify-otp?email=${encodeURIComponent(formData.email)}`} style={{fontWeight: 500, color: 'var(--primary)'}}>
                                Resend verification email
                            </Link>
                        </div>
                    )}
                    
                    <div className={styles.formGroup}>
                        <label>Email Address</label>
                        <input type="email" name="email" className={styles.input} required value={formData.email} onChange={handleChange} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Password</label>
                        <div className={styles.inputWrap}>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                className={styles.input} 
                                required 
                                value={formData.password} 
                                onChange={handleChange} 
                            />
                            <button type="button" className={styles.iconBtn} onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? <div className="spinner"></div> : "Login"}
                    </button>
                </form>

                <div className={styles.links}>
                    <Link to="/forgot-password" style={{fontWeight: 500}}>Forgot Password?</Link>
                    <Link to="/register">New to OCAS? Register</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
