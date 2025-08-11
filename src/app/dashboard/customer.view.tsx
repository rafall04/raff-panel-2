"use client";

import type { CustomerInfo } from "./actions";

// A simple formatter for currency
const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

export default function CustomerView({ customerInfo }: { customerInfo: CustomerInfo | null }) {
    if (!customerInfo) {
        // Don't render anything if there's no customer info
        return null;
    }

    return (
        <div className="card bg-base-100 w-full shrink-0 shadow-2xl mb-4">
            <div className="card-body">
                <h1 className="card-title">Customer Information</h1>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-semibold">Name</p>
                        <p>{customerInfo.name}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Package</p>
                        <p>{customerInfo.packageName}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Monthly Bill</p>
                        <p>{currencyFormatter.format(customerInfo.monthlyBill)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Due Date</p>
                        <p>{new Date(customerInfo.dueDate).toLocaleDateString('id-ID')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
