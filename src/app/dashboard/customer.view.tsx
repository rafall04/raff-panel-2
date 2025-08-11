"use client";

import type { CustomerInfo } from "./actions";
import { User, Package, CircleDollarSign, Calendar, ShieldCheck, MapPin } from 'lucide-react';

// A simple formatter for currency
const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

const PaymentStatusBadge = ({ status }: { status: string }) => {
    const statusUpper = status.toUpperCase();
    let badgeClass = 'badge-info'; // Default
    if (statusUpper === 'PAID') {
        badgeClass = 'badge-success';
    } else if (statusUpper === 'PENDING') {
        badgeClass = 'badge-warning';
    } else if (statusUpper === 'UNPAID') {
        badgeClass = 'badge-error';
    }

    return <div className={`badge ${badgeClass} text-white`}>{status}</div>;
};

export default function CustomerView({ customerInfo }: { customerInfo: CustomerInfo | null }) {
    if (!customerInfo) {
        return (
            <div className="card bg-white/10 backdrop-blur-lg border border-white/20 w-full shrink-0 shadow-2xl">
                <div className="card-body items-center text-center">
                    <h2 className="card-title text-white">Customer Information</h2>
                    <p>No customer data available.</p>
                    <p className="text-xs text-gray-400">Please ensure the backend API is configured correctly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-white/10 backdrop-blur-lg border border-white/20 w-full shrink-0 shadow-2xl">
            <div className="card-body">
                <h1 className="card-title text-white flex items-center"><User size={20} className="mr-2"/>Customer Information</h1>
                <div className="space-y-4 mt-2">
                    <div className="flex items-start">
                        <User size={16} className="mr-3 text-gray-400 mt-1"/>
                        <div>
                            <p className="font-semibold text-gray-400 text-sm">Name</p>
                            <p>{customerInfo.name}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <Package size={16} className="mr-3 text-gray-400 mt-1"/>
                        <div>
                            <p className="font-semibold text-gray-400 text-sm">Package</p>
                            <p>{customerInfo.packageName}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <CircleDollarSign size={16} className="mr-3 text-gray-400 mt-1"/>
                        <div>
                            <p className="font-semibold text-gray-400 text-sm">Monthly Bill</p>
                            <p>{currencyFormatter.format(customerInfo.monthlyBill)}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <Calendar size={16} className="mr-3 text-gray-400 mt-1"/>
                        <div>
                            <p className="font-semibold text-gray-400 text-sm">Due Date</p>
                            <p>{new Date(customerInfo.dueDate).toLocaleDateString('id-ID')}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <ShieldCheck size={16} className="mr-3 text-gray-400 mt-1"/>
                        <div>
                            <p className="font-semibold text-gray-400 text-sm">Payment Status</p>
                            <PaymentStatusBadge status={customerInfo.paymentStatus} />
                        </div>
                    </div>
                    <div className="flex items-start">
                        <MapPin size={16} className="mr-3 text-gray-400 mt-1"/>
                        <div>
                            <p className="font-semibold text-gray-400 text-sm">Address</p>
                            <p className="whitespace-normal">{customerInfo.address}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
