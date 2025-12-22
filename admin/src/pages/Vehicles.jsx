import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { useAuth } from '../App';

const BODY_TYPES = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'suv', label: 'SUV' },
    { value: 'pickup', label: 'Pick-up' },
    { value: 'minivan', label: 'Minivan' },
    { value: 'coupe', label: 'Coupe' },
    { value: 'cabrio', label: 'Cabrio' },
    { value: 'panelvan', label: 'Panelvan' },
    { value: 'motosiklet', label: 'Motosiklet' },
    { value: 'karavan', label: 'Karavan' },
    { value: 'atv', label: 'ATV' }
];

const FUEL_TYPES = [
    { value: 'benzin', label: 'Benzin' },
    { value: 'dizel', label: 'Dizel' },
    { value: 'elektrik', label: 'Elektrik' },
    { value: 'hibrit', label: 'Hibrit' },
    { value: 'lpg', label: 'LPG' }
];

const TRANSMISSIONS = [
    { value: 'manuel', label: 'Manuel' },
    { value: 'otomatik', label: 'Otomatik' }
];

const STATUSES = [
    { value: 'active', label: 'Aktif' },
    { value: 'sold', label: 'Satıldı' },
    { value: 'reserved', label: 'Rezerve' },
    { value: 'inactive', label: 'Pasif' }
];

const emptyVehicle = {
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    mileage: '',
    color: '',
    fuelType: 'benzin',
    transmission: 'otomatik',
    bodyType: 'sedan',
    description: '',
    status: 'active',
    featured: false
};

export default function Vehicles() {
    const { token } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [formData, setFormData] = useState(emptyVehicle);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadVehicles();
    }, [page, searchQuery]);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page,
                limit: 10,
                status: '' // Get all statuses
            });
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`/api/vehicles?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setVehicles(data.vehicles || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch (error) {
            console.error('Error loading vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingVehicle
                ? `/api/vehicles/${editingVehicle.id}`
                : '/api/vehicles';

            const res = await fetch(url, {
                method: editingVehicle ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    price: formData.price ? parseFloat(formData.price) : null,
                    mileage: formData.mileage ? parseInt(formData.mileage) : null
                })
            });

            if (res.ok) {
                setShowModal(false);
                setEditingVehicle(null);
                setFormData(emptyVehicle);
                loadVehicles();
            }
        } catch (error) {
            console.error('Error saving vehicle:', error);
        }
    };

    const handleEdit = (vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            price: vehicle.price || '',
            mileage: vehicle.mileage || '',
            color: vehicle.color || '',
            fuelType: vehicle.fuelType || 'benzin',
            transmission: vehicle.transmission || 'otomatik',
            bodyType: vehicle.bodyType || 'sedan',
            description: vehicle.description || '',
            status: vehicle.status,
            featured: vehicle.featured || false
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu aracı silmek istediğinizden emin misiniz?')) return;

        try {
            await fetch(`/api/vehicles/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            loadVehicles();
        } catch (error) {
            console.error('Error deleting vehicle:', error);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: 'badge-success',
            sold: 'badge-info',
            reserved: 'badge-warning',
            inactive: 'badge-error'
        };
        const labels = STATUSES.find(s => s.value === status)?.label || status;
        return <span className={`badge ${badges[status]}`}>{labels}</span>;
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Araçlar</h1>
                <button className="btn btn-primary" onClick={() => {
                    setEditingVehicle(null);
                    setFormData(emptyVehicle);
                    setShowModal(true);
                }}>
                    <Plus size={20} />
                    Yeni Araç
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Marka veya model ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '3rem' }}
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div className="empty-state">Yükleniyor...</div>
                ) : vehicles.length === 0 ? (
                    <div className="empty-state">
                        <p>Henüz araç eklenmemiş</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Araç</th>
                                    <th>Yıl</th>
                                    <th>Fiyat</th>
                                    <th>KM</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehicles.map(vehicle => (
                                    <tr key={vehicle.id}>
                                        <td>
                                            <strong>{vehicle.brand} {vehicle.model}</strong>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                {vehicle.color} • {vehicle.transmission === 'otomatik' ? 'Otomatik' : 'Manuel'}
                                            </div>
                                        </td>
                                        <td>{vehicle.year}</td>
                                        <td>{vehicle.price ? `${vehicle.price.toLocaleString()} ₺` : '-'}</td>
                                        <td>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '-'}</td>
                                        <td>{getStatusBadge(vehicle.status)}</td>
                                        <td>
                                            <div className="actions">
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(vehicle)}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(vehicle.id)}>
                                                    <Trash2 size={16} />
                                                </button>
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

            {/* Vehicle Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingVehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Marka *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Model *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Yıl *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        min="1900"
                                        max={new Date().getFullYear() + 1}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Fiyat (₺)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Kilometre</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.mileage}
                                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Renk</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Yakıt Tipi</label>
                                    <select
                                        className="form-select"
                                        value={formData.fuelType}
                                        onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                                    >
                                        {FUEL_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Vites</label>
                                    <select
                                        className="form-select"
                                        value={formData.transmission}
                                        onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                                    >
                                        {TRANSMISSIONS.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Kasa Tipi</label>
                                    <select
                                        className="form-select"
                                        value={formData.bodyType}
                                        onChange={(e) => setFormData({ ...formData, bodyType: e.target.value })}
                                    >
                                        {BODY_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Durum</label>
                                    <select
                                        className="form-select"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        {STATUSES.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Açıklama</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingVehicle ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
