"use client";

import { useEffect, useState } from "react";
import type { WifiChangeItem } from "@/services/wifi-history.service";
import type { LucideIcon } from "lucide-react";
import { Loader2, Wifi, KeyRound, Radio, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

function iconFor(type: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    password: KeyRound,
    transmit_power: Radio,
    ssid_name: Type,
  };
  return map[type] ?? Wifi;
}

export default function WifiHistory() {
  const [items, setItems] = useState<WifiChangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/wifi-change-history");
        const json = (await res.json()) as {
          success: boolean;
          data?: WifiChangeItem[];
          message?: string;
        };
        if (!res.ok || !json.success) {
          setError(json.message || "Gagal memuat riwayat perubahan WiFi");
          setItems([]);
          return;
        }
        setItems(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Terjadi kesalahan");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat riwayat WiFi...
      </div>
    );
  }
  if (error) {
    return <EmptyState icon={Wifi} title="Gagal memuat" description={error} />;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Wifi}
        title="Belum ada perubahan WiFi"
        description="Perubahan nama atau kata sandi WiFi Anda akan tercatat di sini."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((it) => {
        const Icon = iconFor(it.type);
        return (
          <div key={it.id} className="tile flex items-start gap-3">
            <span className="icon-chip mt-0.5 h-10 w-10">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{it.description}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {new Date(it.timestamp).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <Badge variant="secondary" className="font-normal">
                  {it.sourceLabel}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
