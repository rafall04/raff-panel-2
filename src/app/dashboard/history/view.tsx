"use client";

import type { ReportHistoryItem } from "../actions";
import { History } from 'lucide-react';

const StatusBadge = ({ status }: { status: ReportHistoryItem['status'] }) => {
    const statusClasses = {
        Submitted: 'badge-info',
        'In Progress': 'badge-warning',
        Resolved: 'badge-success',
    };
    return <div className={`badge ${statusClasses[status]} text-white`}>{status}</div>;
};

export default function HistoryView({ history }: { history: ReportHistoryItem[] }) {
    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center"><History className="mr-3"/>Report History</h1>

            {history.length > 0 ? (
                <div className="space-y-4">
                    {history.map((item) => (
                        <div key={item.id} className="card bg-white/10 border border-white/20 shadow-lg">
                            <div className="card-body">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="card-title text-white">{item.category}</h2>
                                        <p className="text-sm text-gray-400">Reported on: {new Date(item.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                    <StatusBadge status={item.status} />
                                </div>
                                <p className="text-gray-300 mt-2">Report ID: {item.id}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-lg text-gray-300">You have no report history.</p>
                </div>
            )}
        </div>
    );
}
