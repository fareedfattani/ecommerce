import { createContext, useContext, useEffect, useState } from 'react';
import { api, unwrap } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = () => api.get('/cp/user').then((r) => {
        const payload = unwrap(r);
        setUser(payload?.user ?? payload);
    }).catch(() => setUser(null)).finally(() => setLoading(false));
    useEffect(() => { refresh(); }, []);

    const login = async (credentials) => {
        const result = await api.post('/cp/login', credentials);
        const payload = unwrap(result);
        setUser(payload?.user ?? payload);
        return payload;
    };
    const logout = async () => {
        await api.post('/cp/logout').catch(() => {});
        setUser(null);
    };
    return <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
