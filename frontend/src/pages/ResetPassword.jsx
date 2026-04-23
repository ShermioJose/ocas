import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import styles from './Auth.module.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const navigate = useNavigate();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [formData, setFormData] = useState({ password: '', confirm_password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (!email) navigate('/forgot-password');
    }, [email, navigate]);

    const handleOtpChange = (index, e) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newOtp = [...otp];
        newOtp[index] = val.substring(val.length - 1);
        setOtp(newOtp);

        if (val && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) return toast.error("Please enter 6 digit code");

        setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', { 
                email, 
                otp: code, 
                password: formData.password, 
                confirm_password: formData.confirm_password 
            });
            if (res.data.success) {
                toast.success('Password successfully reset');
                navigate('/login');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.card}>
                <Link to="/" className={styles.logo}>OCAS</Link>
                <h1 className={styles.title}>Create New Password</h1>
                <p className={styles.subtitle}>Enter the code sent to {email}</p>

                <form onSubmit={handleSubmit}>
                    <div className={styles.otpContainer}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleOtpChange(i, e)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                ref={el => inputRefs.current[i] = el}
                                className={styles.otpInput}
                                required
                            />
                        ))}
                    </div>

                    <div className={styles.formGroup}>
                        <label>New Password</label>
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

                    <div className={styles.formGroup}>
                        <label>Confirm New Password</label>
                        <input 
                            type="password" 
                            name="confirm_password" 
                            className={styles.input} 
                            required 
                            value={formData.confirm_password} 
                            onChange={handleChange} 
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? <div className="spinner"></div> : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
