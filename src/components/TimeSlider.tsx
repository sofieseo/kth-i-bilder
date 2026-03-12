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
    <div className="fixed bottom-4 left-1/2 z-[1000] w-[min(560px,92vw)] -translate-x-1/2 border border-border/60 bg-foreground/90 backdrop-blur-md px-4 py-2.5 shadow-2xl">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-muted font-sans">
          Välj årtal
        </span>
        <span className="bg-primary px-2.5 py-px text-xs font-bold text-primary-foreground font-sans tracking-wide">
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
        className="w-full cursor-pointer h-1.5"
        style={{ accentColor: 'hsl(var(--primary))' }}
      />
      <div className="mt-0.5 flex justify-between text-[9px] text-muted font-sans tracking-wide">
        <span>1820</span>
        <span>1900</span>
        <span>1950</span>
        <span>2000</span>
        <span>2020</span>
      </div>
    </div>
  );
}
