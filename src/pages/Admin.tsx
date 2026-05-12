import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductsStore } from '@/store/useProductsStore';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Package, ShoppingBag, PlusCircle, Settings, Edit, Activity } from 'lucide-react';
import { formatNPR } from '@/lib/utils';
import { uploadImageToCloudinary } from '@/lib/upload';
import { AnalyticsTab } from '@/components/admin/AnalyticsTab';

const CATEGORIES = {
  Uppers: ['Tshirts', 'Shirts', 'Jackets', 'Hoodies'],
  Lowers: ['Pants', 'Trousers', 'Shorts'],
  Essentials: [],
  Accessories: [],
};

const MAIN_CATEGORIES = Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>;
const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL'];

export function Admin() {
  const { user, isAdmin, loading } = useAuthStore();
  const { products } = useProductsStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'manageProducts' | 'addProduct' | 'orders' | 'analytics' | 'settings'>('manageProducts');

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [storeQrCodeUrl, setStoreQrCodeUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [notificationSoundUrl, setNotificationSoundUrl] = useState<string | null>(null);

  const handleUploadQrCode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setSettingsLoading(true);
    try {
      const url = await uploadImageToCloudinary(e.target.files[0]);
      await setDoc(doc(db, "settings", "store"), { qrCodeUrl: url }, { merge: true });
      setStoreQrCodeUrl(url);
      alert("QR Code updated successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to upload QR code: " + (err.message || 'Unknown error. Check console.'));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setSettingsLoading(true);
    try {
      const url = await uploadImageToCloudinary(e.target.files[0]);
      await setDoc(doc(db, "settings", "store"), { logoUrl: url }, { merge: true });
      setLogoUrl(url);
      alert("Logo updated successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to upload logo: " + (err.message || 'Unknown error. Check console.'));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUploadSound = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setSettingsLoading(true);
    try {
      // Sound files can also be uploaded to Cloudinary as raw files or audio, depending on the upload setup.
      // Assuming uploadImageToCloudinary works for any file, but if it specifies resource_type="image", it might fail.
      // Wait, let's use the provided upload tool which defaults to auto.
      const url = await uploadImageToCloudinary(e.target.files[0]);
      await setDoc(doc(db, "settings", "store"), { notificationSoundUrl: url }, { merge: true });
      setNotificationSoundUrl(url);
      alert("Notification sound updated successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to upload sound: " + (err.message || 'Unknown error. Check console.'));
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      import("firebase/firestore").then(async ({ getDoc, doc }) => {
        const snap = await getDoc(doc(db, "settings", "store"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.qrCodeUrl) setStoreQrCodeUrl(data.qrCodeUrl);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.notificationSoundUrl) setNotificationSoundUrl(data.notificationSoundUrl);
        }
      });
    }
  }, [activeTab]);

  // Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    oldPrice: '',
    description: '',
    mainCategory: MAIN_CATEGORIES[0],
    subCategory: '',
    colour: '',
  });
  
  const [productFlags, setProductFlags] = useState({
    isNew: true,
    isFeatured: false,
    isBestSeller: false,
    isSale: false,
  });

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error'} | null>(null);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/login');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (activeTab === 'orders' && isAdmin) {
      loadOrders();
    }
  }, [activeTab, isAdmin]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(fetchedOrders);
    } catch (err: any) {
      console.error("Error loading orders:", err);
      handleFirestoreError(err, OperationType.LIST, 'orders');
      if (err.message.includes("permission")) {
        setMessage({ text: "Permission denied loading orders. Please update Firestore rules.", type: "error" });
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await setDoc(doc(db, 'orders', orderId), { status }, { merge: true });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status. Check permissions.");
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await import("firebase/firestore").then(async ({ deleteDoc }) => {
        await deleteDoc(doc(db, 'orders', orderId));
      });
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (err: any) {
      console.error("Failed to delete order", err);
      alert("Failed to delete order. Check permissions.");
    }
  };

  if (loading || !user || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleFlagToggle = (flag: keyof typeof productFlags) => {
    setProductFlags(prev => ({
      ...prev,
      [flag]: !prev[flag]
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      setImageFiles(prev => [...prev, ...filesArray]);
      
      const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const clearForm = () => {
    setFormData({
      name: '',
      price: '',
      oldPrice: '',
      description: '',
      mainCategory: MAIN_CATEGORIES[0],
      subCategory: '',
      colour: '',
    });
    setProductFlags({
      isNew: true,
      isFeatured: false,
      isBestSeller: false,
      isSale: false,
    });
    setSelectedSizes([]);
    setImageFiles([]);
    setImagePreviewUrls([]);
    setEditingProductId(null);
  };

  const handleEditProduct = (product: any) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      oldPrice: product.oldPrice ? product.oldPrice.toString() : '',
      description: product.description,
      mainCategory: product.category,
      subCategory: product.subCategory || '',
      colour: product.colour || '',
    });
    setProductFlags({
      isNew: product.isNew || false,
      isFeatured: product.isFeatured || false,
      isBestSeller: product.isBestSeller || false,
      isSale: product.isSale || false,
    });
    setSelectedSizes(product.sizes || []);
    setImagePreviewUrls(product.images || []);
    setImageFiles([]); // We keep existing urls if no new files are uploaded
    setActiveTab('addProduct');
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product? It will be removed permanently.")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      useProductsStore.getState().initialize(); // refresh local
    } catch (err: any) {
      alert("Failed to delete product. " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Validate images
    if (imageFiles.length === 0 && imagePreviewUrls.length === 0) {
      setMessage({ text: 'Please add at least one image', type: 'error' });
      setIsSubmitting(false);
      return;
    }

    try {
      let finalImageUrls = [...imagePreviewUrls.filter(url => !url.startsWith('blob:'))];

      if (imageFiles.length > 0) {
        const newlyUploadedUrls = await Promise.all(imageFiles.map(file => uploadImageToCloudinary(file)));
        finalImageUrls = [...finalImageUrls, ...newlyUploadedUrls];
      }

      const productData = {
        name: formData.name,
        price: Number(formData.price),
        oldPrice: formData.oldPrice ? Number(formData.oldPrice) : null,
        description: formData.description,
        category: formData.mainCategory,
        subCategory: formData.subCategory,
        colour: formData.colour || null,
        sizes: selectedSizes,
        images: finalImageUrls,
        ...productFlags,
      };

      if (editingProductId) {
        await setDoc(doc(db, 'products', editingProductId), {
          ...productData,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        setMessage({ text: 'Product updated successfully!', type: 'success' });
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
        });
        setMessage({ text: 'Product added successfully!', type: 'success' });
      }
      
      clearForm();
      useProductsStore.getState().initialize(); // refresh list
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('permission')) {
        setMessage({ text: 'Firestore permission denied. Please update Firebase Security Rules to allow writes for authenticated admins.', type: 'error' });
      } else {
        setMessage({ text: 'Error saving product: ' + err.message, type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
      window.scrollTo(0, 0);
    }
  };

  const inputClass = "w-full border border-black/10 py-3 px-4 bg-transparent focus:outline-none focus:border-black transition-colors rounded-none text-[#141414] font-medium placeholder-[#141414]/30";
  const labelClass = "block text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/50 mb-2";

  const currentSubCategories = CATEGORIES[formData.mainCategory as keyof typeof CATEGORIES] || [];

  return (
    <div className="pt-32 pb-24 px-4 md:px-10 max-w-[1200px] mx-auto min-h-screen">
      <div className="mb-12 border-b border-black/5 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tighter mb-2">Admin Portal</h1>
          <p className="opacity-50 text-[11px] font-bold uppercase tracking-widest leading-tight">Manage Store Data</p>
        </div>
        <div className="flex bg-white border border-black/10 p-1 flex-wrap">
          <button 
            onClick={() => setActiveTab('manageProducts')}
            className={`flex items-center gap-2 px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'manageProducts' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
          >
            <Package size={14} /> Products
          </button>
          <button 
            onClick={() => { setActiveTab('addProduct'); setEditingProductId(null); clearForm(); }}
            className={`flex items-center gap-2 px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'addProduct' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
          >
            <PlusCircle size={14} /> {editingProductId ? 'Edit Product' : 'Add Product'}
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'orders' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
          >
            <ShoppingBag size={14} /> Orders
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'analytics' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
          >
            <Activity size={14} /> Analytics
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'settings' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
          >
            <Settings size={14} /> Settings
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'manageProducts' && (
          <motion.div 
            key="manageProducts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-black/5"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#141414] text-white uppercase text-[10px] tracking-widest font-bold">
                  <tr>
                    <th className="px-6 py-4">Image</th>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 font-medium">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-12 h-16 bg-zinc-100 flex-shrink-0">
                          {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[11px] uppercase tracking-widest">{product.name}</td>
                      <td className="px-6 py-4 font-bold">{formatNPR(product.price)}</td>
                      <td className="px-6 py-4 text-[10px] uppercase tracking-widest opacity-50">{product.category}</td>
                      <td className="px-6 py-4 flex items-center gap-4">
                        <button onClick={() => handleEditProduct(product)} className="text-black font-bold uppercase tracking-widest text-[10px] hover:opacity-50 transition-opacity flex items-center gap-1">
                          <Edit size={12} /> Edit
                        </button>
                        <button onClick={() => deleteProduct(product.id)} className="text-red-500 font-bold uppercase tracking-widest text-[10px] hover:opacity-50 transition-opacity">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[11px] font-bold uppercase tracking-widest opacity-50">No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'addProduct' && (
          <motion.form 
            key="addProduct"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleSubmit} 
            className="space-y-8 bg-white p-6 md:p-12 border border-black/5"
          >
            {message && (
              <div className={`p-4 font-bold text-sm text-center uppercase tracking-widest ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-[#141414] text-white'}`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>Product Name</label>
                <input required type="text" className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Backstreet Hoodie" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Price (NPR)</label>
                  <input required type="number" className={inputClass} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="e.g. 4500" />
                </div>
                <div>
                  <label className={labelClass}>Original Price (Optional)</label>
                  <input type="number" className={inputClass} value={formData.oldPrice} onChange={e => setFormData({...formData, oldPrice: e.target.value})} placeholder="e.g. 5500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>Main Category</label>
                <select required className={inputClass} value={formData.mainCategory} onChange={e => setFormData({...formData, mainCategory: e.target.value as any, subCategory: ''})}>
                  {MAIN_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Sub Category</label>
                <select required={currentSubCategories.length > 0} disabled={currentSubCategories.length === 0} className={inputClass} value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})}>
                  <option value="">Select Subcategory...</option>
                  {currentSubCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>Colour (comma separated)</label>
                <input type="text" className={inputClass} value={formData.colour} onChange={e => setFormData({...formData, colour: e.target.value})} placeholder="e.g. Vintage Wash Black, Navy Blue" />
              </div>
              <div>
                 <label className={labelClass}>Available Sizes</label>
                 <div className="flex gap-4">
                   {AVAILABLE_SIZES.map(size => (
                     <button 
                       type="button"
                       key={size}
                       onClick={() => handleSizeToggle(size)}
                       className={`w-12 h-12 flex items-center justify-center font-bold text-[11px] uppercase tracking-widest border transition-colors ${selectedSizes.includes(size) ? 'bg-black text-white border-black' : 'bg-transparent text-[#141414] border-black/10 hover:border-black'}`}
                     >
                       {size}
                     </button>
                   ))}
                 </div>
              </div>
            </div>
            
            <div>
               <label className={labelClass}>Product Flags</label>
               <div className="flex flex-wrap gap-4">
                 {(Object.keys(productFlags) as Array<keyof typeof productFlags>).map(flag => (
                   <label key={flag} className="flex items-center gap-2 cursor-pointer p-3 border border-black/10 hover:bg-black/5 transition-colors">
                     <input 
                       type="checkbox" 
                       checked={productFlags[flag]} 
                       onChange={() => handleFlagToggle(flag)}
                       className="w-4 h-4 accent-black"
                     />
                     <span className="text-[11px] font-bold uppercase tracking-widest leading-none">
                       {String(flag).replace('is', '') || String(flag)}
                     </span>
                   </label>
                 ))}
               </div>
            </div>

            <div>
              <label className={labelClass}>Images</label>
              <div className="border-2 border-dashed border-black/20 p-8 text-center hover:bg-black/5 transition-colors cursor-pointer relative mb-4">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="opacity-50" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Click or drag images to upload</span>
                </div>
              </div>
              
              {imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                  {imagePreviewUrls.map((url, i) => (
                    <div key={i} className="relative aspect-[3/4] bg-zinc-100 group overflow-hidden">
                      <img src={url} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea required rows={4} className={inputClass} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Product details..."></textarea>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-[#141414] text-white py-5 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors disabled:opacity-50">
              {isSubmitting ? 'Uploading Product...' : 'Upload Product'}
            </button>
          </motion.form>
        )}

        {activeTab === 'orders' && (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-black/5"
          >
            {loadingOrders ? (
              <div className="p-12 text-center text-sm font-bold uppercase tracking-widest">Loading Orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-sm font-bold uppercase tracking-widest opacity-50">No orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#141414] text-white uppercase text-[10px] tracking-widest font-bold">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 font-medium">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 text-[11px] uppercase tracking-widest">{order.id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 opacity-70">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </td>
                        <td className="px-6 py-4">
                          <div>{order.shippingDetails?.firstName} {order.shippingDetails?.lastName}</div>
                          <div className="text-[10px] opacity-50">{order.shippingDetails?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold">{formatNPR(order.totalAmount || 0)}</div>
                          {order.receiptUrl && (
                            <a href={order.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline uppercase tracking-wide">View Receipt</a>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-[9px] uppercase tracking-wider font-bold ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex items-center gap-2">
                          <select 
                            value={order.status || 'pending'} 
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="bg-transparent border border-black/10 py-1 px-2 text-[11px] font-bold uppercase tracking-widest outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button onClick={() => deleteOrder(order.id)} className="text-red-500 font-bold uppercase tracking-widest text-[10px] hover:text-red-700 p-2">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-black/5"
          >
            <AnalyticsTab />
          </motion.div>
        )}
        {activeTab === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-black/5 p-6 md:p-12 max-w-2xl"
          >
            <h2 className="text-2xl font-heading font-black uppercase tracking-tighter mb-8">Store Settings</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Website Logo</h3>
                <div className="border border-black/10 p-6 bg-[#FAFAFA] flex flex-col items-center">
                  <div className="w-48 h-16 bg-white border border-black/10 flex flex-col items-center justify-center mb-6 relative overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} className="w-full h-full object-contain" alt="Logo" />
                    ) : (
                      <div className="text-[10px] font-bold uppercase tracking-widest text-black/30 text-center px-4">
                        No Logo Uploaded
                      </div>
                    )}
                    {settingsLoading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Uploading...</span>
                      </div>
                    )}
                  </div>
                  
                  <label className="cursor-pointer bg-white border border-black text-black px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-black/5 transition-colors">
                    Upload New Logo
                    <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" disabled={settingsLoading} />
                  </label>
                  <p className="mt-4 text-[10px] text-center text-black/50 font-medium">This logo will appear in the navigation bar.</p>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Notification Sound</h3>
                <div className="border border-black/10 p-6 bg-[#FAFAFA] flex flex-col items-center">
                  <div className="w-full bg-white border border-black/10 p-4 flex flex-col items-center justify-center mb-6 relative overflow-hidden">
                    {notificationSoundUrl ? (
                      <audio controls src={notificationSoundUrl} className="w-full max-w-sm" />
                    ) : (
                      <div className="text-[10px] font-bold uppercase tracking-widest text-black/30 text-center px-4 py-3">
                        Default Sound Active
                      </div>
                    )}
                    {settingsLoading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Uploading...</span>
                      </div>
                    )}
                  </div>
                  
                  <label className="cursor-pointer bg-white border border-black text-black px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-black/5 transition-colors">
                    Upload New Sound
                    <input type="file" accept="audio/*" onChange={handleUploadSound} className="hidden" disabled={settingsLoading} />
                  </label>
                  <p className="mt-4 text-[10px] text-center text-black/50 font-medium">This sound plays when a new order is placed.</p>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Payment QR Code</h3>
                <div className="border border-black/10 p-6 bg-[#FAFAFA] flex flex-col items-center">
                  <div className="w-48 h-48 bg-white border border-black/10 flex flex-col items-center justify-center mb-6 relative overflow-hidden">
                    {storeQrCodeUrl ? (
                      <img src={storeQrCodeUrl} className="w-full h-full object-cover" alt="QR" />
                    ) : (
                      <div className="text-[10px] font-bold uppercase tracking-widest text-black/30 text-center px-4">
                        No QR Code Uploaded
                      </div>
                    )}
                    {settingsLoading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Uploading...</span>
                      </div>
                    )}
                  </div>
                  
                  <label className="cursor-pointer bg-black text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">
                    Upload New QR Code
                    <input type="file" accept="image/*" onChange={handleUploadQrCode} className="hidden" disabled={settingsLoading} />
                  </label>
                  <p className="mt-4 text-[10px] text-center text-black/50 font-medium">This QR code will be shown at checkout for bank transfers.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

