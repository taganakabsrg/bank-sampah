import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firestoreService } from '../lib/firestoreService';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Determine Role (Bootstrap admin if email matches)
      const isAdminEmail = formData.email === 'taganakabsrg@gmail.com';
      const role = isAdminEmail ? 'admin' : 'nasabah';
      const isActive = isAdminEmail; // Admins are active by default

      // 3. Create User Profile in Firestore
      await firestoreService.createDocument('users', user.uid, {
        name: formData.name,
        email: formData.email,
        address: formData.address,
        phone: formData.phone,
        role: role,
        balance: 0,
        joinDate: new Date().toISOString(),
        isActive: isActive,
      });

      if (isAdminEmail) {
        setSuccess('Pendaftaran Admin berhasil! Anda sekarang dapat masuk.');
      } else {
        setSuccess('Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Admin.');
      }
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email sudah terdaftar.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Pendaftaran dengan Email/Password belum diaktifkan oleh pemilik proyek di Firebase Console. Silakan gunakan Google Login untuk mendaftar.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Koneksi internet terganggu atau diblokir. Pastikan koneksi stabil dan matikan Ad-Blocker jika ada.');
      } else {
        setError('Terjadi kesalahan saat pendaftaran: ' + err.message);
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
          Daftar Nasabah Baru
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Mari wujudkan lingkungan bersih bersama kami
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-12 border border-slate-100">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              <b>Informasi Pendaftaran:</b> Pendaftaran dengan Email/Password belum diaktifkan oleh pemilik proyek di Firebase Console. Silakan gunakan <b>Google Login</b> untuk mendaftar.
            </p>
          </div>

          <div className="mb-8">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 border border-slate-300 rounded-2xl shadow-sm text-base font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all font-sans ring-1 ring-slate-200"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 mr-3" alt="Google" />
              Daftar dengan Google
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400 font-medium">
                Atau (Pendaftaran Manual)
              </span>
            </div>
          </div>

          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-md text-center">
              {success}
              <p className="text-sm mt-2">Mengarahkan ke halaman login...</p>
            </div>
          ) : (
            <form className="space-y-4 opacity-60 pointer-events-none select-none grayscale" onSubmit={handleRegister}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
                <input
                  type="text"
                  disabled
                  placeholder="Gunakan Google Login"
                  className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-slate-50 cursor-not-allowed sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Email (Terkunci)</label>
                <input
                  type="email"
                  disabled
                  placeholder="Gunakan Google Login"
                  className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-slate-50 cursor-not-allowed sm:text-sm"
                />
              </div>

              <div>
                <button
                   type="submit"
                   disabled
                   className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-400 cursor-not-allowed mt-2"
                 >
                   Daftar
                 </button>
               </div>
            </form>
          )}

          <div className="mt-8 text-center text-sm">
            <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
              Sudah punya akun? Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
