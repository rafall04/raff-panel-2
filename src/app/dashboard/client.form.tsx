"use client";

import { FormEvent, useEffect, useState } from "react";
import { setPassword, setSSIDName } from "./actions";

export default function Form({ ssid, selectedSsid, syncedSsids, refreshSsidInfo }: {ssid: {id: string, name: string }[], selectedSsid: string, syncedSsids: string[], refreshSsidInfo: () => void}) {
    const [form, setForm] = useState({
        ssid: ssid.find(v => v.id == selectedSsid)?.name || ssid[0].name,
        password: ''
    });
    const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const tasks = [];
        if(form.ssid != ssid.find(v => v.id == selectedSsid)?.name){
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
        }
    }

    useEffect(() => {
        setForm((f) => ({
            ...f,
            ssid: ssid.find(v => v.id == selectedSsid)?.name || ssid[0].name,
            password: ''
        }))
    }, [selectedSsid, ssid]);

    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => {
                setAlert(null);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [alert]);

    return (
        <form className="card-body" onSubmit={handleSubmit}>
            {alert && (
                <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                    <span>{alert.message}</span>
                </div>
            )}
            <div className="grid md:grid-cols-2 gap-1">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">SSID Name</span>
                    </label>
                    <input type="text" value={form.ssid} onChange={(e) => setForm({
                        ...form,
                        ssid: e.target.value
                    })} className="input input-bordered" required />
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">SSID Password</span>
                    </label>
                    <input type="password" placeholder="*******" value={form.password} onChange={(e) => setForm({
                        ...form,
                        password: e.target.value
                    })} className="input input-bordered"/>
                </div>
                <div className="mt-6 md:col-span-2 flex w-full">
                    <button className="btn btn-primary ml-auto" type="submit">Simpan</button>
                </div>
            </div>
        </form>
    );
}
