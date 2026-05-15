import React, { useState, useEffect } from 'react';
import { firestoreService } from '../../lib/firestoreService';
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle, X } from 'lucide-react';
import PasswordVerificationModal from '../../components/PasswordVerificationModal';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'nasabah';
  balance: number;
  joinDate: string;
  isActive: boolean;
  phone?: string;
  address?: string;
}

export default function DataNasabah() {
  const [nasabah, setNasabah] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Use state to trigger re-renders 
  const [refresh, setRefresh] = useState(0);

  // Security Verification State
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string | null>(null);

  // Add Nasabah State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: ''
  });

  useEffect(() => {
    const fetchNasabah = async () => {
      setLoading(true);
      try {
        const users = await firestoreService.getCollection<User>('users');
        setNasabah(users.filter(u => u.role === 'nasabah'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNasabah();
  }, [refresh]);

  const toggleStatus = async (id: string) => {
    const targetUser = nasabah.find(u => u.id === id);
    if (targetUser) {
      await firestoreService.updateDocument('users', id, { isActive: !targetUser.isActive });
      setRefresh(r => r + 1);
    }
  };

  const deleteNasabah = (id: string, name: string) => {
    setPendingDeleteId(id);
    setPendingDeleteName(name);
    setIsVerifyOpen(true);
  };

  const handleVerifiedDelete = async () => {
    if (pendingDeleteId) {
      await firestoreService.deleteDocument('users', pendingDeleteId);
      setRefresh(r => r + 1);
      setIsVerifyOpen(false);
      setPendingDeleteId(null);
      setPendingDeleteName(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if email already exists in our fetched list
    if (nasabah.find(u => u.email === formData.email)) {
      alert('Email sudah terdaftar!');
      return;
    }

    const newId = `NSB-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    try {
      await firestoreService.createDocument('users', newId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: 'nasabah',
        balance: 0,
        joinDate: new Date().toISOString(),
        isActive: true, // Auto active if added by admin
      });

      setRefresh(r => r + 1);
      setIsAddOpen(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
    } catch (err: any) {
      console.error(err);
      alert('Gagal menambah nasabah. Periksa koneksi atau permissions.');
    }
  };

  const filteredData = nasabah.filter(n => 
    n.name.toLowerCase().includes(search.toLowerCase()) || 
    n.id.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-slate-800 shadow-sm transition-shadow hover:shadow-md"
            placeholder="Cari nama atau ID nasabah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition xl:w-auto w-full shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Nasabah
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">ID</th>
              <th className="px-6 py-4 font-semibold">Nasabah</th>
              <th className="px-6 py-4 font-semibold">Kontak</th>
              <th className="px-6 py-4 font-semibold">Saldo</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map(n => (
                <tr key={n.id} className="bg-white border-b border-slate-50 hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">{n.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{n.name}</div>
                    <div className="text-slate-400 text-xs font-medium mt-0.5">{new Date(n.joinDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700 text-sm font-medium">{n.phone}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{n.email}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600 font-mono tracking-tight">
                    {formatCurrency(n.balance)}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(n.id)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${n.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                    >
                      {n.isActive ? <CheckCircle className="w-3.5 h-3.5 mr-1.5"/> : <XCircle className="w-3.5 h-3.5 mr-1.5"/>}
                      {n.isActive ? 'Aktif' : 'Pending'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteNasabah(n.id, n.name)}
                        className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada data nasabah ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Nasabah Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">Tambah Nasabah Baru</h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Masukkan nama nasabah"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="email@contoh.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. Handphone (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="0812xxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    rows={3}
                    placeholder="Detail alamat nasabah..."
                  />
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    <b>Catatan Ketentuan Login:</b><br/>
                    Karena metode Email/Password dibatasi oleh sistem, nasabah yang Anda tambahkan harus login menggunakan <b>Google Login</b> dengan email yang sama ({formData.email || '...'}) untuk dapat mengakses akun mereka.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                >
                  Simpan Nasabah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <PasswordVerificationModal 
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        onVerified={handleVerifiedDelete}
        title="Hapus Nasabah"
        description={`Konfirmasi penghapusan nasabah ${pendingDeleteName}. Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}
