import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { useAuth } from '../App';

const CONDITIONS = [
    { value: 'sifir', label: 'Sıfır' },
    { value: '2el', label: '2.El' }
];

const BODY_TYPES = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'suv', label: 'SUV' },
    { value: 'pickup', label: 'Pick-up' },
    { value: 'minivan', label: 'Minivan' },
    { value: 'coupe', label: 'Coupe' },
    { value: 'cabrio', label: 'Cabrio' },
    { value: 'panelvan', label: 'Panelvan' },
    { value: 'station_wagon', label: 'Station Wagon' },
    { value: 'crossover', label: 'Crossover' },
    { value: 'mpv', label: 'MPV' },
    { value: 'roadster', label: 'Roadster' }
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
    { value: 'otomatik', label: 'Otomatik' },
    { value: 'yari_otomatik', label: 'Yarı Otomatik' }
];

const STEERING_TYPES = [
    { value: 'sol', label: 'Sol Direksiyon' },
    { value: 'sag', label: 'Sağ Direksiyon' }
];

const STATUSES = [
    { value: 'active', label: 'Aktif' },
    { value: 'sold', label: 'Satıldı' },
    { value: 'reserved', label: 'Rezerve' },
    { value: 'inactive', label: 'Pasif' }
];

const LOCATIONS = [
    'Lefkoşa',
    'Girne',
    'Girne / Alsancak',
    'Girne / Lapta',
    'Girne / Karaoğlanoğlu',
    'Gazimağusa',
    'Güzelyurt',
    'İskele',
    'Lefke'
];

const emptyVehicle = {
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    priceGBP: '',
    condition: '2el',
    mileage: '',
    color: '',
    fuelType: 'benzin',
    transmission: 'otomatik',
    engineCapacity: '',
    enginePower: '',
    bodyType: 'sedan',
    steeringType: 'sol',
    location: '',
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
                status: ''
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
                    priceGBP: formData.priceGBP ? parseFloat(formData.priceGBP) : null,
                    mileage: formData.mileage ? parseInt(formData.mileage) : null,
                    engineCapacity: formData.engineCapacity ? parseInt(formData.engineCapacity) : null,
                    enginePower: formData.enginePower ? parseInt(formData.enginePower) : null
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
            priceGBP: vehicle.priceGBP || '',
            condition: vehicle.condition || '2el',
            mileage: vehicle.mileage || '',
            color: vehicle.color || '',
            fuelType: vehicle.fuelType || 'benzin',
            transmission: vehicle.transmission || 'otomatik',
            engineCapacity: vehicle.engineCapacity || '',
            enginePower: vehicle.enginePower || '',
            bodyType: vehicle.bodyType || 'sedan',
            steeringType: vehicle.steeringType || 'sol',
            location: vehicle.location || '',
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

    const getConditionLabel = (condition) => {
        return CONDITIONS.find(c => c.value === condition)?.label || condition;
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
                                    <th>Konum</th>
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
                                                {getConditionLabel(vehicle.condition)} • {vehicle.color} • {vehicle.transmission === 'otomatik' ? 'Otomatik' : 'Manuel'}
                                            </div>
                                        </td>
                                        <td>{vehicle.year}</td>
                                        <td>{vehicle.priceGBP ? `£${Number(vehicle.priceGBP).toLocaleString()}` : 'Sorunuz'}</td>
                                        <td>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '-'}</td>
                                        <td>{vehicle.location || '-'}</td>
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
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingVehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {/* Temel Bilgiler */}
                            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                Temel Bilgiler
                            </h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Marka *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        placeholder="örn: Honda"
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
                                        placeholder="örn: Jazz"
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
                                    <label className="form-label">Fiyat (£ GBP)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.priceGBP}
                                        onChange={(e) => setFormData({ ...formData, priceGBP: e.target.value })}
                                        placeholder="Boş bırakırsanız 'Fiyat Sorunuz' görünür"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Araç Durumu</label>
                                    <select
                                        className="form-select"
                                        value={formData.condition}
                                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    >
                                        {CONDITIONS.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kilometre</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.mileage}
                                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                                        placeholder="örn: 217919"
                                    />
                                </div>
                            </div>

                            {/* Motor ve Performans */}
                            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                Motor ve Performans
                            </h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Yakıt Türü</label>
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
                                    <label className="form-label">Vites Tipi</label>
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
                                    <label className="form-label">Motor Hacmi (cc)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.engineCapacity}
                                        onChange={(e) => setFormData({ ...formData, engineCapacity: e.target.value })}
                                        placeholder="örn: 1340"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Motor Gücü (hp)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.enginePower}
                                        onChange={(e) => setFormData({ ...formData, enginePower: e.target.value })}
                                        placeholder="örn: 100"
                                    />
                                </div>
                            </div>

                            {/* Kasa ve Görünüm */}
                            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                Kasa ve Görünüm
                            </h3>

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
                                    <label className="form-label">Renk</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        placeholder="örn: Gümüş"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Direksiyon Tipi</label>
                                    <select
                                        className="form-select"
                                        value={formData.steeringType}
                                        onChange={(e) => setFormData({ ...formData, steeringType: e.target.value })}
                                    >
                                        {STEERING_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Konum</label>
                                    <select
                                        className="form-select"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    >
                                        <option value="">Seçiniz</option>
                                        {LOCATIONS.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* İlan Ayarları */}
                            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                İlan Ayarları
                            </h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">İlan Durumu</label>
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
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.featured}
                                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                            style={{ width: '1.25rem', height: '1.25rem' }}
                                        />
                                        <span>Öne Çıkan İlan</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Açıklama</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    placeholder="Araç hakkında ek bilgiler..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
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
