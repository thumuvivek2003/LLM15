import Slider from './Slider.jsx';
import TextArea from './TextArea.jsx';


export default function PresetForm({ preset, setPreset, onRun, running }) {
    return (
        <div style={{ display: 'grid', gap: 12 }}>
            <label>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Name</div>
                <input value={preset.name} onChange={e => setPreset({ ...preset, name: e.target.value })}
                    placeholder="My preset"
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
            </label>


            <label>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Model</div>
                <input value={preset.model} onChange={e => setPreset({ ...preset, model: e.target.value })}
                    placeholder="gpt-4o-mini"
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
            </label>


            <Slider label="Temperature" min={0} max={2} step={0.1}
                value={preset.temperature}
                onChange={v => setPreset({ ...preset, temperature: v })} />


            <Slider label="top_p" min={0} max={1} step={0.05}
                value={preset.top_p}
                onChange={v => setPreset({ ...preset, top_p: v })} />


            <TextArea label="System Prompt" rows={4}
                value={preset.systemPrompt}
                placeholder="You are a helpful assistant..."
                onChange={v => setPreset({ ...preset, systemPrompt: v })} />


            <TextArea label="User Prompt" rows={8}
                value={preset.userPrompt}
                placeholder="Explain temperature vs top_p to a beginner."
                onChange={v => setPreset({ ...preset, userPrompt: v })} />


            <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onRun(false)} disabled={running}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#111', color: '#fff' }}>
                    Run (no stream)
                </button>
                <button onClick={() => onRun(true)} disabled={running}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd' }}>
                    Run (stream)
                </button>
            </div>
        </div>
    );
}