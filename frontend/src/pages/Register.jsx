import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import styles from './Auth.module.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', confirm_password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if(errors[e.target.name]) setErrors({...errors, [e.target.name]: null});
    };

    const getStrength = (pass) => {
        let score = 0;
        if (!pass) return { width: '0%', color: 'var(--bg)' };
        if (pass.length > 5) score += 1;
        if (pass.length > 7) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        
        switch(score) {
            case 1: return { width: '25%', color: 'var(--danger)' };
            case 2: return { width: '50%', color: 'var(--pending)' };
            case 3: return { width: '75%', color: 'var(--accent)' };
            case 4: return { width: '100%', color: 'var(--success)' };
            default: return { width: '25%', color: 'var(--danger)' };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/register', formData);
            if (res.data.success) {
                navigate('/verify-otp?email=' + encodeURIComponent(formData.email));
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                const formattedErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    formattedErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(formattedErrors);
            } else {
                toast.error(error.response?.data?.message || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const strObj = getStrength(formData.password);

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.card}>
                <Link to="/" className={styles.logo}>OCAS</Link>
                <h1 className={styles.title}>Create an account</h1>
                <p className={styles.subtitle}>Join OCAS to buy and sell locally</p>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Full Name</label>
                        <input type="text" name="name" className={styles.input} required value={formData.name} onChange={handleChange} />
                        {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Email Address</label>
                        <input type="email" name="email" className={styles.input} required value={formData.email} onChange={handleChange} />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Phone Number</label>
                        <input type="text" name="phone" className={styles.input} required value={formData.phone} onChange={handleChange} />
                        {errors.phone && <span className="error-text">{errors.phone}</span>}
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
                        <div className={styles.passwordStrength}>
                            <div className={styles.passwordBar} style={{ width: strObj.width, backgroundColor: strObj.color }}></div>
                        </div>
                        {errors.password && <span className="error-text">{errors.password}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Confirm Password</label>
                        <input type="password" name="confirm_password" className={styles.input} required value={formData.confirm_password} onChange={handleChange} />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? <div className="spinner"></div> : "Register"}
                    </button>
                </form>

                <div className={`${styles.links} ${styles.linksCenter}`}>
                    <span>Already have an account?</span>
                    <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
