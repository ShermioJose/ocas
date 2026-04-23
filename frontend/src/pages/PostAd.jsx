import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronRight, ArrowLeft, UploadCloud, X, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import styles from './PostAd.module.css';

const PostAd = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [categories, setCategories] = useState([]);
    const [selectedParent, setSelectedParent] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        category_id: '',
        title: '',
        description: '',
        price: '',
        condition: 'used',
        location: ''
    });

    const [images, setImages] = useState([]);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await api.get('/categories');
                if (res.data.success) {
                    setCategories(res.data.categories);
                }
            } catch (e) {
                toast.error('Failed to load categories');
            }
        };
        fetchCats();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 10) {
            return toast.error("Maximum 10 images allowed");
        }
        setImages([...images, ...files]);
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const nextStep = () => {
        if (step === 1 && !formData.category_id) return toast.error("Please select a category");
        if (step === 2) {
            if (!formData.title || !formData.description || !formData.price || !formData.location) {
                return toast.error("Please fill all required fields");
            }
            if (formData.price <= 0) return toast.error("Price must be greater than 0");
        }
        if (step === 3 && images.length === 0) return toast.error("Please add at least one image");
        
        setStep(s => s + 1);
    };

    const prevStep = () => {
        if (step === 1) navigate('/');
        else setStep(s => s - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        const submitData = new FormData();
        Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
        images.forEach((img) => submitData.append('images[]', img));

        try {
            const res = await api.post('/ads', submitData, { headers: { 'Content-Type': 'multipart/form-data' }});
            if (res.data.success) {
                setStep(5); // Success step
                toast.success("Ad submitted successfully");
            }
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to submit ad");
            if (e.response?.data?.errors) {
                // Return to step where the error likely is, or show generic
                setStep(2);
            }
        } finally {
            setLoading(false);
        }
    };

    const getProgressWidth = () => {
        if (step === 5) return '100%';
        return `${(step / 4) * 100}%`;
    };

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.stepperWrap}>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: getProgressWidth() }}></div>
                </div>
                <div className={styles.formCard}>
                    <div className={styles.header}>
                        {step < 5 && (
                            <button className={styles.backBtn} onClick={prevStep}>
                                <ArrowLeft size={20} /> {step === 1 ? 'Cancel' : 'Back'}
                            </button>
                        )}
                        <h2>Post an Ad</h2>
                        <span className={styles.stepIndicator}>{step < 5 ? `Step ${step} of 4` : ''}</span>
                    </div>

                    <div className={styles.stepContent}>
                        {/* STEP 1: CATEGORY */}
                        {step === 1 && (
                            <div className={styles.stepPane}>
                                <h3>Choose a category</h3>
                                {!selectedParent ? (
                                    <div className={styles.categoryGrid}>
                                        {categories.map(cat => (
                                            <div key={cat.id} className={styles.catBox} onClick={() => setSelectedParent(cat)}>
                                                {cat.name} <ChevronRight size={16} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.subCatSelection}>
                                        <button className={styles.changeCatBtn} onClick={() => { setSelectedParent(null); setFormData({...formData, category_id: ''}); }}>
                                            ← Change Category ({selectedParent.name})
                                        </button>
                                        <div className={styles.subCatList}>
                                            {selectedParent.subcategories.map(sub => (
                                                <div 
                                                    key={sub.id} 
                                                    className={`${styles.subCatBox} ${formData.category_id == sub.id ? styles.selected : ''}`}
                                                    onClick={() => setFormData({...formData, category_id: sub.id})}
                                                >
                                                    {sub.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 2: DETAILS */}
                        {step === 2 && (
                            <div className={styles.stepPane}>
                                <h3>Ad Details</h3>
                                <div className={styles.formGroup}>
                                    <label>Ad Title *</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. iPhone 13 Pro 128GB" required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Description *</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows="5" placeholder="Include condition, features, and reason for selling" required></textarea>
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
                                    <label>Location (City or Neighborhood) *</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. New York, NY" required />
                                </div>
                            </div>
                        )}

                        {/* STEP 3: IMAGES */}
                        {step === 3 && (
                            <div className={styles.stepPane}>
                                <h3>Upload Images</h3>
                                <p className={styles.hintText}>Upload up to 10 pictures. The first picture will be your cover photo.</p>
                                
                                <div className={styles.uploadArea}>
                                    <input type="file" id="imageUpload" multiple accept="image/jpeg, image/png, image/jpg" onChange={handleImageChange} className={styles.fileInputHidden} />
                                    <label htmlFor="imageUpload" className={styles.uploadBox}>
                                        <UploadCloud size={40} color="var(--primary)" />
                                        <span>Click to browse images</span>
                                    </label>
                                </div>
                                
                                <p className={styles.imageCount}>{images.length} / 10 images selected</p>

                                <div className={styles.previewGrid}>
                                    {images.map((file, i) => (
                                        <div key={i} className={styles.previewBox}>
                                            <img src={URL.createObjectURL(file)} alt="preview" />
                                            {i === 0 && <span className={styles.coverBadge}>Cover</span>}
                                            <button className={styles.removeImgBtn} onClick={() => removeImage(i)}><X size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 4: PREVIEW */}
                        {step === 4 && (
                            <div className={styles.stepPane}>
                                <h3>Review your Ad</h3>
                                <div className={styles.previewSummary}>
                                    <div className={styles.previewHeaderRow}>
                                        <img src={URL.createObjectURL(images[0])} alt="cover" className={styles.previewSummaryImg}/>
                                        <div className={styles.previewSummaryMeta}>
                                            <h4>{formData.title}</h4>
                                            <p className={styles.previewPrice}>${formData.price}</p>
                                            <p>{formData.location}</p>
                                        </div>
                                    </div>
                                    <div className={styles.previewSummaryBody}>
                                        <p><strong>Condition:</strong> <span style={{textTransform:'capitalize'}}>{formData.condition}</span></p>
                                        <p><strong>Description:</strong></p>
                                        <div className={styles.grayBox}>{formData.description}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: SUCCESS */}
                        {step === 5 && (
                            <div className={`${styles.stepPane} ${styles.successPane}`}>
                                <CheckCircle size={80} color="var(--success)" />
                                <h3>Your ad has been submitted!</h3>
                                <p>OCAS administrators will review it shortly. Once approved, it will be visible to buyers worldwide.</p>
                                <button className={styles.successBtn} onClick={() => navigate('/my-ads')}>Go to My Ads</button>
                            </div>
                        )}
                    </div>

                    {/* Step Actions */}
                    {step < 5 && (
                        <div className={styles.footerActions}>
                            {step < 4 ? (
                                <button className={styles.nextBtn} onClick={nextStep}>Next Step <ChevronRight size={18}/></button>
                            ) : (
                                <button className={styles.nextBtn} onClick={handleSubmit} disabled={loading}>
                                    {loading ? <div className="spinner"></div> : "Submit Ad"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostAd;
