
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from './ui/scroll-area';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  allTags: readonly string[];
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
}

export function TagSelector({ allTags, selectedTags, onSelectedTagsChange }: TagSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleTagToggle = (tag: string) => {
    const isSelected = selectedTags.includes(tag);
    if (isSelected) {
      onSelectedTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onSelectedTagsChange([...selectedTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onSelectedTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };


  return (
    <div>
        <div className="flex flex-wrap gap-2 mb-2 min-h-[2.5rem]">
            {selectedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="pl-3 pr-1 py-1 text-sm">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
        </div>
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                Teg tanlash...
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                 <Command>
                    <CommandInput placeholder="Teglarni qidirish..." />
                    <CommandList>
                        <CommandEmpty>Hech narsa topilmadi.</CommandEmpty>
                        <ScrollArea className="h-48">
                            <CommandGroup>
                            {allTags.map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                <CommandItem
                                    key={tag}
                                    onSelect={() => handleTagToggle(tag)}
                                    value={tag}
                                >
                                     <div className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "opacity-50 [&_svg]:invisible"
                                    )}>
                                        <Check className={cn("h-4 w-4")} />
                                    </div>
                                    <span>{tag}</span>
                                </CommandItem>
                                );
                            })}
                            </CommandGroup>
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    </div>
  );
}
