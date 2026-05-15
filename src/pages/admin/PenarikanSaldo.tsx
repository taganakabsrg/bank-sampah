import { useState, useEffect } from 'react';
import { db as asyncDb, User, Penarikan } from '../../lib/mockDb';
import { CheckCircle, XCircle, Printer } from 'lucide-react';
import Receipt from '../../components/Receipt';
import PasswordVerificationModal from '../../components/PasswordVerificationModal';
import { runTransaction, doc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../lib/firebase';

export default function PenarikanSaldo() {
  const [penarikan, setPenarikan] = useState<Penarikan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [refresh, setRefresh] = useState(0);

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Verification State
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [verifyDetails, setVerifyDetails] = useState({ title: '', desc: '' });

  useEffect(() => {
    const fetchData = async () => {
      const pData = await asyncDb.getPenarikan();
      const uData = await asyncDb.getUsers();
      
      setUsers(uData);

      const sorted = pData.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setPenarikan(sorted);
    };
    fetchData();
  }, [refresh]);

  const showReceiptModal = (p: Penarikan, u: User) => {
    setReceiptData({
      type: 'Penarikan Saldo',
      transactionId: p.id,
      date: p.date,
      entityName: u.name,
      entityId: u.id,
      items: [
        { label: 'Metode Penarikan', value: p.method },
        { label: 'Keterangan', value: p.notes || '-' }
      ],
      total: p.amount,
      status: p.status === 'approved' ? 'Berhasil' : p.status === 'pending' ? 'Pending' : 'Ditolak'
    });
    setShowReceipt(true);
  };

  const handleApprove = (id: string, userId: string, amount: number) => {
    setVerifyDetails({
      title: 'Setujui Penarikan',
      desc: `Akan menyetujui penarikan sebesar ${formatCurrency(amount)}. Tindakan ini akan memotong saldo nasabah secara permanen.`
    });
    setPendingAction(() => async () => {
      try {
        await runTransaction(firestore, async (transaction) => {
          const userRef = doc(firestore, 'users', userId);
          const pRef = doc(firestore, 'penarikan', id);

          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) throw "Nasabah tidak ditemukan!";

          const userData = userSnap.data() as User;
          if ((userData.balance || 0) < amount) throw "Saldo nasabah tidak mencukupi!";

          transaction.update(userRef, {
            balance: (userData.balance || 0) - amount,
            updatedAt: serverTimestamp()
          });

          transaction.update(pRef, {
            status: 'approved',
            updatedAt: serverTimestamp()
          });
        });
        
        setRefresh(r => r + 1);
      } catch (err) {
        console.error("Approval failed:", err);
        alert(err instanceof Error ? err.message : String(err));
      }
      setIsVerifyOpen(false);
    });
    setIsVerifyOpen(true);
  };

  const handleReject = (id: string) => {
    setVerifyDetails({
      title: 'Tolak Penarikan',
      desc: 'Konfirmasi penolakan permintaan penarikan saldo ini.'
    });
    setPendingAction(() => async () => {
      try {
        const pRef = doc(firestore, 'penarikan', id);
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(pRef, {
          status: 'rejected',
          updatedAt: serverTimestamp()
        });
        setRefresh(r => r + 1);
      } catch (err) {
        console.error("Rejection failed:", err);
      }
      setIsVerifyOpen(false);
    });
    setIsVerifyOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800">Permintaan Penarikan Saldo</h2>
        <p className="text-sm text-gray-500 mt-1">Kelola request penarikan saldo dari nasabah</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-4">ID Transaksi</th>
              <th className="px-6 py-4">Nasabah</th>
              <th className="px-6 py-4">Nominal</th>
              <th className="px-6 py-4">Metode</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {penarikan.length > 0 ? (
              penarikan.map(p => {
                const nasabah = users.find(u => u.id === p.userId);
                return (
                  <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{nasabah?.name || 'Unknown'}</div>
                      <div className="text-gray-500 text-xs">{new Date(p.date).toLocaleString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(p.amount)}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 capitalize">{p.method}</div>
                      <div className="text-gray-500 text-xs truncate max-w-xs">{p.notes}</div>
                    </td>
                    <td className="px-6 py-4">
                      {p.status === 'pending' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>}
                      {p.status === 'approved' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Selesai</span>}
                      {p.status === 'rejected' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Ditolak</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.status === 'pending' ? (
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleApprove(p.id, p.userId, p.amount)}
                            className="inline-flex py-1.5 px-3 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                          </button>
                          <button 
                            onClick={() => handleReject(p.id)}
                            className="inline-flex py-1.5 px-3 rounded-md text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                           <button 
                            onClick={() => nasabah && showReceiptModal(p, nasabah)}
                            className="inline-flex py-1.5 px-3 rounded-md text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <Printer className="w-4 h-4 mr-1" /> Struk
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada data penarikan saldo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showReceipt && receiptData && (
        <Receipt 
          {...receiptData} 
          onClose={() => setShowReceipt(false)} 
        />
      )}

      <PasswordVerificationModal 
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        onVerified={() => pendingAction && pendingAction()}
        title={verifyDetails.title}
        description={verifyDetails.desc}
      />
    </div>
  );
}
