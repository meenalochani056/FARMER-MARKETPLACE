import { useEffect, useState } from 'react';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { ErrorState, EmptyState, LoadingState } from '../components/PageStates';

const emptyPrice = { crop: '', market: '', location: '', minimumPrice: '', averagePrice: '', maximumPrice: '', unit: 'kg' };
export default function AdminMarketPricesPage() {
  const [prices, setPrices] = useState([]);
  const [form, setForm] = useState(emptyPrice);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function load() {
    setLoading(true);
    try { const { data } = await api.get('/admin/market-prices'); setPrices(data.records); setError(''); }
    catch (caught) { setError(caught.response?.data?.message || 'Unable to load market prices.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, minimumPrice: Number(form.minimumPrice), averagePrice: Number(form.averagePrice), maximumPrice: Number(form.maximumPrice), isDemoData: true };
      await api[editingId ? 'put' : 'post'](`/market-prices${editingId ? `/${editingId}` : ''}`, payload);
      setForm(emptyPrice); setEditingId(''); await load();
    } catch (caught) { setError(caught.response?.data?.message || 'Unable to save market price.'); }
    finally { setSaving(false); }
  }
  function edit(price) {
    setEditingId(price._id);
    setForm({ crop: price.crop, market: price.market, location: price.location, minimumPrice: price.minimumPrice, averagePrice: price.averagePrice, maximumPrice: price.maximumPrice, unit: price.unit });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function remove(id) {
    try { await api.delete(`/market-prices/${id}`); await load(); }
    catch (caught) { setError(caught.response?.data?.message || 'Unable to remove market price.'); }
  }
  const fields = [['crop','Crop'],['market','Market'],['location','Location'],['minimumPrice','Minimum price'],['averagePrice','Average price'],['maximumPrice','Maximum price']];
  return <div className="workspace">
    <div className="workspace-title"><div><div className="eyebrow">ADMINISTRATION</div><h1>Manage market prices</h1></div></div>
    <div className="demo-banner"><b>Indicative demo prices only.</b> Do not present these values as live government or market data.</div>
    <form className="panel market-price-form" onSubmit={submit}><h2>{editingId ? 'Edit market reference' : 'Add a market reference'}</h2><div className="form-grid">{fields.map(([key,label]) => <label className="form-label" key={key}>{label}<input required type={key.includes('Price') ? 'number' : 'text'} min={key.includes('Price') ? '0' : undefined} step="any" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}<label className="form-label">Unit<select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}>{['kg','piece','quintal','dozen','bundle'].map((unit) => <option key={unit}>{unit}</option>)}</select></label></div>{error && <p className="form-error">{error}</p>}<div className="panel-actions"><button className="button button-primary" disabled={saving}>{editingId ? <Edit3 size={16} /> : <Plus size={16} />}{saving ? 'Saving…' : editingId ? 'Update price' : 'Add demo price'}</button>{editingId && <button type="button" className="button button-outline" onClick={() => { setEditingId(''); setForm(emptyPrice); }}><X size={16} /> Cancel edit</button>}</div></form>
    {error && !prices.length && <ErrorState message={error} onRetry={load} />}
    {loading ? <LoadingState /> : prices.length ? <div className="table-wrap"><table><thead><tr><th>Crop</th><th>Market</th><th>Location</th><th>Min</th><th>Average</th><th>Max</th><th>Actions</th></tr></thead><tbody>{prices.map((price) => <tr key={price._id}><td><b>{price.crop}</b><small className="demo-chip">DEMO</small></td><td>{price.market}</td><td>{price.location}</td><td>₹{price.minimumPrice} / {price.unit}</td><td><b>₹{price.averagePrice} / {price.unit}</b></td><td>₹{price.maximumPrice} / {price.unit}</td><td><button className="table-action" onClick={() => edit(price)}>Edit</button><button className="table-action danger-link" onClick={() => remove(price._id)}><Trash2 size={13} /> Remove</button></td></tr>)}</tbody></table></div> : !error && <EmptyState>No market prices have been added.</EmptyState>}
  </div>;
}
