"use client";

import { useState } from "react";
import { submitReport, uploadReportPhoto } from "./actions";
import { Send, LoaderCircle, X } from "lucide-react";
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
                <SelectItem value="MATI">💀 Internet Mati Total</SelectItem>
                <SelectItem value="LEMOT">🐌 Internet Lemot</SelectItem>
                <SelectItem value="PUTUS_NYAMBUNG">
                  🔄 Putus-Nyambung
                </SelectItem>
                <SelectItem value="WIFI">📶 Masalah WiFi</SelectItem>
                <SelectItem value="HARDWARE">🔧 Masalah Hardware</SelectItem>
                <SelectItem value="GENERAL">📋 Lainnya/Umum</SelectItem>
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
            <Label htmlFor="photos" className="text-sm font-medium">
              Upload Foto{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (Opsional, maks 3 foto, 5MB per foto)
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
              className="cursor-pointer"
            />
            {photos.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Foto terpilih: {photos.length} / 3
              </div>
            )}
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        removePhoto(index);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isLoading || isUploading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
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
            size="default"
          >
            {isLoading ? (
              <LoaderCircle className="animate-spin mr-2" />
            ) : isUploading ? (
              <LoaderCircle className="animate-spin mr-2" />
            ) : (
              <Send className="mr-2" />
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
            <div className="text-sm text-muted-foreground text-center">
              Laporan sudah tercatat dengan Ticket ID: {ticketId}
            </div>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
