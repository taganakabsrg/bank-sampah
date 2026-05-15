import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firestoreService } from '../lib/firestoreService';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const reason = queryParams.get('reason');
  const isTimeout = reason === 'timeout';
  const isRevoked = reason === 'revoked';
  const isInactive = reason === 'inactive';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Fetch User Profile from Firestore
      const profile = await firestoreService.getDocument<any>('users', user.uid);
      
      if (!profile) {
        setError('Profil pengguna tidak ditemukan.');
        await auth.signOut();
        return;
      }

      if (!profile.isActive) {
        setError('Akun Anda belum diaktifkan oleh admin.');
        await auth.signOut();
        return;
      }

      // 3. Record Session (Simplified for now)
      await firestoreService.createDocument('sessions', `${user.uid}_${Date.now()}`, {
        userId: user.uid,
        deviceName: navigator.platform,
        browser: 'Global Browser',
        ip: '0.0.0.0',
        loginDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isCurrent: true
      });

      // 4. Navigate based on role
      if (profile.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/nasabah');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email atau password salah.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan login. Akun dikunci sementara.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Metode login Email/Password belum diaktifkan oleh pemilik proyek di Firebase Console. Silakan gunakan Google Login.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Koneksi internet terganggu atau diblokir. Pastikan koneksi stabil dan matikan Ad-Blocker jika ada.');
      } else {
        setError('Terjadi kesalahan saat masuk: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      
      // Refetch profile since loginWithGoogle might have just created it
      // Actually AuthContext onAuthStateChanged will trigger and update userProfile
      // But we need to know where to navigate
      const user = auth.currentUser;
      if (user) {
        const profile = await firestoreService.getDocument<any>('users', user.uid);
        if (profile) {
          if (profile.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/nasabah');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login dibatalkan.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Metode login Google belum diaktifkan di Firebase Console. Silakan ke menu Authentication > Sign-in method dan aktifkan Google.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Koneksi internet terganggu atau diblokir. Pastikan koneksi stabil dan matikan Ad-Blocker jika ada.');
      } else {
        setError('Terjadi kesalahan saat masuk dengan Google: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-emerald-500 bg-emerald-100 w-20 h-20 rounded-full items-center mx-auto shadow-sm">
          <Leaf className="w-10 h-10" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-800">
          Bank Sampah
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Masuk ke akun Anda
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-12 border border-slate-100">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              <b>Informasi Login:</b> Pemilik proyek belum mengaktifkan metode Email/Password di Firebase Console. Silakan gunakan <b>Google Login</b> untuk masuk.
            </p>
          </div>

          <div className="mb-8">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 border border-slate-300 rounded-2xl shadow-sm text-base font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all font-sans ring-1 ring-slate-200"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 mr-3" alt="Google" />
              Masuk dengan Google
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400 font-medium">
                Atau (Login Manual)
              </span>
            </div>
          </div>

          <form className="space-y-6 opacity-60 pointer-events-none select-none grayscale" onSubmit={handleLogin}>
            {isTimeout && !error && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm p-3 rounded-md mb-4">
                Sesi Anda berakhir karena tidak ada aktivitas. Silakan login kembali.
              </div>
            )}
            {isRevoked && !error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-md mb-4">
                Sesi perangkat ini telah dicabut atau dikeluarkan. Silakan login kembali untuk melanjutkan.
              </div>
            )}
            {isInactive && !error && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm p-3 rounded-md mb-4">
                Akun Anda belum aktif. Silakan hubungi admin atau tunggu proses aktivasi.
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email (Terkunci)
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  disabled
                  placeholder="Gunakan Google Login"
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-slate-50 cursor-not-allowed sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  type="password"
                  disabled
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-slate-50 cursor-not-allowed sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-400 cursor-not-allowed"
              >
                Masuk
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500 font-medium">
                  Belum punya akun?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="w-full flex justify-center py-3.5 px-4 border border-emerald-200 rounded-xl shadow-sm text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                Daftar Sekarang
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
