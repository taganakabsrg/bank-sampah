import { useState, useEffect } from 'react';
import { db } from '../../lib/mockDb';
import { Download, Printer } from 'lucide-react';

export default function Laporan() {
  const [stats, setStats] = useState({
    totalSetoran: 0,
    totalPenarikan: 0,
    totalPenjualan: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      const setoran = await db.getSetoran();
      const penarikan = await db.getPenarikan();
      const penjualan = await db.getPenjualan();

      const totalSetoran = setoran.reduce((sum, s) => sum + s.subtotal, 0);
      const totalPenarikan = penarikan.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);
      const totalPenjualan = penjualan.reduce((sum, p) => sum + p.total, 0);

      setStats({ totalSetoran, totalPenarikan, totalPenjualan });
    };
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const SummaryCard = ({ title, value, type }: { title: string, value: string, type: 'in' | 'out' | 'neutral' }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <p className={`text-2xl font-bold ${type === 'in' ? 'text-emerald-600' : type === 'out' ? 'text-red-500' : 'text-indigo-600'}`}>
        {value}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Summary Laporan Bulan Ini</h2>
          <p className="text-sm text-gray-500">Ringkasan transaksi bank sampah</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          <button className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title="Total Masuk (Setoran Nasabah)" value={formatCurrency(stats.totalSetoran)} type="in" />
        <SummaryCard title="Total Keluar (Penarikan Nasabah)" value={formatCurrency(stats.totalPenarikan)} type="out" />
        <SummaryCard title="Total Pendapatan (Penjualan)" value={formatCurrency(stats.totalPenjualan)} type="neutral" />
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Rekap Aktivitas Terakhir</h3>
        </div>
        <div className="p-8 text-center text-gray-500">
          <p>Fitur detail laporan akan dinamis berdasarkan filter tanggal.</p>
          <div className="mt-4 w-16 h-1 bg-gray-200 mx-auto rounded"></div>
        </div>
      </div>
    </div>
  );
}
