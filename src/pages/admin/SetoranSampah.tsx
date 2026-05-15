import React, { useState, useEffect } from 'react';
import { db as asyncDb, User, HargaSampah } from '../../lib/mockDb';
import { Save } from 'lucide-react';
import Receipt from '../../components/Receipt';
import { runTransaction, doc, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import { db as firestore } from '../../lib/firebase';

export default function SetoranSampah() {
  const [users, setUsers] = useState<User[]>([]);
  const [jenisSampah, setJenisSampah] = useState<HargaSampah[]>([]);
  
  const [userId, setUserId] = useState('');
  const [sampahId, setSampahId] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const allUsers = await asyncDb.getUsers();
      const prices = await asyncDb.getHargaSampah();
      setUsers(allUsers.filter(u => u.role === 'nasabah' && u.isActive));
      setJenisSampah(prices);
    };
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const selectedSampah = jenisSampah.find(s => s.id === sampahId);
  const subtotal = selectedSampah && weight ? selectedSampah.pricePerKg * parseFloat(weight) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !sampahId || !weight || parseFloat(weight) <= 0 || !selectedSampah) return;

    setLoading(true);

    try {
      const trxId = `TRX-${Date.now()}`;
      const now = new Date().toISOString();

      await runTransaction(firestore, async (transaction) => {
        // 1. Get User Profile
        const userRef = doc(firestore, 'users', userId);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) {
          throw "User does not exist!";
        }

        const userData = userSnap.data() as User;
        const newBalance = (userData.balance || 0) + subtotal;

        // 2. Create Setoran Record
        const setoranRef = doc(firestore, 'setoran', trxId);
        transaction.set(setoranRef, {
          userId,
          sampahId,
          weight: parseFloat(weight),
          pricePerKg: selectedSampah.pricePerKg,
          subtotal,
          date: now,
          createdAt: serverTimestamp()
        });

        // 3. Update User Balance
        transaction.update(userRef, {
          balance: newBalance,
          updatedAt: serverTimestamp()
        });

        setReceiptData({
          type: 'Setoran Sampah',
          transactionId: trxId,
          date: now,
          entityName: userData.name,
          entityId: userId,
          items: [
            { label: 'Jenis Sampah', value: selectedSampah.name },
            { label: 'Harga / Kg', value: formatCurrency(selectedSampah.pricePerKg) },
            { label: 'Berat', value: `${weight} Kg` }
          ],
          total: subtotal
        });
      });

      setShowReceipt(true);
      setUserId('');
      setSampahId('');
      setWeight('');
    } catch (err) {
      console.error("Transaction failed: ", err);
      alert("Gagal menyimpan setoran. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Input Setoran Sampah Baru</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Nasabah (Aktif)</label>
            <select
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            >
              <option value="">-- Pilih Nasabah --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.id} - {u.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Jenis Sampah</label>
              <select
                required
                value={sampahId}
                onChange={(e) => setSampahId(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">-- Pilih Jenis Sampah --</option>
                {jenisSampah.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.pricePerKg)}/Kg)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Berat (Kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Contoh: 1.5"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Harga per Kg</span>
              <span className="font-semibold text-gray-900">{formatCurrency(selectedSampah?.pricePerKg || 0)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">Total Saldo Masuk</span>
              <span className="text-2xl font-bold text-emerald-600">{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Menyimpan...' : 'Simpan Setoran'}
          </button>
        </form>
      </div>

      {showReceipt && receiptData && (
        <Receipt 
          {...receiptData} 
          onClose={() => {
            setShowReceipt(false);
            setReceiptData(null);
          }} 
        />
      )}
    </div>
  );
}
