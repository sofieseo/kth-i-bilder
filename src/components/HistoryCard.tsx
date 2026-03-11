import { BookOpen, ImageOff } from "lucide-react";
import type { HistoryResult } from "@/data/mockResults";

interface HistoryCardProps {
  result: HistoryResult;
}

export function HistoryCard({ result }: HistoryCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md">
      <div className="mb-2 flex h-28 items-center justify-center rounded-md bg-muted">
        <ImageOff className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <h3 className="font-display text-sm font-semibold leading-tight text-card-foreground">
        {result.title}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{result.description}</p>
      <div className="mt-2 flex items-center gap-1.5">
        <BookOpen className="h-3 w-3 text-primary" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
          {result.source}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">{result.year}</span>
      </div>
    </div>
  );
}
