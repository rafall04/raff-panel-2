"use client";

import { useState } from "react";
import { submitReport, uploadReportPhoto } from "./actions";
import type { LucideIcon } from "lucide-react";
import {
  Send,
  LoaderCircle,
  X,
  PowerOff,
  Gauge,
  Repeat,
  Wifi,
  Wrench,
  ClipboardList,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

interface ReportFormProps {
  onSuccess?: () => void;
}

/**
 * Problem categories. These carried emoji before (💀 🐌 🔄) — emoji render
 * differently on every platform, can't be recoloured by the theme, and read as
 * jokey on a fault report. The `value`s are the backend's contract and are
 * unchanged.
 */
const REPORT_CATEGORIES: {
  value: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "MATI", label: "Internet Mati Total", icon: PowerOff },
  { value: "LEMOT", label: "Internet Lemot", icon: Gauge },
  { value: "PUTUS_NYAMBUNG", label: "Putus-Nyambung", icon: Repeat },
  { value: "WIFI", label: "Masalah WiFi", icon: Wifi },
  { value: "HARDWARE", label: "Masalah Hardware", icon: Wrench },
  { value: "GENERAL", label: "Lainnya / Umum", icon: ClipboardList },
];

/** Promise-wrapped FileReader so a batch of previews keeps its selection order. */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unexpected FileReader result"));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

