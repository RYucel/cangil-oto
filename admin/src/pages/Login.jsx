import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Lock, User } from 'lucide-react';
import { useAuth } from '../App';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError('Geçersiz kullanıcı adı veya şifre');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-title">
                    <Car size={48} color="#f97316" style={{ marginBottom: '1rem' }} />
                    <h1>Cangil Oto</h1>
                    <p>Admin Panel</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="badge badge-error" style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center', padding: '0.75rem' }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">
                            <User size={16} style={{ marginRight: '0.5rem' }} />
                            Kullanıcı Adı
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Lock size={16} style={{ marginRight: '0.5rem' }} />
                            Şifre
                        </label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </div>
    );
}
