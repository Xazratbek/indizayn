
"use client";

import { Button } from "./ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  onNext: () => void;
  onPrev: () => void;
  isNextDisabled: boolean;
  isPrevDisabled: boolean;
}

export default function PaginationControls({
  currentPage,
  onNext,
  onPrev,
  isNextDisabled,
  isPrevDisabled,
}: PaginationControlsProps) {
  return (
    <div className="flex justify-center items-center gap-4 mt-12">
      <Button onClick={onPrev} disabled={isPrevDisabled} variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Oldingisi
      </Button>
      <span className="font-medium text-sm">Sahifa {currentPage}</span>
      <Button onClick={onNext} disabled={isNextDisabled} variant="outline">
        Keyingisi
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

    