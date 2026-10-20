import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../services/api';
import { ErrorState, EmptyState, LoadingState } from '../components/PageStates';

const titles = { farmers: 'Farmers', buyers: 'Buyers', products: 'Products', orders: 'Orders', payments: 'Payments', logistics: 'Logistics', reviews: 'Reviews', categories: 'Categories', 'market-prices': 'Market prices' };

export default function AdminResourcePage() {
  const { resource } = useParams();
  const [records, setRecords] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isUsers = resource === 'farmers' || resource === 'buyers';
  const isFarmer = resource === 'farmers';
  const endpoint = `/admin/${resource}`;

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(endpoint);
      setRecords(data.users || data.records);
    } catch (caught) {
      setError(caught.response?.data?.message || 'Unable to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [resource]);
  async function verify(id, status) {
    try { await api.put(`/admin/farmers/${id}/verify`, { status }); await load(); }
    catch (caught) { setError(caught.response?.data?.message || 'Unable to update farmer verification.'); }
  }
  async function addCategory(event) {
    event.preventDefault();
    try { await api.post('/admin/categories', { name: categoryName }); setCategoryName(''); await load(); }
    catch (caught) { setError(caught.response?.data?.message || 'Unable to add category.'); }
  }
  async function removeCategory(id) {
    try { await api.delete(`/admin/categories/${id}`); await load(); }
    catch (caught) { setError(caught.response?.data?.message || 'Unable to remove category.'); }
  }
  async function renameCategory(id, currentName) {
    const name = window.prompt('Update category name', currentName);
    if (name === null || !name.trim()) return;
    try { await api.put(`/admin/categories/${id}`, { name: name.trim() }); await load(); }
    catch (caught) { setError(caught.response?.data?.message || 'Unable to update category.'); }
  }
  async function removeProduct(id) {
    try { await api.delete(`/products/${id}`); await load(); }
    catch (caught) { setError(caught.response?.data?.message || 'Unable to remove product.'); }
  }
  async function removeMarketPrice(id) {
    try { await api.delete(`/market-prices/${id}`); await load(); }
    catch (caught) { setError(caught.response?.data?.message || 'Unable to remove market price.'); }
  }
  const recordName = (record) => record.name || record.crop || record.trackingId || record.reference || record.order?._id || `#${record._id.slice(-7)}`;

  return <div className="workspace">
    <div className="workspace-title">
      <div><div className="eyebrow">ADMINISTRATION</div><h1>{titles[resource] || 'Platform records'}</h1></div>
      {resource === 'market-prices' && <Link className="button button-primary" to="/market-prices">Manage prices</Link>}
    </div>
    {resource === 'categories' && <form className="panel category-add-form" onSubmit={addCategory}>
      <label className="form-label">New category<input required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Millets" /></label>
      <button className="button button-primary"><Plus size={16} /> Add category</button>
    </form>}
    {error && <ErrorState message={error} onRetry={load} />}
    {!error && loading && <LoadingState />}
    {!error && !loading && records.length === 0 && <EmptyState>No {titles[resource]?.toLowerCase() || 'records'} found.</EmptyState>}
    {!error && !loading && records.length > 0 && <div className="table-wrap"><table>
      <thead><tr>
        {isUsers ? <><th>Name</th><th>Email</th><th>Location</th>{isFarmer && <><th>Verification</th><th>Action</th></>}</> : <><th>Record</th><th>Details</th><th>Created</th><th /></>}
      </tr></thead>
      <tbody>{records.map((record) => <tr key={record._id}>
        {isUsers ? <>
          <td>{record.name}</td><td>{record.email}</td><td>{record.district || '—'}, {record.state || ''}</td>
          {isFarmer && <><td><span className="status-pill">{record.verificationStatus}</span></td><td>{!record.isVerified && <div className="inline-actions"><button className="table-action" onClick={() => verify(record._id, 'verified')}>Verify</button><button className="table-action danger-link" onClick={() => verify(record._id, 'rejected')}>Reject</button></div>}</td></>}
        </> : <>
          <td>{recordName(record)}</td><td>{record.status || record.orderStatus || record.comment || record.location || record.amount || record.description || '—'}</td>
          <td>{record.createdAt || record.updatedAt ? new Date(record.createdAt || record.updatedAt).toLocaleDateString() : '—'}</td>
          <td>{resource === 'orders' && <Link className="table-action" to={`/admin/orders/${record._id}`}>View</Link>}{resource === 'categories' && <><button className="table-action" onClick={() => renameCategory(record._id, record.name)}>Edit</button><button className="table-action danger-link" onClick={() => removeCategory(record._id)}>Remove</button></>}{resource === 'products' && <button className="table-action danger-link" onClick={() => removeProduct(record._id)}>Archive</button>}{resource === 'market-prices' && <button className="table-action danger-link" onClick={() => removeMarketPrice(record._id)}>Remove</button>}</td>
        </>}
      </tr>)}</tbody>
    </table></div>}
  </div>;
}
