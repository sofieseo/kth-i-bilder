import { Clock } from "lucide-react";

interface TimeSliderProps {
  year: number;
  onChange: (year: number) => void;
}

export function TimeSlider({ year, onChange }: TimeSliderProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[1000] w-[min(600px,90vw)] -translate-x-1/2 panel-glass border border-border px-5 py-3 shadow-xl">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-semibold text-foreground">Årtal</span>
        </div>
        <span className="bg-primary px-3 py-0.5 font-display text-sm font-bold text-primary-foreground">
          {year}
        </span>
      </div>
      <input
        type="range"
        min={1827}
        max={2027}
        value={year}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-primary"
      />
      <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
        <span>1827</span>
        <span>1900</span>
        <span>1950</span>
        <span>2000</span>
        <span>2027</span>
      </div>
    </div>
  );
}
