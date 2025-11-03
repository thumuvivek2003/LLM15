import { useState } from 'react';
import { register, login } from '../api';


export default function Login({ onAuth }) {
    const [isReg, setIsReg] = useState(true);
    const [orgName, setOrgName] = useState('My Org');
    const [email, setEmail] = useState('admin@example.com');
    const [name, setName] = useState('Admin');
    const [password, setPassword] = useState('password');
    const [msg, setMsg] = useState('');


    async function go() {
        try {
            const data = isReg ? await register(orgName, email, name, password) : await login(email, password);
            onAuth({ orgId: data.orgId || localStorage.getItem('orgId'), user: data.user });
            if (data.orgId) localStorage.setItem('orgId', data.orgId);
        } catch (e) { setMsg('⚠️ ' + (e.message || e)); }
    }


    return (
        <div style={{ maxWidth: 420, margin: '10vh auto', border: '1px solid #eee', borderRadius: 10, padding: 16 }}>
            <h3>{isReg ? 'Register org + owner' : 'Login'}</h3>
            {isReg && <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Org name" style={{ width: '100%', padding: 8, margin: '6px 0', border: '1px solid #ddd', borderRadius: 8 }} />}
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: 8, margin: '6px 0', border: '1px solid #ddd', borderRadius: 8 }} />
            {isReg && <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={{ width: '100%', padding: 8, margin: '6px 0', border: '1px solid #ddd', borderRadius: 8 }} />}
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: 8, margin: '6px 0', border: '1px solid #ddd', borderRadius: 8 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                <button onClick={go} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>{isReg ? 'Create & Sign in' : 'Sign in'}</button>
                <label style={{ marginLeft: 'auto', fontSize: 12 }}><input type="checkbox" checked={!isReg} onChange={e => setIsReg(!e.target.checked)} /> Have an account</label>
            </div>
            {msg && <div style={{ marginTop: 8, opacity: 0.7 }}>{msg}</div>}
        </div>
    );
}