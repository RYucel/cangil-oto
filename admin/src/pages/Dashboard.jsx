import { useState, useEffect } from 'react';
import { Car, Calendar, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../App';

export default function Dashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState({
        totalVehicles: 0,
        activeVehicles: 0,
        todayAppointments: 0,
        pendingAppointments: 0
    });
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load vehicles count
            const vehiclesRes = await fetch('/api/vehicles?limit=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const vehiclesData = await vehiclesRes.json();

            // Load appointments
            const today = new Date().toISOString().split('T')[0];
            const appointmentsRes = await fetch(`/api/appointments?page=1&limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const appointmentsData = await appointmentsRes.json();

            setStats({
                totalVehicles: vehiclesData.pagination?.total || 0,
                activeVehicles: vehiclesData.pagination?.total || 0,
                todayAppointments: appointmentsData.appointments?.filter(a => a.appointmentDate === today).length || 0,
                pendingAppointments: appointmentsData.appointments?.filter(a => a.status === 'pending').length || 0
            });

            setRecentAppointments(appointmentsData.appointments || []);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
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
        const labels = {
            pending: 'Bekliyor',
            confirmed: 'Onaylandı',
            cancelled: 'İptal',
            completed: 'Tamamlandı'
        };
        return <span className={`badge ${badges[status]}`}>{labels[status]}</span>;
    };

    if (loading) {
        return <div>Yükleniyor...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <Car size={24} color="white" />
                    </div>
                    <div>
                        <div className="stat-value">{stats.totalVehicles}</div>
                        <div className="stat-label">Toplam Araç</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                        <TrendingUp size={24} color="white" />
                    </div>
                    <div>
                        <div className="stat-value">{stats.activeVehicles}</div>
                        <div className="stat-label">Aktif İlan</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                        <Calendar size={24} color="white" />
                    </div>
                    <div>
                        <div className="stat-value">{stats.todayAppointments}</div>
                        <div className="stat-label">Bugünkü Randevu</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)' }}>
                        <Users size={24} color="white" />
                    </div>
                    <div>
                        <div className="stat-value">{stats.pendingAppointments}</div>
                        <div className="stat-label">Bekleyen Randevu</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Son Randevular</h2>
                </div>

                {recentAppointments.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} />
                        <p>Henüz randevu bulunmuyor</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Müşteri</th>
                                    <th>Telefon</th>
                                    <th>Tarih</th>
                                    <th>Saat</th>
                                    <th>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAppointments.map(apt => (
                                    <tr key={apt.id}>
                                        <td>{apt.customerName}</td>
                                        <td>{apt.customerPhone}</td>
                                        <td>{formatDate(apt.appointmentDate)}</td>
                                        <td>{apt.appointmentTime?.substring(0, 5)}</td>
                                        <td>{getStatusBadge(apt.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
