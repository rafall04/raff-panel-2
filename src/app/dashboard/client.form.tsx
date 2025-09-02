"use client";

import { FormEvent, useEffect, useState } from "react";
import { setPassword, setSSIDName } from "./actions";
import { Lock, Type, Save, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Form({ ssid, selectedSsid, syncedSsids, refreshSsidInfo }: {ssid: {id: string, name: string }[], selectedSsid: string, syncedSsids: string[], refreshSsidInfo: () => void}) {
    const [form, setForm] = useState({
        ssid: ssid.find(v => v.id == selectedSsid)?.name || ssid[0].name,
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const tasks = [];
        if(form.ssid !== ssid.find(v => v.id == selectedSsid)?.name){
            const sids = syncedSsids.length > 0 ? syncedSsids : [selectedSsid];
            sids.forEach(id => tasks.push(setSSIDName(id, form.ssid)));
        }
        if(form.password.length > 0){
            const sids = syncedSsids.length > 0 ? syncedSsids : [selectedSsid];
            sids.forEach(id => tasks.push(setPassword(id, form.password)));
        }

        if (tasks.length === 0) {
            toast.info("No changes to save.");
            setLoading(false);
            return;
        }

        try {
            await Promise.all(tasks);
            toast.success("Settings updated successfully!");
            refreshSsidInfo();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update settings.");
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

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="ssid">SSID Name</Label>
                    <div className="relative">
                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="ssid" type="text" value={form.ssid} onChange={(e) => setForm({ ...form, ssid: e.target.value })} className="pl-10" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">New Password (optional)</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Leave blank to keep current"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="pl-10 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex w-full justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 size={16} className="mr-2 animate-spin"/> : <Save size={16} className="mr-2"/>}
                    Simpan
                </Button>
            </div>
        </form>
    );
}
