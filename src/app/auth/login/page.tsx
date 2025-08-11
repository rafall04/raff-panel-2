"use client";
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { requestOtp } from '@/utils/auth.server';
import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'
import { Phone, KeyRound, ArrowRight } from 'lucide-react'; // Import icons

export default function Login() {
    const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
    const [otp, setOtp] = useState('');
    const [otpRequested, setOtpRequested] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAlertMessage('');
        const status = await requestOtp(phoneNumber!.slice(1));
        if (status === 200) {
            setOtpRequested(true);
        } else {
            setAlertMessage(status == 404 ? 'User Not Found' : 'Failed to request OTP');
        }
        setLoading(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAlertMessage('');
        const result = await signIn('credentials', {
            callbackUrl: '/dashboard',
            redirect: true,
            phoneNumber: phoneNumber!.slice(1),
            otp,
        });

        // This code now only runs if the redirect fails, i.e., an error occurred.
        if (result?.error) {
            setAlertMessage('Invalid OTP or failed to sign in. Please try again.');
            setLoading(false);
        }
    };

    return (
        <main className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left Column: Branding */}
            <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-background-start text-white">
                <div className="max-w-md text-center">
                    <h1 className="text-5xl font-bold mb-4">RAF PANEL</h1>
                    <p className="text-xl text-gray-300">
                        Manage your network with ease. Powerful, intuitive, and built for you.
                    </p>
                </div>
            </div>

            {/* Right Column: Login Form */}
            <div className="flex items-center justify-center p-6 bg-gradient-to-r from-background-start to-background-end">
                <div className="card w-full max-w-md bg-white/10 shadow-2xl backdrop-blur-lg border border-white/20">
                    <div className="card-body">
                        <h2 className="text-center text-3xl font-bold mb-6 text-white">
                            {otpRequested ? 'Enter Your Code' : 'Welcome Back'}
                        </h2>

                        {alertMessage && (
                            <div role="alert" className="alert alert-error text-white bg-red-500/50 mb-4 border-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{alertMessage}</span>
                            </div>
                        )}

                        <form onSubmit={otpRequested ? handleLogin : handleRequestOtp}>
                            <div className="form-control space-y-4">
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <PhoneInput
                                        placeholder="Enter phone number"
                                        defaultCountry='ID'
                                        value={phoneNumber}
                                        className='input input-bordered w-full pl-10 text-white bg-black/20 focus:bg-black/30 focus:border-primary'
                                        onChange={(e) => setPhoneNumber(e)}
                                        disabled={otpRequested || loading}
                                    />
                                </div>

                                {otpRequested && (
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                                <button
                                    className="btn bg-primary text-white border-none hover:bg-violet-700 w-full group"
                                    type="submit"
                                    disabled={!phoneNumber || loading}
                                >
                                    {loading ? <span className="loading loading-spinner"></span> : (
                                        <>
                                            <span>{otpRequested ? 'Login' : 'Request OTP'}</span>
                                            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
