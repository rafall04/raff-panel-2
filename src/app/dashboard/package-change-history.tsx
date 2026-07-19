"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { PackageChangeRequest } from "@/services/package-change.service";
import { Loader2, Package, Calendar, User, FileText } from "lucide-react";

// Helper function untuk format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper function untuk format date
const formatDate = (dateString: string | null): string => {
  if (!dateString) {
    return "N/A";
  }
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Helper function untuk get status badge variant
const getStatusBadgeVariant = (
  status: string,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "pending":
      return "secondary";
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    case "cancelled":
      return "outline";
    default:
      return "outline";
  }
};

// Helper function untuk get status badge class
const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/20 text-yellow-600 border-yellow-500";
    case "approved":
      return "bg-green-500/20 text-green-600 border-green-500";
    case "rejected":
      return "bg-red-500/20 text-red-600 border-red-500";
    case "cancelled":
      return "bg-gray-500/20 text-gray-600 border-gray-500";
    default:
      return "";
  }
};

export default function PackageChangeHistory() {
  const [data, setData] = useState<PackageChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/package-change-history");

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.message || "Gagal mengambil riwayat");
          setData([]);
          return;
        }

        const response = (await res.json()) as {
          success: boolean;
          data?: PackageChangeRequest[];
          message?: string;
        };

        if (!response.success || !Array.isArray(response.data)) {
          setError(response.message || "Gagal mengambil riwayat");
          setData([]);
          return;
        }

        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <Package className="h-5 w-5" />
            </span>
            Riwayat Perubahan Paket
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Memuat riwayat...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <Package className="h-5 w-5" />
            </span>
            Riwayat Perubahan Paket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <Package className="h-5 w-5" />
            </span>
            Riwayat Perubahan Paket
          </CardTitle>
          <CardDescription>
            Riwayat semua permintaan perubahan paket Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Package}
            title="Belum ada riwayat"
            description="Permintaan perubahan paket Anda akan muncul di sini."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="icon-chip">
            <Package className="h-5 w-5" />
          </span>
          Riwayat Perubahan Paket
        </CardTitle>
        <CardDescription>
          Riwayat semua permintaan perubahan paket Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((request) => (
            <div
              key={request.id}
              className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-semibold">
                    {request.currentPackageName} →{" "}
                    {request.requestedPackageName}
                  </h4>
                </div>
                <Badge
                  variant={getStatusBadgeVariant(request.status)}
                  className={getStatusBadgeClass(request.status)}
                >
                  {request.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold text-muted-foreground">
                        Paket Saat Ini
                      </p>
                      <p>
                        {request.currentPackageName} (
                        {formatCurrency(request.currentPackagePrice)})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold text-muted-foreground">
                        Paket yang Diminta
                      </p>
                      <p>
                        {request.requestedPackageName} (
                        {formatCurrency(request.requestedPackagePrice)})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold text-muted-foreground">
                        Tanggal Request
                      </p>
                      <p>{formatDate(request.createdAt)}</p>
                    </div>
                  </div>

                  {request.updatedAt && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold text-muted-foreground">
                          Tanggal Update
                        </p>
                        <p>{formatDate(request.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {request.approvedBy && (
                <div className="flex items-start gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-semibold text-muted-foreground">
                      Disetujui/Ditolak oleh
                    </p>
                    <p>{request.approvedBy}</p>
                  </div>
                </div>
              )}

              {request.notes && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-semibold text-muted-foreground">
                      Catatan
                    </p>
                    <p className="text-muted-foreground">{request.notes}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
