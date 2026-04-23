import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import Category from './pages/Category';
import AdDetail from './pages/AdDetail';
import PublicUser from './pages/PublicUser';

import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import PostAd from './pages/PostAd';
import MyAds from './pages/MyAds';
import EditAd from './pages/EditAd';
import Wishlist from './pages/Wishlist';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import UsersList from './pages/admin/UsersList';
import AdsManager from './pages/admin/AdsManager';
import ReportsConsole from './pages/admin/ReportsConsole';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { user, loading, isAdmin } = useAuth();
    if (loading) return null;
    return user && isAdmin() ? children : <Navigate to="/" />;
};

const Layout = ({ children }) => (
    <>
        <Navbar />
        <main className="main-content">
            {children}
        </main>
    </>
);

function App() {
  return (
    <BrowserRouter>
        <AuthProvider>
            <WishlistProvider>
                <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
                <Routes>
                    {/* Public Routes with Navbar */}
                    <Route path="/" element={<Layout><Home /></Layout>} />
                    <Route path="/search" element={<Layout><Search /></Layout>} />
                    <Route path="/category/:slug" element={<Layout><Category /></Layout>} />
                    <Route path="/ads/:id" element={<Layout><AdDetail /></Layout>} />
                    <Route path="/user/:id" element={<Layout><PublicUser /></Layout>} />

                    {/* Auth Routes (No Navbar Usually, or simplified) */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-otp" element={<VerifyOtp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Protected Routes with Navbar */}
                    <Route path="/post-ad" element={<PrivateRoute><Layout><PostAd /></Layout></PrivateRoute>} />
                    <Route path="/my-ads" element={<PrivateRoute><Layout><MyAds /></Layout></PrivateRoute>} />
                    <Route path="/edit-ad/:id" element={<PrivateRoute><Layout><EditAd /></Layout></PrivateRoute>} />
                    <Route path="/wishlist" element={<PrivateRoute><Layout><Wishlist /></Layout></PrivateRoute>} />
                    <Route path="/messages" element={<PrivateRoute><Layout><Messages /></Layout></PrivateRoute>} />
                    <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />

                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                        <Route index element={<Dashboard />} />
                        <Route path="users" element={<UsersList />} />
                        <Route path="ads" element={<AdsManager />} />
                        <Route path="reports" element={<ReportsConsole />} />
                    </Route>
                </Routes>
            </WishlistProvider>
        </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
