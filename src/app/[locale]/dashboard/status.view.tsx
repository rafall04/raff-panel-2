"use client";

import type { DashboardStatus } from "./actions";
import { Hourglass, Zap } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function StatusView({ status }: { status: DashboardStatus }) {
    return (
        <Card className="col-span-1 md:col-span-2 xl:col-span-3">
            <CardHeader>
                <CardTitle>Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Active Speed Boost */}
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Zap size={18}/> Active Speed Boost</h3>
                        {status.activeBoost ? (
                            <div className="mt-2 text-muted-foreground">
                                <p>Your speed is currently boosted to <span className="font-bold text-primary">{status.activeBoost.profile}</span>.</p>
                                <p className="text-sm">Expires on: {new Date(status.activeBoost.expiresAt).toLocaleString()}</p>
                            </div>
                        ) : (
                            <p className="mt-2 text-muted-foreground">No active speed boost.</p>
                        )}
                    </div>

                    {/* Active Report */}
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Hourglass size={18}/> Active Report</h3>
                        {status.activeReport ? (
                            <div className="mt-2 text-muted-foreground">
                                <p>Report <span className="font-bold text-primary">#{status.activeReport.id}</span> ({status.activeReport.category}) is currently <span className="font-bold text-yellow-400">{status.activeReport.status}</span>.</p>
                            </div>
                        ) : (
                            <p className="mt-2 text-muted-foreground">You have no active reports.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
