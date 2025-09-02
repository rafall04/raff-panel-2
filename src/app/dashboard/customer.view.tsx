"use client";

import type { CustomerInfo } from "./actions";
import { User, Package, CircleDollarSign, Calendar, ShieldCheck, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// A simple formatter for currency
const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

const PaymentStatusBadge = ({ status }: { status: string }) => {
    const statusUpper = status.toUpperCase();
    let variant: "default" | "secondary" | "destructive" | "outline" = 'secondary';
    if (statusUpper === 'PAID') {
        variant = 'default'; // Or maybe a custom green one if we add it
    } else if (statusUpper === 'PENDING') {
        variant = 'secondary';
    } else if (statusUpper === 'UNPAID') {
        variant = 'destructive';
    }

    return <Badge variant={variant} className={`${statusUpper === 'PAID' ? 'bg-green-600' : ''}`}>{status}</Badge>;
};

export default function CustomerView({ customerInfo }: { customerInfo: CustomerInfo | null }) {
    if (!customerInfo) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>No customer data available.</p>
                    <p className="text-xs">Please ensure the backend API is configured correctly.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><User size={20} className="mr-2"/>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start">
                    <User size={16} className="mr-3 text-muted-foreground mt-1"/>
                    <div>
                        <p className="font-semibold text-muted-foreground text-sm">Name</p>
                        <p>{customerInfo.name}</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <Package size={16} className="mr-3 text-muted-foreground mt-1"/>
                    <div>
                        <p className="font-semibold text-muted-foreground text-sm">Package</p>
                        <p>{customerInfo.packageName}</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <CircleDollarSign size={16} className="mr-3 text-muted-foreground mt-1"/>
                    <div>
                        <p className="font-semibold text-muted-foreground text-sm">Monthly Bill</p>
                        <p>{currencyFormatter.format(customerInfo.monthlyBill)}</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <Calendar size={16} className="mr-3 text-muted-foreground mt-1"/>
                    <div>
                        <p className="font-semibold text-muted-foreground text-sm">Due Date</p>
                        <p>{new Date(customerInfo.dueDate).toLocaleDateString('id-ID')}</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <ShieldCheck size={16} className="mr-3 text-muted-foreground mt-1"/>
                    <div>
                        <p className="font-semibold text-muted-foreground text-sm">Payment Status</p>
                        <PaymentStatusBadge status={customerInfo.paymentStatus} />
                    </div>
                </div>
                <div className="flex items-start">
                    <MapPin size={16} className="mr-3 text-muted-foreground mt-1"/>
                    <div>
                        <p className="font-semibold text-muted-foreground text-sm">Address</p>
                        <p className="whitespace-normal">{customerInfo.address}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
