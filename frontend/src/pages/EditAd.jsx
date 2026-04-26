import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UploadCloud, X, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import styles from './PostAd.module.css';

const EditAd = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        category_id: '',
        title: '',
        description: '',
        price: '',
        condition: 'used',
        location: ''
    });

    const [existingImages, setExistingImages] = useState([]);
    const [deletedImageIds, setDeletedImageIds] = useState([]);
    const [newImages, setNewImages] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [adRes, catRes] = await Promise.all([
                    api.get(`/ads/${id}`),
                    api.get('/categories')
                ]);

                if (adRes.data.success && catRes.data.success) {
                    const ad = adRes.data.ad;
                    setFormData({
                        category_id: ad.category.id,
                        title: ad.title,
                        description: ad.description,
                        price: ad.price,
                        condition: ad.condition,
                        location: ad.location
                    });
                    setExistingImages(ad.images);
                    setCategories(catRes.data.categories);
                }
            } catch (e) {
                toast.error('Failed to load ad');
                navigate('/my-ads');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNewImageChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return false;
            }
            return true;
        });

        const totalCount = existingImages.length + newImages.length + validFiles.length;
        if (totalCount > 10) {
            return toast.error("Maximum 10 images allowed total");
        }
        setNewImages([...newImages, ...validFiles]);
    };

    const removeNewImage = (index) => {
        setNewImages(newImages.filter((_, i) => i !== index));
    };

    const removeExistingImage = (imageId) => {
        setExistingImages(existingImages.filter(img => img.id !== imageId));
        setDeletedImageIds([...deletedImageIds, imageId]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const submitData = new FormData();
        Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
        
        // Append _method=PUT for Laravel when sending FormData
        submitData.append('_method', 'PUT');

        newImages.forEach((img) => submitData.append('images[]', img));
        deletedImageIds.forEach((dId) => submitData.append('deleted_image_ids[]', dId));

        try {
            const res = await api.post(`/ads/${id}`, submitData, { headers: { 'Content-Type': 'multipart/form-data' }});
            if (res.data.success) {
                toast.success("Ad updated successfully");
                navigate('/my-ads');
            }
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to update ad");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.stepperWrap}>
                <div className={styles.formCard}>
                    <div className={styles.header}>
                        <button className={styles.backBtn} onClick={() => navigate('/my-ads')}>
                            <ArrowLeft size={20} /> Back
                        </button>
                        <h2>Edit Ad</h2>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.stepPane}>
                        <div className={styles.formGroup}>
                            <label>Category *</label>
                            <select name="category_id" value={formData.category_id} onChange={handleChange} required>
                                {categories.map(cat => (
                                    <optgroup key={cat.id} label={cat.name}>
                                        {cat.subcategories.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Ad Title *</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description *</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="5" required></textarea>
                        </div>
                        <div className={styles.rowTwo}>
                            <div className={styles.formGroup}>
                                <label>Price ($) *</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} min="1" required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Condition</label>
                                <select name="condition" value={formData.condition} onChange={handleChange}>
                                    <option value="used">Used / Second Hand</option>
                                    <option value="new">Brand New</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Location *</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} required />
                        </div>

                        <h3>Manage Images</h3>
                        <p className={styles.hintText}>You currently have {existingImages.length + newImages.length} images (Max 10).</p>
                        
                        <div className={styles.previewGrid}>
                            {existingImages.map((img) => (
                                <div key={img.id} className={styles.previewBox}>
                                    <img src={img.image_url} alt="existing" />
                                    {img.is_primary && <span className={styles.coverBadge}>Cover</span>}
                                    <button type="button" className={styles.removeImgBtn} onClick={() => removeExistingImage(img.id)}><X size={14}/></button>
                                </div>
                            ))}
                            {newImages.map((file, i) => (
                                <div key={`new-${i}`} className={styles.previewBox}>
                                    <img src={URL.createObjectURL(file)} alt="new preview" />
                                    <span className={styles.coverBadge} style={{background: 'var(--accent)', color: 'var(--primary)'}}>New</span>
                                    <button type="button" className={styles.removeImgBtn} onClick={() => removeNewImage(i)}><X size={14}/></button>
                                </div>
                            ))}
                        </div>

                        {existingImages.length + newImages.length < 10 && (
                            <div className={styles.uploadArea} style={{marginTop: 20}}>
                                <input type="file" id="imageUpload" multiple accept="image/jpeg, image/png" onChange={handleNewImageChange} className={styles.fileInputHidden} />
                                <label htmlFor="imageUpload" className={styles.uploadBox} style={{padding: '20px'}}>
                                    <UploadCloud size={30} color="var(--primary)" />
                                    <span>Add More Images</span>
                                </label>
                            </div>
                        )}

                        <div className={styles.footerActions}>
                            <button type="submit" className={styles.nextBtn} disabled={saving}>
                                {saving ? <div className="spinner"></div> : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditAd;
