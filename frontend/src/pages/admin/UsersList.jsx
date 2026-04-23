import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import styles from './Admin.module.css';

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            if (res.data.success) {
                setUsers(res.data.users.data);
            }
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleBanToggle = async (userId) => {
        try {
            const res = await api.post(`/admin/users/${userId}/ban`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchUsers();
            }
        } catch (error) {
            toast.error("Failed to update user status");
        }
    };

    if (loading) return <Loader />;

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>User Management</h1>
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>#{user.id}</td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td><span className={`badge ${user.role === 'admin' ? 'active' : 'sold'}`}>{user.role}</span></td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                    {user.role !== 'admin' && (
                                        <button 
                                            className={`${styles.actionBtn} ${user.is_banned ? styles.approve : styles.reject}`}
                                            onClick={() => handleBanToggle(user.id)}
                                        >
                                            {user.is_banned ? 'Unban' : 'Ban'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{textAlign: 'center', padding: '24px'}}>No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersList;
