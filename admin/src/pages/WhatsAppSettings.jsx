import { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, QrCode, Power, Send, Check, X as XIcon } from 'lucide-react';
import { useAuth } from '../App';

export default function WhatsAppSettings() {
    const { token } = useAuth();
    const [status, setStatus] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/evolution/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setStatus(data);

                // If not connected, get QR code
                if (data.state !== 'open') {
                    await getQRCode();
                }
            }
        } catch (error) {
            console.error('Error checking status:', error);
            setStatus({ state: 'error', error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const getQRCode = async () => {
        try {
            const res = await fetch('/api/evolution/qrcode', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.base64 || data.qrcode?.base64) {
                    setQrCode(data.base64 || data.qrcode?.base64);
                }
            }
        } catch (error) {
            console.error('Error getting QR code:', error);
        }
    };

    const initInstance = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/evolution/init', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                await checkStatus();
            }
        } catch (error) {
            console.error('Error initializing:', error);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        if (!confirm('WhatsApp bağlantısını kesmek istediğinizden emin misiniz?')) return;

        try {
            setLoading(true);
            await fetch('/api/evolution/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStatus(null);
            setQrCode(null);
            await checkStatus();
        } catch (error) {
            console.error('Error logging out:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendTestMessage = async (e) => {
        e.preventDefault();
        if (!testPhone || !testMessage) return;

        try {
            setSending(true);
            const res = await fetch('/api/evolution/test', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone: testPhone, message: testMessage })
            });

            if (res.ok) {
                alert('Mesaj gönderildi!');
                setTestMessage('');
            } else {
                alert('Mesaj gönderilemedi');
            }
        } catch (error) {
            console.error('Error sending test message:', error);
            alert('Mesaj gönderilemedi');
        } finally {
            setSending(false);
        }
    };

    const isConnected = status?.state === 'open';

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">WhatsApp Ayarları</h1>
                <button className="btn btn-secondary" onClick={checkStatus} disabled={loading}>
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    Yenile
                </button>
            </div>

            {/* Connection Status */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="whatsapp-status">
                    <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                    <div style={{ flex: 1 }}>
                        <strong>{isConnected ? 'Bağlı' : 'Bağlı Değil'}</strong>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            {loading ? 'Kontrol ediliyor...' :
                                isConnected ? 'WhatsApp bağlantısı aktif' :
                                    'QR kodu tarayarak bağlanın'}
                        </div>
                    </div>
                    {isConnected ? (
                        <button className="btn btn-danger btn-sm" onClick={logout}>
                            <Power size={16} />
                            Bağlantıyı Kes
                        </button>
                    ) : (
                        <button className="btn btn-primary btn-sm" onClick={initInstance}>
                            <QrCode size={16} />
                            Bağlan
                        </button>
                    )}
                </div>

                {/* QR Code */}
                {!isConnected && qrCode && (
                    <div className="qr-container">
                        <p style={{ marginBottom: '1rem', color: '#333' }}>
                            WhatsApp uygulamasından bu QR kodu tarayın
                        </p>
                        <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" />
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={getQRCode}
                            style={{ marginTop: '1rem' }}
                        >
                            <RefreshCw size={16} />
                            Yeni QR Kod
                        </button>
                    </div>
                )}
            </div>

            {/* Test Message */}
            {isConnected && (
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Test Mesajı Gönder</h2>
                    </div>

                    <form onSubmit={sendTestMessage}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Telefon Numarası</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="905xxxxxxxxx"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mesaj</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Test mesajı..."
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={sending}>
                            <Send size={20} />
                            {sending ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                    </form>
                </div>
            )}

            {/* Instructions */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                    <h2 className="card-title">Nasıl Çalışır?</h2>
                </div>
                <div style={{ lineHeight: 1.8 }}>
                    <p><strong>1. Bağlantı:</strong> QR kodu WhatsApp uygulamanızdan tarayın</p>
                    <p><strong>2. Müşteri Mesajları:</strong> Müşteriler size WhatsApp'tan mesaj attığında, chatbot otomatik yanıt verir</p>
                    <p><strong>3. Araç Arama:</strong> Müşteriler stokta marka/model arayabilir</p>
                    <p><strong>4. Randevu:</strong> Müşteriler chatbot üzerinden randevu alabilir</p>
                    <p><strong>5. Yönetim:</strong> Bu panelden araçları ve randevuları yönetebilirsiniz</p>
                </div>
            </div>
        </div>
    );
}
