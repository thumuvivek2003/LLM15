export default function Slider({ label, min, max, step = 0.1, value, onChange }) {
    return (
        <label style={{ display: 'block', marginBottom: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{label}: <b>{value}</b></div>
            <input type="range" min={min} max={max} step={step}
                value={value} onChange={e => onChange(Number(e.target.value))}
                style={{ width: '100%' }} />
        </label>
    );
}