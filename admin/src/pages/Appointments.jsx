import { useState, useEffect } from 'react';
import { Calendar, Check, X as XIcon, Clock, Phone } from 'lucide-react';
import { useAuth } from '../App';

const STATUSES = [
    { value: 'pending', label: 'Bekliyor' },
    { value: 'confirmed', label: 'Onaylandı' },
    { value: 'cancelled', label: 'İptal' },
    { value: 'completed', label: 'Tamamlandı' }
];

export default function Appointments() {
    const { token } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadAppointments();
    }, [page, filter]);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 15 });
            if (filter !== 'all') params.append('status', filter);

            const res = await fetch(`/api/appointments?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAppointments(data.appointments || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch (error) {
            console.error('Error loading appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await fetch(`/api/appointments/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            loadAppointments();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-warning',
            confirmed: 'badge-success',
            cancelled: 'badge-error',
            completed: 'badge-info'
        };
        const label = STATUSES.find(s => s.value === status)?.label || status;
        return <span className={`badge ${badges[status]}`}>{label}</span>;
    };

    const isToday = (dateStr) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    };

    const isPast = (dateStr) => {
        return new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Randevular</h1>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['all', ...STATUSES.map(s => s.value)].map(f => (
                        <button
                            key={f}
                            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setFilter(f); setPage(1); }}
                        >
                            {f === 'all' ? 'Tümü' : STATUSES.find(s => s.value === f)?.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div className="empty-state">Yükleniyor...</div>
                ) : appointments.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} />
                        <p>Randevu bulunamadı</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Saat</th>
                                    <th>Müşteri</th>
                                    <th>Telefon</th>
                                    <th>Araç</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map(apt => (
                                    <tr key={apt.id} style={{
                                        background: isToday(apt.appointmentDate) ? 'rgba(249, 115, 22, 0.1)' :
                                            isPast(apt.appointmentDate) ? 'rgba(100, 100, 100, 0.1)' : undefined
                                    }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Calendar size={16} />
                                                {formatDate(apt.appointmentDate)}
                                                {isToday(apt.appointmentDate) && (
                                                    <span className="badge badge-success">Bugün</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Clock size={16} />
                                                {apt.appointmentTime?.substring(0, 5)}
                                            </div>
                                        </td>
                                        <td><strong>{apt.customerName}</strong></td>
                                        <td>
                                            <a
                                                href={`tel:${apt.customerPhone}`}
                                                style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                            >
                                                <Phone size={14} />
                                                {apt.customerPhone}
                                            </a>
                                        </td>
                                        <td>
                                            {apt.vehicle ? (
                                                <span>{apt.vehicle.brand} {apt.vehicle.model}</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                                            )}
                                        </td>
                                        <td>{getStatusBadge(apt.status)}</td>
                                        <td>
                                            <div className="actions">
                                                {apt.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm"
                                                            style={{ background: 'var(--success)', color: 'white' }}
                                                            onClick={() => updateStatus(apt.id, 'confirmed')}
                                                            title="Onayla"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => updateStatus(apt.id, 'cancelled')}
                                                            title="İptal Et"
                                                        >
                                                            <XIcon size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                {apt.status === 'confirmed' && (
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: '#3b82f6', color: 'white' }}
                                                        onClick={() => updateStatus(apt.id, 'completed')}
                                                        title="Tamamlandı"
                                                    >
                                                        <Check size={16} /> Tamamla
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Önceki
                        </button>
                        <span style={{ padding: '0.5rem 1rem' }}>
                            {page} / {totalPages}
                        </span>
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Sonraki
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
