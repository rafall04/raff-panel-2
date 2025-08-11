"use client";
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { requestOtp } from '@/utils/auth.server';
import { useRouter } from 'next/navigation';
import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'

export default function Login() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
    const [otp, setOtp] = useState('');
    const [otpRequested, setOtpRequested] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const status = await requestOtp(phoneNumber!.slice(1));
        if (status === 200) {
            setOtpRequested(true);
        } else {
            setAlertMessage(status == 404? 'User Not Found' : 'Failed to request OTP');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await signIn('credentials', {
            callbackUrl: '/dashboard',
            phoneNumber: phoneNumber!.slice(1),
            otp,
        });
        if (result?.error) {
            setAlertMessage('Failed to sign in');
        }else{
            router.push('/dashboard');
        }
    };

    return (
        <div className="w-[100dvw] h-[100dvh] flex items-center justify-center">
            <div className="card w-96 bg-base-200 shadow-xl">
                <div className="card-body">
                    <h2 className="text-center text-3xl font-bold mb-2">Login</h2>
                    {alertMessage && (
                        <div className="alert alert-error">
                            <div className="flex-1">
                                <label>{alertMessage}</label>
                            </div>
                        </div>
                    )}
                    <form onSubmit={otpRequested ? handleLogin : handleRequestOtp}>
                        <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Phone Number</span>
                                </label>
                                <PhoneInput
                                    placeholder="Enter phone number"
                                    defaultCountry='ID'
                                    value={phoneNumber}
                                    className='input input-bordered'
                                    onChange={(e) => setPhoneNumber(e)}/>
                        </div>
                        {otpRequested && (
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">OTP</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="OTP"
                                    className="input input-bordered"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="form-control mt-6">
                            <button className="btn btn-primary" type="submit" disabled={!phoneNumber}>
                                {otpRequested ? 'Login' : 'Request OTP'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}