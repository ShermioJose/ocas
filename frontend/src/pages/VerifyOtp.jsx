import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

const VerifyOtp = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(120);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (!email) navigate('/register');
        
        const countdown = setInterval(() => {
            setTimer(t => (t > 0 ? t - 1 : 0));
        }, 1000);
        return () => clearInterval(countdown);
    }, [email, navigate]);

    const handleChange = (index, e) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newOtp = [...otp];
        newOtp[index] = val.substring(val.length - 1); // keep only last typed char
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

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        const newOtp = [...otp];
        pastedData.forEach((char, i) => {
            if (!isNaN(char) && i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
        const focusIndex = pastedData.length < 6 ? pastedData.length : 5;
        inputRefs.current[focusIndex].focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) return toast.error("Please enter 6 digit code");

        setLoading(true);
        try {
            const res = await api.post('/auth/verify-otp', { email, otp: code });
            if (res.data.success) {
                login(res.data.user, res.data.token);
                toast.success("Email verified successfully");
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await api.post('/auth/resend-otp', { email, type: 'register' });
            setTimer(120);
            toast.success("New OTP sent to your email");
        } catch(e) {
            toast.error("Failed to resend OTP");
        }
    };

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.card}>
                <Link to="/" className={styles.logo}>OCAS</Link>
                <h1 className={styles.title}>Verify Email</h1>
                <p className={styles.subtitle}>We sent a 6-digit code to {email}</p>

                <form onSubmit={handleSubmit}>
                    <div className={styles.otpContainer} onPaste={handlePaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(i, e)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                ref={el => inputRefs.current[i] = el}
                                className={styles.otpInput}
                                required
                            />
                        ))}
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? <div className="spinner"></div> : "Verify"}
                    </button>
                    
                    <button 
                        type="button" 
                        className={styles.resendBtn} 
                        disabled={timer > 0}
                        onClick={handleResend}
                    >
                        {timer > 0 ? `Resend OTP in ${Math.floor(timer/60)}:${(timer%60).toString().padStart(2, '0')}` : "Resend OTP"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VerifyOtp;
