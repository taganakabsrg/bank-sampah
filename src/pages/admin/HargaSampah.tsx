import React, { useState, useEffect } from 'react';
import { db, HargaSampah as HargaSampahType } from '../../lib/mockDb';
import { firestoreService } from '../../lib/firestoreService';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import PasswordVerificationModal from '../../components/PasswordVerificationModal';

export default function HargaSampah() {
  const [harga, setHarga] = useState<HargaSampahType[]>([]);
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);

  // Verification State
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<HargaSampahType> | null>(null);

  useEffect(() => {
    const fetchHarga = async () => {
      const data = await db.getHargaSampah();
      setHarga(data);
    };
    fetchHarga();
  }, [refresh]);

  const handleEdit = (item: HargaSampahType) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem({
      code: `S${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'Plastik',
      pricePerKg: 0
    });
    setIsEditModalOpen(true);
  };

  const saveHarga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Remove id from data body
    const { id, ...rest } = editingItem as any;
    const dataToSave = {
      ...rest,
      lastUpdate: new Date().toISOString(),
    };

    try {
      if (id) {
        await firestoreService.updateDocument('hargaSampah', id, dataToSave);
      } else {
        await firestoreService.createDocument('hargaSampah', dataToSave.code, dataToSave);
      }
      setIsEditModalOpen(false);
      setRefresh(r => r + 1);
    } catch (error) {
      console.error('Error saving harga:', error);
      alert('Gagal menyimpan data. Pastikan semua field terisi dengan benar.');
    }
  };

  const deleteHarga = (id: string, name: string) => {
    setPendingId(id);
    setPendingName(name);
    setIsVerifyOpen(true);
  };

  const handleVerifiedDelete = async () => {
    if (pendingId) {
      await firestoreService.deleteDocument('hargaSampah', pendingId);
      setRefresh(r => r + 1);
      setIsVerifyOpen(false);
      setPendingId(null);
      setPendingName(null);
    }
  };

  const filteredData = harga.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    h.category.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Cari jenis atau kategori sampah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center justify-center px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition xl:w-auto w-full shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Harga
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Kode</th>
              <th className="px-6 py-4 font-semibold">Nama Sampah</th>
              <th className="px-6 py-4 font-semibold">Kategori</th>
              <th className="px-6 py-4 font-semibold">Harga / Kg</th>
              <th className="px-6 py-4 font-semibold">Terakhir Update</th>
              <th className="px-6 py-4 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map(h => (
                <tr key={h.id} className="bg-white border-b border-slate-50 hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">{h.code}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{h.name}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{h.category}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600 font-mono tracking-tight">{formatCurrency(h.pricePerKg)}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm font-medium">{new Date(h.lastUpdate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(h)}
                        className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteHarga(h.id, h.name)}
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
                  Tidak ada data harga sampah ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PasswordVerificationModal 
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        onVerified={handleVerifiedDelete}
        title="Hapus Data Sampah"
        description={`Konfirmasi penghapusan data ${pendingName}. Tindakan ini sensitif dan tidak dapat dibatalkan.`}
      />

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">
                {editingItem?.id ? 'Edit Harga Sampah' : 'Tambah Harga Sampah'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={saveHarga} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kode Sampah</label>
                <input 
                  type="text" 
                  value={editingItem?.code || ''} 
                  onChange={e => setEditingItem(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Sampah</label>
                <input 
                  type="text" 
                  value={editingItem?.name || ''} 
                  onChange={e => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kategori</label>
                <select 
                  value={editingItem?.category || 'Plastik'} 
                  onChange={e => setEditingItem(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Plastik">Plastik</option>
                  <option value="Kertas">Kertas</option>
                  <option value="Logam">Logam</option>
                  <option value="Kaca">Kaca</option>
                  <option value="Elektronik">Elektronik</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Harga / Kg</label>
                <input 
                  type="number" 
                  value={editingItem?.pricePerKg || ''} 
                  onChange={e => setEditingItem(prev => ({ ...prev, pricePerKg: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  min="0"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 shadow-sm transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
