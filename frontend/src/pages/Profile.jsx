import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Save, Camera } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './Profile.module.css';

const Profile = () => {
    const { user, setUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        city: user?.city || '',
        bio: user?.bio || ''
    });

    const [avatarFile, setAvatarFile] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/profile', formData);
            if (res.data.success) {
                const updated = res.data.user || res.data.profile;
                if (updated) {
                    setUser(updated);
                    localStorage.setItem('user', JSON.stringify(updated));
                }
                toast.success('Profile updated successfully');
                setEditing(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await api.post('/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                const updated = { ...user, avatar_url: res.data.avatar_url };
                setUser(updated);
                localStorage.setItem('user', JSON.stringify(updated));
                toast.success('Avatar updated');
            }
        } catch (error) {
            toast.error('Avatar upload failed');
        }
    };

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.profileCard}>
                <div className={styles.headerArea}>
                    <div className={styles.avatarWrap}>
                        <img src={user?.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e2e8f0'/%3E%3Ctext x='20' y='25' text-anchor='middle' font-size='16' fill='%2394a3b8'%3E%3F%3C/text%3E%3C/svg%3E"} alt="Avatar" className={styles.avatar} />
                        <label className={styles.avatarEditBtn}>
                            <Camera size={16} />
                            <input type="file" accept="image/jpeg, image/png" hidden onChange={handleAvatarUpload} />
                        </label>
                    </div>

                    <div className={styles.headerInfo}>
                        {!editing ? (
                            <>
                                <h1 className={styles.name}>{user?.name}</h1>
                                <p className={styles.metaData}>{user?.email} • {user?.phone}</p>
                                <p className={styles.metaData}>{user?.city ? `Lives in ${user?.city}` : 'No city added'}</p>
                                <p className={styles.bio}>{user?.bio || 'You have not added a bio yet.'}</p>
                                <button className={styles.editBtn} onClick={() => setEditing(true)}>Edit Profile</button>
                            </>
                        ) : (
                            <form onSubmit={handleFormSubmit} className={styles.editForm}>
                                <div className={styles.formGroup}>
                                    <label>Full Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className={styles.row}>
                                    <div className={styles.formGroup}>
                                        <label>Phone Number</label>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>City</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Bio</label>
                                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3"></textarea>
                                </div>
                                <div className={styles.actions}>
                                    <button type="button" className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
                                    <button type="submit" className={styles.saveBtn} disabled={loading}>
                                        {loading ? <div className="spinner"></div> : <><Save size={16}/> Save Changes</>}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
