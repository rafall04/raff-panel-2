"use client";

import { useState } from 'react';
import { submitReport } from './actions';
import { Send, LoaderCircle, MessageSquareWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
            toast.error("Please fill out all fields.");
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
                toast.success(result.message || "Report submitted successfully!");
                setCategory('');
                setDescription('');
            } else {
                toast.error(result.message || "An unknown error occurred.");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card className="border-none shadow-none">
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                        <Label htmlFor="category">Issue Category</Label>
                        <Select name="category" required onValueChange={setCategory} value={category}>
                            <SelectTrigger id="category" className="w-full">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Slow Connection">Slow Connection</SelectItem>
                                <SelectItem value="No Connection">No Connection</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            required
                            placeholder="Please describe the issue in detail."
                            className="resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <LoaderCircle className="animate-spin mr-2" /> : <Send className="mr-2" />}
                        {isLoading ? 'Sending...' : 'Send Report'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
