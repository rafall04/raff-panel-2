"use client";

import { FormEvent, useEffect, useState } from "react";
import { setPassword, setSSIDName } from "./actions";
import { Lock, Type, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function Form({ ssid, selectedSsid, syncedSsids, refreshSsidInfo }: {ssid: {id: string, name: string }[], selectedSsid: string, syncedSsids: string[], refreshSsidInfo: () => void}) {
    const [form, setForm] = useState({
        ssid: ssid.find(v => v.id == selectedSsid)?.name || ssid[0].name,
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setAlert(null);
        const tasks = [];
        if(form.ssid !== ssid.find(v => v.id == selectedSsid)?.name){
            if(syncedSsids.length > 0){
                for (const id of syncedSsids) {
                    tasks.push(setSSIDName(id, form.ssid));
                }
            }else{
                tasks.push(setSSIDName(selectedSsid, form.ssid));
            }
        }
        if(form.password.length > 0){
            if (syncedSsids.length > 0) {
                for (const id of syncedSsids) {
                    tasks.push(setPassword(id, form.password));
                }
            }else{
                tasks.push(setPassword(selectedSsid, form.password));
            }
        }
        try {
            await Promise.all(tasks);
            setAlert({ type: 'success', message: 'Settings updated successfully!' });
            refreshSsidInfo();
        } catch (error) {
            console.error(error);
            setAlert({ type: 'error', message: 'Failed to update settings.' });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setForm({
            ssid: ssid.find(v => v.id == selectedSsid)?.name || ssid[0].name,
            password: ''
        });
    }, [selectedSsid, ssid]);

    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => setAlert(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [alert]);

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {alert && (
                <div role="alert" className={`alert ${alert.type === 'success' ? 'alert-success bg-green-500/50' : 'alert-error bg-red-500/50'} border-none text-white`}>
                    {alert.type === 'success' ? <CheckCircle /> : <AlertCircle />}
                    <span>{alert.message}</span>
                </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text text-gray-300">SSID Name</span>
                    </label>
                    <div className="relative">
                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" value={form.ssid} onChange={(e) => setForm({ ...form, ssid: e.target.value })} className="input input-bordered w-full pl-10 text-white bg-black/20 focus:bg-black/30 focus:border-primary" required />
                    </div>
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text text-gray-300">New Password (optional)</span>
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Leave blank to keep current"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="input input-bordered w-full pl-10 pr-10 text-white bg-black/20 focus:bg-black/30 focus:border-primary"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex w-full">
                <button className="btn bg-primary text-white border-none hover:bg-violet-700 ml-auto" type="submit" disabled={loading}>
                    {loading ? <span className="loading loading-spinner"></span> : <><Save size={16} className="mr-2"/> Simpan</>}
                </button>
            </div>
        </form>
    );
}
