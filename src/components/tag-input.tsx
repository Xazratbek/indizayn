"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TagInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder: string;
}

export function TagInput({ value, onChange, placeholder }: TagInputProps) {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            if (inputValue.trim() && !value.includes(inputValue.trim())) {
                onChange([...value, inputValue.trim()]);
                setInputValue("");
            } else {
                 setInputValue("");
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[2.5rem]">
                {value.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1 text-sm">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
            />
        </div>
    );
}
