"use client";

import { useState } from 'react';
import { submitReport } from './actions';
import { Send, LoaderCircle, MessageSquareWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

export default function ReportForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isErrorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
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

        try {
            const result = await submitReport(formData);

            if (result.success) {
                toast.success(result.message || "Report submitted successfully!");
                setCategory('');
                setDescription('');
            } else {
                setErrorMessage(result.message || "An unknown error occurred.");
                setErrorDialogOpen(true);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred.");
            setErrorDialogOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="form-control mt-6">
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <LoaderCircle className="animate-spin mr-2" /> : <Send className="mr-2" />}
                        {isLoading ? 'Sending...' : 'Send Report'}
                    </Button>
                </div>
            </form>

            <Dialog open={isErrorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-500 flex items-center">
                            <MessageSquareWarning className="mr-2" />
                            Report Submission Failed
                        </DialogTitle>
                        <DialogDescription>
                            {errorMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setErrorDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
