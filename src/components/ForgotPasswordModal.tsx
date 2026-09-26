import React, { useState } from 'react';
import { getStaffList, saveStaffList, getCompany, saveCompany } from '../utils/storage';
import { ShieldCheck, Mail, KeyRound, ArrowLeft } from 'lucide-react';

interface Props {
  onClose: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const ForgotPasswordModal: React.FC<Props> = ({ onClose, onShowToast }) => {
  const [step, setStep] = useState<'REQUEST' | 'VERIFY' | 'SUCCESS'>('REQUEST');
  const [email, setEmail] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const staffList = getStaffList();
    const company = getCompany();
    const user = staffList.find(s => s.email.toLowerCase() === email.toLowerCase());

    if (!user && company?.email.toLowerCase() !== email.toLowerCase()) {
      onShowToast('error', 'Email Not Found', 'No account registered with this email address.');
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(otp);
    setStep('VERIFY');
    onShowToast('info', 'OTP Generated', `Simulated OTP sent to ${email}. Check on-screen display.`);
  };

  const handleVerifyAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp !== simulatedOtp) {
      onShowToast('error', 'Invalid OTP', 'The 6-digit verification code entered is incorrect.');
      return;
    }

    if (!newPassword.trim()) {
      onShowToast('error', 'Password Required', 'Please enter a new password.');
      return;
    }

    // Update password in staff list & company if matched
    const staffList = getStaffList();
    let updated = false;
    const updatedStaff = staffList.map(s => {
      if (s.email.toLowerCase() === email.toLowerCase()) {
        updated = true;
        return { ...s, password: newPassword };
      }
      return s;
    });

    if (updated) {
      saveStaffList(updatedStaff);
    }

    const company = getCompany();
    if (company && company.email.toLowerCase() === email.toLowerCase()) {
      company.passwordHash = newPassword;
      saveCompany(company);
    }

    setStep('SUCCESS');
    onShowToast('success', 'Password Reset Successful', 'Your account password has been successfully updated.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-up">
        <div className="bg-slate-900 p-6 text-white">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400 border border-blue-500/30">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Password Reset (OTP)</h2>
              <p className="text-slate-400 text-xs mt-0.5">Secure recovery workflow</p>
            </div>
          </div>
        </div>

        {step === 'REQUEST' && (
          <form onSubmit={handleSendOtp} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer text-sm"
            >
              Send 6-Digit OTP Code
            </button>
          </form>
        )}

        {step === 'VERIFY' && (
          <form onSubmit={handleVerifyAndReset} className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1">Simulated Email OTP Dispatch</p>
              <p className="text-xs mb-2">For hackathon testing purposes, your generated 6-digit code is displayed below:</p>
              <div className="text-2xl font-mono font-bold tracking-widest text-amber-700 bg-white px-4 py-2 rounded-lg border border-amber-300 text-center select-all">
                {simulatedOtp}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Enter 6-Digit OTP</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={enteredOtp}
                onChange={e => setEnteredOtp(e.target.value)}
                className="w-full text-center font-mono tracking-widest text-lg py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer text-sm"
            >
              Verify Code & Update Password
            </button>
          </form>
        )}

        {step === 'SUCCESS' && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Password Reset Complete</h3>
            <p className="text-sm text-slate-600">You can now sign in using your new password credentials.</p>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all cursor-pointer text-sm"
            >
              Return to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
