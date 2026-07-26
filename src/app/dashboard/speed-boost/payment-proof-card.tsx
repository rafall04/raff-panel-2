"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Receipt, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadPaymentProof } from "../actions";
import type { SpeedRequestAwaitingProof } from "@/services/speed-boost.service";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024;

const ACCEPTED_TYPES =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf";

const paymentMethodLabel: Record<string, string> = {
  cash: "Tunai",
  transfer: "Transfer",
};

export default function PaymentProofCard({
  request,
  onUploaded,
}: {
  request: SpeedRequestAwaitingProof;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }

    // Checked here purely so the customer finds out before spending upload
    // bandwidth; the server re-checks both size and type regardless.
    if (selected.size > MAX_PROOF_SIZE_BYTES) {
      toast.error("Ukuran file maksimal 5MB.");
      clearFile();
      return;
    }

    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Pilih file bukti pembayaran terlebih dahulu.");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadPaymentProof("sod", file, caption.trim());

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      clearFile();
      setCaption("");
      onUploaded();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    // Warning-toned rather than brand-toned: this card is an outstanding
    // obligation, and it must not read like just another offer on the page.
    <Card className="border-warning/40 shadow-pop">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/12 text-warning ring-1 ring-inset ring-warning/25">
            <Receipt className="h-[18px] w-[18px]" />
          </span>
          Menunggu Bukti Pembayaran
        </CardTitle>
        <CardDescription className="mt-1.5">
          Permintaan boost ke{" "}
          <b className="text-foreground">{request.requestedPackageName}</b>{" "}
          selama {request.durationKey.replace("_", " ")} sebesar{" "}
          <b className="tabular text-foreground">
            {currencyFormatter.format(request.price)}
          </b>{" "}
          ({paymentMethodLabel[request.paymentMethod] || request.paymentMethod}
          ). Kirim bukti pembayaran agar admin dapat memprosesnya.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="proof">Bukti pembayaran</Label>
          <Input
            id="proof"
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            disabled={isUploading}
            className="cursor-pointer py-2.5 file:mr-3 file:cursor-pointer file:rounded-md file:bg-muted file:px-3 file:py-1.5"
          />
          {file && (
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 py-1.5 pl-3 pr-1.5 text-sm">
              <span className="truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={clearFile}
                disabled={isUploading}
                aria-label="Hapus file terpilih"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Gambar atau PDF, maksimal 5MB.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="caption">Catatan (opsional)</Label>
          <Textarea
            id="caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Contoh: sudah transfer via BCA pagi ini"
            rows={2}
            disabled={isUploading}
          />
        </div>

        <Button
          className="w-full"
          onClick={() => {
            void handleUpload();
          }}
          disabled={isUploading || !file}
        >
          {isUploading ? <LoaderCircle className="animate-spin" /> : <Upload />}
          {isUploading ? "Mengirim..." : "Kirim Bukti Pembayaran"}
        </Button>
      </CardContent>
    </Card>
  );
}
