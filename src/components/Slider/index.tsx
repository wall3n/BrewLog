interface SliderProps {
  value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void; label?: string; displayValue?: string | number;
}
export function Slider({ value, min = 1, max = 5, step = 1, onChange, label, displayValue }: SliderProps) {
  return (
    <div className="slider-row">
      {label && <span className="slider-label">{label}</span>}
      <input type="range" className="brew-slider" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} />
      <span className="slider-val">{displayValue ?? value}</span>
    </div>
  );
}