export default function ReportForm({ onSuccess }: ReportFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }

    const files = Array.from(e.target.files);
    const maxPhotos = 3;
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Validate file count
    if (photos.length + files.length > maxPhotos) {
      toast.error(`Maksimal ${maxPhotos} foto per laporan`);
      return;
    }

    // Validate file size and type
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} terlalu besar. Maksimal 5MB per foto.`);
        continue;
      }

      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} bukan file gambar.`);
        continue;
      }

      validFiles.push(file);
    }

    // Clear the input up front so picking the same file again re-fires change.
    // Captured before the await: `e.target` must not be read afterwards.
    const input = e.target;
    input.value = "";

    if (validFiles.length === 0) {
      return;
    }

    // Previews are read with Promise.all rather than pushed from each onload.
    // Pushing meant previews landed in COMPLETION order while `photos` stayed in
    // SELECTION order, so a small screenshot picked after a large photo would
    // transpose the two arrays — and removePhoto() filters both by the same
    // index, dropping the wrong file. Promise.all preserves order, and a read
    // failure now drops the pair from both arrays instead of silently leaving
    // them misaligned (the old code also never handled reader.onerror, which
    // stranded the whole batch without previews).
    const results = await Promise.all(
      validFiles.map(async (file) => {
        try {
          return { file, preview: await readFileAsDataUrl(file) };
        } catch {
          toast.error(`Gagal membaca file ${file.name}.`);
          return null;
        }
      }),
    );

    const readable = results.filter(
      (item): item is { file: File; preview: string } => item !== null,
    );

    if (readable.length === 0) {
      return;
    }

    setPhotos((prev) => [...prev, ...readable.map((item) => item.file)]);
    setPhotoPreviews((prev) => [
      ...prev,
      ...readable.map((item) => item.preview),
    ]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const resetAndClose = () => {
    setCategory("");
    setDescription("");
    setPhotos([]);
    setPhotoPreviews([]);
    setTicketId(null);
    setUploadedCount(0);
    if (onSuccess) {
      onSuccess();
    }
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // A ticket from an earlier attempt is still held: this submit is a photo
    // retry, not a new report. Filing again would give the customer two tickets
    // for one problem.
    const isPhotoRetry = ticketId !== null;

    if (!isPhotoRetry && (!category || !description)) {
      toast.error("Mohon isi semua kolom yang diperlukan.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    // Manually append state values to FormData since Select and Textarea are controlled
    formData.set("category", category);
    formData.set("description", description);

    setIsLoading(true);
    try {
      let activeTicketId = ticketId;

      if (!isPhotoRetry) {
        const result = await submitReport(formData);

        if (!result.success) {
          toast.error(
            result.message || "Terjadi kesalahan yang tidak diketahui.",
          );
          return;
        }

        activeTicketId = result.ticketId ?? null;
        toast.success("Laporan berhasil dikirim!");
      }

      if (photos.length === 0) {
        resetAndClose();
        return;
      }

      if (!activeTicketId) {
        toast.warning(
          "Laporan berhasil dikirim, namun Ticket ID tidak tersedia. Foto tidak dapat diupload.",
        );
        resetAndClose();
        return;
      }

      // Hold the id so a failed upload can be retried against this same ticket.
      setTicketId(activeTicketId);

      setIsUploading(true);
      setUploadedCount(0);
      let successCount = 0;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (!photo) {
          continue;
        }

        const photoResult = await uploadReportPhoto(activeTicketId, photo);

        if (photoResult.success) {
          successCount += 1;
          setUploadedCount(successCount);
        } else {
          toast.error(`Gagal upload foto ${i + 1}: ${photoResult.message}`);
        }
      }

      setIsUploading(false);

      if (successCount === photos.length) {
        toast.success(
          `Semua foto berhasil diupload (${successCount}/${photos.length})`,
        );
        resetAndClose();
        return;
      }

      if (successCount > 0) {
        // Some got through. Retrying would re-send those and blow the backend's
        // 3-photo cap, so close rather than strand the customer in a loop.
        toast.warning(
          `${successCount} dari ${photos.length} foto berhasil diupload.`,
        );
        resetAndClose();
        return;
      }

      // Nothing uploaded. The dialog previously closed here anyway and wiped the
      // files — the ticket existed with no evidence and no way to attach any,
      // since the history page has no photo UI. Keep everything on screen so the
      // customer can simply press the button again.
      toast.error(
        "Tidak ada foto yang berhasil diupload. Laporan Anda sudah tercatat — silakan coba kirim fotonya lagi.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan tak terduga.",
      );
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      <Card className="border-none shadow-none">
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Kategori Masalah
            </Label>
            <Select
              name="category"
              required
              onValueChange={setCategory}
              value={category}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_CATEGORIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2.5">
                      <option.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Deskripsi
            </Label>
            <Textarea
              id="description"
              name="description"
              required
              placeholder="Jelaskan masalah yang Anda alami secara detail."
              className="resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="photos" className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
              Upload Foto
              <span className="text-xs font-normal text-muted-foreground">
                (opsional)
              </span>
            </Label>
            <Input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                void handlePhotoChange(e);
              }}
              disabled={photos.length >= 3 || isLoading || isUploading}
              className="cursor-pointer py-2.5 file:mr-3 file:cursor-pointer file:rounded-md file:bg-muted file:px-3 file:py-1.5"
            />
            <p className="text-xs text-muted-foreground">
              {photos.length > 0
                ? `Terpilih ${photos.length} dari 3 foto.`
                : "Maksimal 3 foto, 5MB per foto. Foto membantu teknisi mendiagnosis lebih cepat."}
            </p>
            {photoPreviews.length > 0 && (
              <div className="mt-1 grid grid-cols-3 gap-2">
                {photoPreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-lg border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {/* Always visible: the old hover-only control was
                        unreachable on the phones this form is filled on. */}
                    <button
                      type="button"
                      onClick={() => {
                        removePhoto(index);
                      }}
                      aria-label={`Hapus foto ${index + 1}`}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/70 text-white transition-colors hover:bg-destructive"
                      disabled={isLoading || isUploading}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="tabular absolute bottom-1 left-1 rounded bg-slate-950/70 px-1.5 py-0.5 text-[10px] text-white">
                      {(photos[index]?.size || 0) / 1024 / 1024 < 1
                        ? `${Math.round((photos[index]?.size || 0) / 1024)}KB`
                        : `${Math.round(((photos[index]?.size || 0) / 1024 / 1024) * 10) / 10}MB`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2 pt-4">
          <Button
            type="submit"
            disabled={isLoading || isUploading}
            className="w-full"
          >
            {isLoading || isUploading ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Send />
            )}
            {isLoading
              ? "Mengirim..."
              : isUploading
                ? `Upload foto... (${uploadedCount}/${photos.length})`
                : ticketId
                  ? "Coba Kirim Foto Lagi"
                  : "Kirim Laporan"}
          </Button>
          {ticketId && (
            <p className="text-center text-sm text-muted-foreground">
              Laporan sudah tercatat dengan Ticket ID:{" "}
              <span className="tabular font-medium text-foreground">
                {ticketId}
              </span>
            </p>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
