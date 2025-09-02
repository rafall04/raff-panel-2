"use client";
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { User, Lock, ArrowRight, Smartphone, Key } from 'lucide-react';
import { requestOtp } from '@/utils/auth.server';
import toast from 'react-hot-toast';

type LoginMethod = 'password' | 'otp';

export default function Login() {
    // State for login method
    const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');

    // State for Credentials login
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // State for WhatsApp OTP login
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Common state
    const [loading, setLoading] = useState(false);

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await signIn('username-password', {
            redirect: false,
            username,
            password,
        });

        setLoading(false);
        if (result?.ok) {
            window.location.href = '/dashboard';
        } else {
            toast.error(result?.error || 'An unknown error occurred.');
        }
    };

    const handleRequestOtp = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!/^\d{10,15}$/.test(phoneNumber)) {
            toast.error('Invalid phone number format.');
            return;
        }
        setLoading(true);

        const response = await requestOtp(phoneNumber);

        if (response.ok) {
            setOtpSent(true);
            toast.success(response.message || 'OTP has been sent to your WhatsApp.');
        } else {
            toast.error(response.message || 'Failed to send OTP. Please try again.');
        }

        setLoading(false);
    };

    const handleWhatsAppLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await signIn('credentials', {
            redirect: false,
            phoneNumber,
            otp,
        });

        setLoading(false);
        if (result?.ok) {
            window.location.href = '/dashboard';
        } else {
            toast.error(result?.error || 'An unknown error occurred.');
        }
    };

    const renderCredentialsForm = () => (
        <form onSubmit={handleCredentialsLogin}>
            <div className="form-control space-y-4">
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Username"
                        className="input input-bordered w-full pl-10 text-white bg-black/20 focus:bg-black/30 focus:border-primary"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="password"
                        placeholder="Password"
                        className="input input-bordered w-full pl-10 text-white bg-black/20 focus:bg-black/30 focus:border-primary"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
            </div>
            <div className="form-control mt-6">
                <button
                    className="btn bg-primary text-white border-none hover:bg-violet-700 w-full group"
                    type="submit"
                    disabled={!username || !password || loading}
                >
                    {loading ? <span className="loading loading-spinner"></span> : (
                        <>
                            <span>Login with Password</span>
                            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </form>
    );

    const renderWhatsAppForm = () => (
        <form onSubmit={handleWhatsAppLogin}>
            <div className="form-control space-y-4">
                <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="tel"
                        placeholder="WhatsApp Number (e.g., 6281234567890)"
                        className="input input-bordered w-full pl-10 text-white bg-black/20 focus:bg-black/30 focus:border-primary"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        disabled={loading || otpSent}
                    />
                </div>
                {otpSent && (
                    <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="OTP Code"
                            className="input input-bordered w-full pl-10 text-white bg-black/20 focus:bg-black/30 focus:border-primary"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                )}
            </div>
            <div className="form-control mt-6">
                {!otpSent ? (
                    <button
                        className="btn bg-green-500 text-white border-none hover:bg-green-600 w-full"
                        type="button"
                        onClick={(e) => handleRequestOtp(e)}
                        disabled={!phoneNumber || loading}
                    >
                        {loading ? <span className="loading loading-spinner"></span> : 'Send OTP'}
                    </button>
                ) : (
                    <button
                        className="btn bg-primary text-white border-none hover:bg-violet-700 w-full group"
                        type="submit"
                        disabled={!otp || loading}
                    >
                        {loading ? <span className="loading loading-spinner"></span> : (
                            <>
                                <span>Login with OTP</span>
                                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                )}
            </div>
        </form>
    );

    const resetFormState = () => {
        setUsername('');
        setPassword('');
        setPhoneNumber('');
        setOtp('');
        setOtpSent(false);
        setLoading(false);
    }

    return (
        <main className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
            <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-background-start text-white">
                <div className="max-w-md text-center">
                    <h1 className="text-5xl font-bold mb-4">RAF PANEL</h1>
                    <p className="text-xl text-gray-300">
                        Manage your network with ease. Powerful, intuitive, and built for you.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-center p-6 bg-gradient-to-r from-background-start to-background-end">
                <div className="card w-full max-w-md bg-white/10 shadow-2xl backdrop-blur-lg border border-white/20">
                    <div className="card-body">
                        <div role="tablist" className="tabs tabs-boxed bg-black/20 mb-6">
                            <a role="tab" className={`tab ${loginMethod === 'password' ? 'tab-active' : ''}`} onClick={() => { setLoginMethod('password'); resetFormState(); }}>Password</a>
                            <a role="tab" className={`tab ${loginMethod === 'otp' ? 'tab-active' : ''}`} onClick={() => { setLoginMethod('otp'); resetFormState(); }}>WhatsApp</a>
                        </div>

                        <h2 className="text-center text-3xl font-bold mb-2 text-white">
                           Login
                        </h2>
                        <p className="text-center text-sm text-gray-400 mb-6">
                            {loginMethod === 'password' ? 'Using your username and password' : 'Using your WhatsApp number'}
                        </p>

                        {loginMethod === 'password' ? renderCredentialsForm() : renderWhatsAppForm()}
                    </div>
                </div>
            </div>
        </main>
    );
}
