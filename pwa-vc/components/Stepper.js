import { useRef } from 'react';

export default function Stepper({
  value, onChange,
  step = 1, min = 0, max = 9999,
  decimals,
  compact = false,
  style,
  inputStyle,
}) {
  const intervalRef = useRef(null);
  const timeoutRef  = useRef(null);

  const parsed = parseFloat(value) || 0;
  const dec = decimals != null
    ? decimals
    : step < 1 ? (String(step).split('.')[1]?.length ?? 1) : 0;

  function apply(delta) {
    const next = Math.max(min, Math.min(max, parseFloat((parsed + delta).toFixed(dec))));
    onChange(String(next));
  }

  function startPress(delta) {
    apply(delta);
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => apply(delta), 80);
    }, 420);
  }

  function stopPress() {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
  }

  return (
    <div className={`stepper${compact ? ' stepper--compact' : ''}`} style={style}>
      <button
        type="button"
        className="stepper-btn"
        onPointerDown={() => startPress(-step)}
        onPointerUp={stopPress}
        onPointerLeave={stopPress}
        onPointerCancel={stopPress}
        tabIndex={-1}
      >−</button>
      <input
        className="stepper-val"
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        step={step}
        min={min}
        max={max}
        style={inputStyle}
      />
      <button
        type="button"
        className="stepper-btn"
        onPointerDown={() => startPress(step)}
        onPointerUp={stopPress}
        onPointerLeave={stopPress}
        onPointerCancel={stopPress}
        tabIndex={-1}
      >+</button>
    </div>
  );
}
