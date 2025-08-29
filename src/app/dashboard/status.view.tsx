"use client";

import type { DashboardStatus } from "./actions";
import { Hourglass, Zap } from 'lucide-react';

export default function StatusView({ status }: { status: DashboardStatus }) {
    return (
        <div className="card bg-white/10 border border-white/20 shadow-xl col-span-1 md:col-span-2 xl:col-span-3">
            <div className="card-body">
                <h2 className="card-title text-white">Status Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* Active Speed Boost */}
                    <div className="p-4 bg-black/20 rounded-lg">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Zap size={18}/> Active Speed Boost</h3>
                        {status.activeBoost ? (
                            <div className="mt-2 text-gray-300">
                                <p>Your speed is currently boosted to <span className="font-bold text-primary">{status.activeBoost.profile}</span>.</p>
                                <p className="text-sm">Expires on: {new Date(status.activeBoost.expiresAt).toLocaleString()}</p>
                            </div>
                        ) : (
                            <p className="mt-2 text-gray-400">No active speed boost.</p>
                        )}
                    </div>

                    {/* Active Report */}
                    <div className="p-4 bg-black/20 rounded-lg">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Hourglass size={18}/> Active Report</h3>
                        {status.activeReport ? (
                            <div className="mt-2 text-gray-300">
                                <p>Report <span className="font-bold text-primary">#{status.activeReport.id}</span> ({status.activeReport.category}) is currently <span className="font-bold text-yellow-400">{status.activeReport.status}</span>.</p>
                            </div>
                        ) : (
                            <p className="mt-2 text-gray-400">You have no active reports.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
