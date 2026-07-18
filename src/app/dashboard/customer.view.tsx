"use client";

import type { CustomerInfo } from "./actions";
import {
  User,
  Package,
  CircleDollarSign,
  Calendar,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PaymentStatusBadge = ({ status }: { status?: string | null }) => {
  // If status is null/undefined, don't render anything (feature is hidden)
  if (!status) {
    return null;
  }

  const statusUpper = status.toUpperCase();
  let variant: "default" | "secondary" | "destructive" | "outline" =
    "secondary";
  if (statusUpper === "PAID") {
    variant = "default";
  } else if (statusUpper === "UNPAID") {
    variant = "destructive";
  }

  return (
    <Badge
      variant={variant}
      className={`${statusUpper === "PAID" ? "bg-green-600" : ""}`}
    >
      {status}
    </Badge>
  );
};

export default function CustomerView({
  customerInfo,
}: {
  customerInfo: CustomerInfo | null;
}) {
  if (!customerInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>No customer data available.</p>
          <p className="text-xs">
            Please ensure the backend API is configured correctly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User size={20} className="mr-2" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start">
          <User size={16} className="mr-3 text-muted-foreground mt-1" />
          <div>
            <p className="font-semibold text-muted-foreground text-sm">Name</p>
            <p>{customerInfo.name || "N/A"}</p>
          </div>
        </div>
        <div className="flex items-start">
          <Package size={16} className="mr-3 text-muted-foreground mt-1" />
          <div>
            <p className="font-semibold text-muted-foreground text-sm">
              Package
            </p>
            <p>{customerInfo.package || customerInfo.packageName || "N/A"}</p>
          </div>
        </div>
        <div className="flex items-start">
          <CircleDollarSign
            size={16}
            className="mr-3 text-muted-foreground mt-1"
          />
          <div>
            <p className="font-semibold text-muted-foreground text-sm">
              Monthly Bill
            </p>
            <p>{customerInfo.monthlyBillFormatted || "N/A"}</p>
          </div>
        </div>
        {/* Conditional display: Due Date - only show if dueDateFormatted is not null */}
        {customerInfo.dueDateFormatted && (
          <div className="flex items-start">
            <Calendar size={16} className="mr-3 text-muted-foreground mt-1" />
            <div>
              <p className="font-semibold text-muted-foreground text-sm">
                Due Date
              </p>
              <p>{customerInfo.dueDateFormatted}</p>
            </div>
          </div>
        )}
        {/* Conditional display: Payment Status - only show if paymentStatus is not null */}
        {customerInfo.paymentStatus && (
          <div className="flex items-start">
            <ShieldCheck
              size={16}
              className="mr-3 text-muted-foreground mt-1"
            />
            <div>
              <p className="font-semibold text-muted-foreground text-sm">
                Payment Status
              </p>
              <PaymentStatusBadge status={customerInfo.paymentStatus} />
            </div>
          </div>
        )}
        <div className="flex items-start">
          <MapPin size={16} className="mr-3 text-muted-foreground mt-1" />
          <div>
            <p className="font-semibold text-muted-foreground text-sm">
              Address
            </p>
            <p className="whitespace-normal">{customerInfo.address || "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
