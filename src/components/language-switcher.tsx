"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";

export function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations("Settings");

    const onSelectChange = (newLocale: string) => {
        // This regex is used to remove the current locale from the pathname
        const newPath = pathname.replace(/^\/(en|id)/, "");
        router.replace(`/${newLocale}${newPath}`);
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="language-select">{t("language")}</Label>
            <Select onValueChange={onSelectChange} defaultValue={locale}>
                <SelectTrigger id="language-select" className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="id">Bahasa Indonesia</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
