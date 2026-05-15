import React, { useState, useEffect } from 'react';
import { db, Penarikan } from '../../lib/mockDb';
import { firestoreService } from '../../lib/firestoreService';
import { Send, Clock, Printer } from 'lucide-react';
import Receipt from '../../components/Receipt';
import { useAuth } from '../../contexts/AuthContext';
import { serverTimestamp } from 'firebase/firestore';

export default function RequestPenarikan() {
  const { userProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [riwayat, setRiwayat] = useState<Penarikan[]>([]);
  const [refresh, setRefresh] = useState(0);

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    if (userProfile) {
      const fetchData = async () => {
        const myData = await db.getPenarikan(userProfile.id);
        setRiwayat(myData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      };
      fetchData();
    }
  }, [userProfile?.id, refresh]);

  const handleShowReceipt = (p: Penarikan) => {
    if (!userProfile) return;
    setReceiptData({
      type: 'Penarikan Saldo',
      transactionId: p.id,
      date: p.date,
      entityName: userProfile.name,
      entityId: userProfile.id,
      items: [
        { label: 'Metode Penarikan', value: p.method },
        { label: 'Keterangan', value: p.notes || '-' }
      ],
      total: p.amount,
      status: p.status === 'approved' ? 'Berhasil' : p.status === 'pending' ? 'Pending' : 'Ditolak'
    });
    setShowReceipt(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    
    const nominal = parseInt(amount);

    if (nominal < 10000) {
      setError('Minimal penarikan adalah Rp 10.000');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (nominal > userProfile.balance) {
      setError('Saldo tidak mencukupi.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Check if there are active pending requests to prevent spam
    const activePendings = riwayat.filter(r => r.status === 'pending');
    if (activePendings.length > 0) {
      setError('Anda masih memiliki permintaan penarikan yang sedang diproses admin.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    setLoading(true);
    try {
      const prnk = {
        userId: userProfile.id,
        amount: nominal,
        method,
        notes,
        date: new Date().toISOString(),
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await firestoreService.addDocument('penarikan', prnk);

      setSuccess('Permintaan penarikan berhasil dikirim dan menunggu persetujuan admin.');
      setAmount('');
      setMethod('');
      setNotes('');
      setRefresh(r => r + 1);

      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Gagal mengirim permintaan. Silakan coba lagi.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  if (!userProfile) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Tarik Saldo</h2>
            <p className="text-sm text-gray-500 mt-1">Saldo Anda: <span className="font-bold text-emerald-600">{formatCurrency(userProfile.balance)}</span></p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm bg-opacity-50">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Penarikan</label>
              <input
                type="number"
                required
                min="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Minimal Rp 10.000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
              <select
                required
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">-- Pilih Metode --</option>
                <option value="Tunai">Tunai (Ambil di Bank Sampah)</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Gopay">GoPay</option>
                <option value="Ovo">OVO</option>
                <option value="Dana">DANA</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / No. Rekening</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Masukkan nomor rekening/e-wallet jika pilih transfer"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Mengirim...' : 'Kirim Permintaan'}
            </button>
          </form>
        </div>
      </div>

      <div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Status Permintaan Anda</h3>
          
          <div className="space-y-4">
            {riwayat.length > 0 ? (
              riwayat.map(r => (
                <div key={r.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{formatCurrency(r.amount)}</p>
                      <p className="text-xs text-gray-500">Method: {r.method}</p>
                    </div>
                    <div>
                      {r.status === 'pending' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>}
                      {r.status === 'approved' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Selesai</span>}
                      {r.status === 'rejected' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Ditolak</span>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 flex justify-between items-center">
                    <span>Diajukan pada: {new Date(r.date).toLocaleString('id-ID')}</span>
                    {r.status !== 'pending' && (
                      <button 
                        onClick={() => handleShowReceipt(r)}
                        className="inline-flex items-center text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded"
                      >
                        <Printer className="w-3 h-3 mr-1" /> Struk
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8 text-sm">
                Belum ada riwayat penarikan saldo.
              </div>
            )}
          </div>
        </div>
      </div>

      {showReceipt && receiptData && (
        <Receipt 
          {...receiptData} 
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </div>
  );
}
