import React, { useState, useEffect } from 'react';
import { db, User, UserSession } from '../../lib/mockDb';
import { firestoreService } from '../../lib/firestoreService';
import { Save, UserCircle, Eye, EyeOff, Shield, Smartphone, Globe, Trash2 } from 'lucide-react';
import PasswordVerificationModal from '../../components/PasswordVerificationModal';
import { useAuth } from '../../contexts/AuthContext';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db as firestore } from '../../lib/firebase';

export default function AdminProfil() {
  const { userProfile, refreshProfile } = useAuth();
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Session states
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setPhone(userProfile.phone);
      setAddress(userProfile.address);
      setPassword(userProfile.password || '');
      
      // Load sessions
      const fetchSessions = async () => {
        const allSessions = await db.getSessions();
        setSessions(allSessions.filter(s => s.userId === userProfile.id));
      };
      fetchSessions();
    }
  }, [userProfile]);

  const handleRevokeSession = (sessionId: string) => {
    setPendingSessionId(sessionId);
    setIsVerifyOpen(true);
  };

  const confirmRevoke = async () => {
    if (pendingSessionId && userProfile) {
      await firestoreService.deleteDocument('sessions', pendingSessionId);
      const allSessions = await db.getSessions();
      setSessions(allSessions.filter(s => s.userId === userProfile.id));
      setIsVerifyOpen(false);
      setPendingSessionId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setLoading(true);
    try {
      const userRef = doc(firestore, 'users', userProfile.id);
      await updateDoc(userRef, {
        name,
        phone,
        address,
        password,
        updatedAt: serverTimestamp()
      });

      await refreshProfile();
      setSuccess('Profil berhasil diperbarui!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Profile update failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
              <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                <UserCircle className="w-16 h-16" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-6 px-8 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">{userProfile.name}</h2>
          <p className="text-slate-600 font-medium capitalize">{userProfile.role} Aktif</p>
          <p className="text-sm text-gray-500 mt-1">Bergabung sejak {new Date(userProfile.joinDate).toLocaleDateString('id-ID')}</p>
        </div>

        <div className="p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Edit Profil Admin</h3>
          
          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-sm bg-opacity-50">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-xs text-gray-400 font-normal">(Tidak dapat diubah)</span></label>
              <input
                type="email"
                disabled
                value={userProfile.email}
                className="block w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg shadow-sm text-gray-500 sm:text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. HP (WhatsApp)</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                rows={3}
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ganti Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center justify-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                   <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security Section: Connected Devices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6 mb-8">
        <div className="p-6 border-b border-gray-50 flex items-center space-x-2">
          <Shield className="text-slate-800" size={20} />
          <h3 className="font-bold text-gray-900">Keamanan Perangkat Admin</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-6">
            Daftar perangkat yang baru saja mengakses Dashboard Admin. 
            Segera hapus sesi jika terdapat aktivitas mencurigakan.
          </p>

          <div className="space-y-4">
            {sessions.length === 0 ? (
              <p className="text-center py-4 text-gray-400 text-sm">Tidak ada riwayat perangkat.</p>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`flex items-center justify-between p-4 rounded-xl border ${session.isCurrent ? 'bg-slate-50 border-slate-200' : 'bg-gray-50 border-gray-100'}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${session.isCurrent ? 'bg-slate-800 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-gray-800">{session.deviceName}</p>
                        {session.isCurrent && (
                          <span className="bg-slate-200 text-slate-800 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                            Sesi Ini
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 space-x-3 mt-1">
                        <span className="flex items-center">
                          <Globe size={12} className="mr-1" /> {session.browser}
                        </span>
                        <span>•</span>
                        <span>IP: {session.ip}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold tracking-wider">
                        Terakhir aktif: {formatDate(session.lastActive)}
                      </p>
                    </div>
                  </div>
                  
                  {!session.isCurrent && (
                    <button 
                      onClick={() => handleRevokeSession(session.id)}
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Hapus Perangkat"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <PasswordVerificationModal 
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        onVerified={confirmRevoke}
        title="Cabut Akses Perangkat"
        description="Apakah Anda yakin ingin mematikan sesi ini? Perangkat tersebut harus login kembali untuk mengakses Dashboard Admin."
      />
    </div>
  );
}
