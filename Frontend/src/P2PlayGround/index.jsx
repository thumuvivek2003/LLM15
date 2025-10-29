import { useEffect, useMemo, useState } from 'react';
import { listPresets, createPreset, updatePreset, deletePreset, runOnce, runStream } from './api.js';
import PresetForm from './components/PresetForm.jsx';
import PresetList from './components/PresetList.jsx';
import Playground from './components/Playground.jsx';


const EMPTY = { name: 'New preset', model: 'gpt-4o-mini', temperature: 0.7, top_p: 1, systemPrompt: '', userPrompt: '', tags: [], notes: '' };
export default function P2PlayGround() {
    const [presets, setPresets] = useState([]);
    const [preset, setPreset] = useState(EMPTY);
    const [output, setOutput] = useState('');
    const [running, setRunning] = useState(false);
    async function refresh(q = '') {
        const data = await listPresets(q).catch(() => []);
        setPresets(data);
    }


    useEffect(() => { refresh(); }, []);


    async function save() {
        if (preset._id) {
            const updated = await updatePreset(preset._id, preset);
            setPreset(updated);
            await refresh();
        } else {
            const created = await createPreset(preset);
            setPreset(created);
            await refresh();
        }
    }


    async function remove(id) {
        await deletePreset(id);
        if (preset._id === id) setPreset(EMPTY);
        await refresh();
    }


    async function onRun(stream) {
        setRunning(true);
        setOutput('');
        const payload = {
            model: preset.model,
            systemPrompt: preset.systemPrompt,
            userPrompt: preset.userPrompt,
            temperature: preset.temperature,
            top_p: preset.top_p
        };


        try {
            if (!stream) {
                const res = await runOnce(payload);
                setOutput(res.content || '');
            } else {
                let acc = '';
                await runStream(payload, (delta) => {
                    acc += delta;
                    setOutput(acc);
                });
            }
        } catch (e) {
            setOutput('⚠️ ' + (e?.message || String(e)));
        } finally {
            setRunning(false);
        }
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 1fr', gap: 16, height: '100vh', padding: 16, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 12 }}>
                <div style={{ fontWeight: 700 }}>Presets</div>
                <div style={{ overflow: 'auto' }}>
                    <PresetList items={presets} onSelect={setPreset} onDelete={remove} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setPreset(EMPTY)} style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}>New</button>
                    <button onClick={save} style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, background: '#111', color: '#fff' }}>Save</button>
                </div>
            </div>


            <div style={{ overflow: 'auto' }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Editor</div>
                <PresetForm preset={preset} setPreset={setPreset} onRun={onRun} running={running} />
            </div>


            <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 8 }}>
                <div style={{ fontWeight: 700 }}>Playground</div>
                <Playground output={output} streaming={running} />
            </div>
        </div>
    );
}