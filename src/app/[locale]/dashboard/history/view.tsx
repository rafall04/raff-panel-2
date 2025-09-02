"use client";

import type { ReportHistoryItem } from "../actions";
import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const StatusBadge = ({ status }: { status: ReportHistoryItem['status'] }) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = 'secondary';
    if (status === 'Resolved') {
        variant = 'default';
    } else if (status === 'In Progress') {
        variant = 'secondary';
    } else if (status === 'Submitted') {
        variant = 'outline';
    }

    return <Badge variant={variant} className={`${status === 'Resolved' ? 'bg-green-600' : ''}`}>{status}</Badge>;
};

export default function HistoryView({ history }: { history: ReportHistoryItem[] }) {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 flex items-center"><History className="mr-3"/>Report History</h1>

            {history.length > 0 ? (
                <div className="space-y-4">
                    {history.map((item) => (
                        <Card key={item.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{item.category}</CardTitle>
                                        <CardDescription>Reported on: {new Date(item.submittedAt).toLocaleDateString()}</CardDescription>
                                    </div>
                                    <StatusBadge status={item.status} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Report ID: {item.id}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 border rounded-lg">
                    <p className="text-lg text-muted-foreground">You have no report history.</p>
                </div>
            )}
        </div>
    );
}
