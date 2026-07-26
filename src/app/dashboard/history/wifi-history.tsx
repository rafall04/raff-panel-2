"use client";

import { useEffect, useState } from "react";
import type { WifiChangeItem } from "@/services/wifi-history.service";
import type { LucideIcon } from "lucide-react";
import { Wifi, KeyRound, Radio, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { formatDateTime } from "@/lib/format";

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
    return <ListSkeleton />;
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
    <Timeline>
      {items.map((it, index) => (
        <TimelineItem
          key={it.id}
          icon={iconFor(it.type)}
          tone="brand"
          isLast={index === items.length - 1}
          title={it.description}
          meta={
            <>
              <span>{formatDateTime(it.timestamp)}</span>
              <Badge variant="secondary" className="font-normal">
                {it.sourceLabel}
              </Badge>
            </>
          }
        />
      ))}
    </Timeline>
  );
}
