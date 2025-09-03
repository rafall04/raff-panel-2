"use client";

import { useState } from 'react';
import { submitReport } from './actions';
import { Send, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

export default function ReportForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!category || !description) {
            toast.error("Mohon isi semua kolom yang diperlukan.");
            return;
        }

        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        // Manually append state values to FormData since Select and Textarea are controlled
        formData.set('category', category);
        formData.set('description', description);

        try {
            const result = await submitReport(formData);

            if (result.success) {
                toast.success(result.message || "Laporan berhasil dikirim!");
                setCategory('');
                setDescription('');
            } else {
                toast.error(result.message || "Terjadi kesalahan yang tidak diketahui.");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card className="border-none shadow-none">
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                        <Label htmlFor="category">Kategori Masalah</Label>
                        <Select name="category" required onValueChange={setCategory} value={category}>
                            <SelectTrigger id="category" className="w-full">
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Slow Connection">Koneksi Lambat</SelectItem>
                                <SelectItem value="No Connection">Tidak Ada Koneksi</SelectItem>
                                <SelectItem value="Other">Lainnya</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi</Label>
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
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <LoaderCircle className="animate-spin mr-2" /> : <Send className="mr-2" />}
                        {isLoading ? 'Mengirim...' : 'Kirim Laporan'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
