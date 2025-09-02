"use client";
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { User, Lock, ArrowRight, Smartphone, Key, Loader2, Router } from 'lucide-react';
import { requestOtp } from '@/utils/auth.server';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Login() {
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
            toast.success('Login successful! Redirecting...');
            window.location.href = '/dashboard';
        } else {
            toast.error(result?.error || 'Invalid username or password.');
        }
    };

    const handleRequestOtp = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!/^\d{10,15}$/.test(phoneNumber)) {
            toast.error('Invalid phone number format.');
            return;
        }
        setLoading(true);
        const promise = requestOtp(phoneNumber);
        toast.promise(promise, {
            loading: 'Sending OTP...',
            success: (res) => {
                if (res.ok) {
                    setOtpSent(true);
                    return res.message || 'OTP has been sent to your WhatsApp.';
                } else {
                    throw new Error(res.message || 'Failed to send OTP.');
                }
            },
            error: (err) => err.message,
            finally: () => setLoading(false),
        });
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
            toast.success('Login successful! Redirecting...');
            window.location.href = '/dashboard';
        } else {
            toast.error(result?.error || 'Invalid OTP or phone number.');
        }
    };

    return (
        <main className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
            <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-muted/40">
                <div className="max-w-md text-center">
                    <Router className="h-24 w-24 mx-auto mb-6 text-primary" />
                    <h1 className="text-5xl font-bold mb-4">RAF PANEL</h1>
                    <p className="text-xl text-muted-foreground">
                        Manage your network with ease. Powerful, intuitive, and built for you.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-center p-6">
                <Tabs defaultValue="password" className="w-full max-w-md">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="password">Password</TabsTrigger>
                        <TabsTrigger value="otp">WhatsApp</TabsTrigger>
                    </TabsList>
                    <TabsContent value="password">
                        <Card>
                            <CardHeader>
                                <CardTitle>Login with Password</CardTitle>
                                <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCredentialsLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input id="username" type="text" placeholder="your_username" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={!username || !password || loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                        Login
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="otp">
                        <Card>
                            <CardHeader>
                                <CardTitle>Login with WhatsApp</CardTitle>
                                <CardDescription>Receive a One-Time Password (OTP) on your WhatsApp.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleWhatsAppLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">WhatsApp Number</Label>
                                        <Input id="phone" type="tel" placeholder="6281234567890" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required disabled={loading || otpSent} />
                                    </div>
                                    {!otpSent ? (
                                        <Button type="button" onClick={handleRequestOtp} className="w-full" disabled={!phoneNumber || loading}>
                                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />}
                                            Send OTP
                                        </Button>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="otp">OTP Code</Label>
                                                <Input id="otp" type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required disabled={loading} />
                                            </div>
                                            <Button type="submit" className="w-full" disabled={!otp || loading}>
                                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                                                Login with OTP
                                            </Button>
                                        </>
                                    )}
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}
