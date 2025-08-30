"use client";
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { User, Lock, ArrowRight } from 'lucide-react'; // Import icons

export default function Login() {
    // State for Credentials login
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Common state
    const [alertMessage, setAlertMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAlertMessage('');
        const result = await signIn('username-password', {
            callbackUrl: '/dashboard',
            redirect: true,
            username,
            password,
        });

        if (result?.error) {
            setAlertMessage('Invalid username or password.');
            setLoading(false);
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
                        <h2 className="text-center text-3xl font-bold mb-6 text-white">
                           Login
                        </h2>

                        {alertMessage && (
                            <div role="alert" className="alert alert-error text-white bg-red-500/50 mb-4 border-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{alertMessage}</span>
                            </div>
                        )}

                        {renderCredentialsForm()}
                    </div>
                </div>
            </div>
        </main>
    );
}
