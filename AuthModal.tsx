import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Phone, MapPin, CheckCircle2, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';
import type { User } from '../types';
import { api, authStorage } from '../api';
import { sound } from '../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register' | 'verify' | 'forgot';
  openEmailSandbox?: () => void;
  noticeMessage?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  openEmailSandbox,
  noticeMessage,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot' | 'reset'>(initialMode);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Verification & reset
  const [verificationCode, setVerificationCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.login({ email, password });
      authStorage.setToken(res.token);
      sound.playSuccess();
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      sound.playAlert();
      if (err.data?.error === 'EMAIL_NOT_VERIFIED') {
        setErrorMsg('Your email is not verified yet. Please enter the verification code.');
        setMode('verify');
      } else {
        setErrorMsg(err.data?.message || err.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.register({
        name,
        email,
        password,
        phone,
        address,
      });
      sound.playSuccess();
      setSuccessMsg(res.message);
      if (res.verificationToken) {
        setVerificationCode(res.verificationToken);
      }
      setMode('verify');
    } catch (err: any) {
      sound.playAlert();
      setErrorMsg(err.data?.error || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Verification
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.verifyEmail({ email, token: verificationCode });
      authStorage.setToken(res.token);
      sound.playSuccess();
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      sound.playAlert();
      setErrorMsg(err.data?.error || err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend
  const handleResend = async () => {
    sound.playClick();
    try {
      const res = await api.resendVerification(email);
      setSuccessMsg('New verification code sent!');
      if (res.verificationToken) {
        setVerificationCode(res.verificationToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.forgotPassword(email);
      sound.playSuccess();
      setSuccessMsg(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setMode('reset');
    } catch (err: any) {
      sound.playAlert();
      setErrorMsg(err.data?.message || err.message || 'Failed to dispatch password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.resetPassword({ token: resetToken, newPassword });
      sound.playSuccess();
      setSuccessMsg(res.message);
      setMode('login');
    } catch (err: any) {
      sound.playAlert();
      setErrorMsg(err.data?.error || err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="modal-auth-dialog"
        className="w-full max-w-md bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Notice Banner if triggered by Add to Cart */}
        {noticeMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-left">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-xs tracking-wide">Sign In Required</p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">{noticeMessage}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 mx-auto mb-2.5 shadow-xs">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-stone-900">
            {mode === 'login' && 'Welcome to PizzaCraft'}
            {mode === 'register' && 'Create Your PizzaCraft Account'}
            {mode === 'verify' && 'Verify Your Email Address'}
            {mode === 'forgot' && 'Reset Your Password'}
            {mode === 'reset' && 'Set New Password'}
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            {mode === 'login' && 'Sign in to order artisan pizzas, save delivery addresses, and track orders.'}
            {mode === 'register' && 'Join for wood-fired pizzas, chef specials, and live oven tracking.'}
            {mode === 'verify' && `We sent a 6-digit code to ${email || 'your email'}.`}
            {mode === 'forgot' && 'Enter your email to receive a password recovery link.'}
            {mode === 'reset' && 'Enter your verification token and your new password.'}
          </p>
        </div>

        {/* Feedback banners */}
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium">
            {successMsg}
          </div>
        )}

        {/* VIEW 1: SIGN IN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-stone-600 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="input-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. customer@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-stone-600">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setMode('forgot');
                  }}
                  className="text-[11px] text-amber-700 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="input-login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs sm:text-sm shadow-md shadow-amber-500/15 transition"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            {/* Demo Quick Fill */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setEmail('customer@example.com');
                  setPassword('User@123');
                }}
                className="text-[11px] text-amber-800 hover:underline bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg border border-stone-200"
              >
                Auto-Fill Demo Customer (customer@example.com)
              </button>
            </div>

            <div className="text-center pt-2 text-xs text-stone-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('register');
                }}
                className="font-bold text-amber-700 hover:underline"
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: REGISTRATION */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs text-stone-600 block mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="input-reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marco Rossi"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-600 block mb-1">Email Address (for verification)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="input-reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. marco@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-600 block mb-1">Password (min 6 characters)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="input-reg-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-600 block mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="input-reg-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              id="btn-submit-register"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs sm:text-sm shadow-md shadow-amber-500/15 transition mt-2"
            >
              {loading ? 'Creating Account & Sending Email...' : 'Register & Send Verification Code'}
            </button>

            <div className="text-center pt-2 text-xs text-stone-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('login');
                }}
                className="font-bold text-amber-700 hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: EMAIL VERIFICATION */}
        {mode === 'verify' && (
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div>
              <label className="text-xs text-stone-600 block mb-1 text-center">
                Enter 6-Digit Email Verification Code
              </label>
              <input
                id="input-verify-token"
                type="text"
                required
                maxLength={10}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest font-mono text-xl py-3 rounded-xl bg-stone-50 border border-stone-200 text-amber-800 font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <button
              id="btn-submit-verify"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/15 transition"
            >
              {loading ? 'Verifying...' : 'Verify Email & Enter Pizzeria'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={handleResend}
                className="text-stone-500 hover:text-amber-700 transition"
              >
                Resend Code
              </button>
              {openEmailSandbox && (
                <button
                  type="button"
                  onClick={openEmailSandbox}
                  className="text-amber-700 font-bold hover:underline"
                >
                  View in Email Sandbox ✉️
                </button>
              )}
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* VIEW 4: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="text-xs text-stone-600 block mb-1">Your Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="input-forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. customer@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              id="btn-submit-forgot"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs sm:text-sm shadow-md shadow-amber-500/15 transition"
            >
              {loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* VIEW 5: RESET PASSWORD */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs text-stone-600 block mb-1">Reset Token / Code</label>
              <input
                id="input-reset-token"
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="rst-..."
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-amber-800 font-mono text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs text-stone-600 block mb-1">New Password</label>
              <input
                id="input-new-password"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <button
              id="btn-submit-new-password"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/15 transition"
            >
              {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
