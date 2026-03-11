

const DECADES = [
  1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890,
  1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990,
  2000, 2010, 2020,
];

interface TimeSliderProps {
  year: number;
  onChange: (year: number) => void;
}

export function TimeSlider({ year, onChange }: TimeSliderProps) {
  const decadeIndex = DECADES.indexOf(year) >= 0
    ? DECADES.indexOf(year)
    : DECADES.findIndex((d) => d >= year) || 0;

  const label = `${year}-talet`;

  return (
    <div className="fixed bottom-6 left-1/2 z-[1000] w-[min(600px,90vw)] -translate-x-1/2 panel-glass border border-border px-5 py-3 shadow-xl">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-semibold text-foreground">Årtionde</span>
        </div>
        <span className="bg-primary px-3 py-0.5 font-display text-sm font-bold text-primary-foreground">
          {label}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={DECADES.length - 1}
        step={1}
        value={decadeIndex}
        onChange={(e) => onChange(DECADES[Number(e.target.value)])}
        className="w-full cursor-pointer accent-primary"
      />
      <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
        <span>1820</span>
        <span>1900</span>
        <span>1950</span>
        <span>2000</span>
        <span>2020</span>
      </div>
    </div>
  );
}
