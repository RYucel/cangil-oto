import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Car, Calendar, MessageSquare, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Appointments from './pages/Appointments';
import WhatsAppSettings from './pages/WhatsAppSettings';
import Login from './pages/Login';

// Auth Context
const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}

function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verify token on mount
        if (token) {
            fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Invalid token');
                    setLoading(false);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setToken(null);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) throw new Error('Login failed');

        const data = await res.json();
        localStorage.setItem('token', data.token);
        setToken(data.token);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    if (loading) {
        return <div className="login-container">Yükleniyor...</div>;
    }

    return (
        <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
}

function Sidebar() {
    const { logout } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <Car size={28} color="#f97316" />
                <h1>Cangil Oto</h1>
            </div>

            <nav className="nav-links">
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={20} />
                    Dashboard
                </NavLink>
                <NavLink to="/vehicles" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Car size={20} />
                    Araçlar
                </NavLink>
                <NavLink to="/appointments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Calendar size={20} />
                    Randevular
                </NavLink>
                <NavLink to="/whatsapp" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <MessageSquare size={20} />
                    WhatsApp
                </NavLink>
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <button className="nav-link" onClick={logout} style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'none' }}>
                    <LogOut size={20} />
                    Çıkış Yap
                </button>
            </div>
        </aside>
    );
}

function AppLayout() {
    return (
        <div className="app">
            <Sidebar />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/vehicles" element={<Vehicles />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/whatsapp" element={<WhatsAppSettings />} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/*" element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    } />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
