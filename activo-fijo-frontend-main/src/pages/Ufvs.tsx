import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_UFVS } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { GUARDAR_TASA_REV } from '../graphql/mutations';

export default function Ufvs() {
  const { user } = useAuth();
  const puedeVer = user?.esAdmin || user?.permisos.includes('ver_tipo_cambio');
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_tipo_cambio');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_tipo_cambio');

  const [showModal, setShowModal] = useState(false);
  const [editObj, setEditObj] = useState<any>(null);
  const [form, setForm] = useState({ fecha: '', ufv: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const { data, loading, error, refetch } = useQuery(GET_UFVS);
  const [guardarTasaRev, { loading: saveLoading }] = useMutation(GUARDAR_TASA_REV);

  if (loading) return <div className="loading">Cargando tasas UFV...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  if (!puedeVer) {
    return (
      <PageLayout
        title="Acceso Restringido"
        subtitle="No tiene los permisos necesarios para ver esta sección."
      >
        <div className="error-container" style={{ padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Acceso Denegado</h2>
          <p style={{ color: '#666' }}>Se requiere el permiso de 'Ver Tipo de Cambio' para ingresar al módulo de UFV.</p>
        </div>
      </PageLayout>
    );
  }

  const tasasList: any[] = data?.todasTasasRev || [];

  // Filter
  const filteredTasas = tasasList.filter((t: any) =>
    t.fecha.includes(searchTerm) || String(t.ufv).includes(searchTerm)
  );

  // Pagination
  const totalPages = Math.ceil(filteredTasas.length / itemsPerPage);
  const paginatedTasas = filteredTasas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenAdd = () => {
    // Default to today's date formatted as YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    setEditObj(null);
    setForm({ fecha: todayStr, ufv: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (obj: any) => {
    setEditObj(obj);
    setForm({ fecha: obj.fecha, ufv: String(obj.ufv) });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.fecha || !form.ufv) {
      alert('Todos los campos son obligatorios.');
      return;
    }
    const valUfv = parseFloat(form.ufv);
    if (isNaN(valUfv) || valUfv <= 0) {
      alert('La tasa UFV debe ser un número positivo.');
      return;
    }

    try {
      await guardarTasaRev({
        variables: {
          nro: editObj ? parseInt(String(editObj.nro)) : null,
          fecha: form.fecha,
          ufv: valUfv
        }
      });
      setShowModal(false);
      refetch();
      alert(`✅ Tasa UFV ${editObj ? 'actualizada' : 'registrada'} correctamente.`);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const pageActions = [];
  if (puedeCrear) {
    pageActions.push({ label: 'Nuevo', icon: '+', variant: 'primary' as const, onClick: handleOpenAdd });
  }
  pageActions.push({ label: 'Actualizar', icon: '↺', onClick: () => refetch() });

  return (
    <PageLayout
      title="Tasas UFV (Unidad de Fomento de Vivienda)"
      actions={pageActions}
      subtitle="Gestiona el valor diario de la UFV en Bolivia para la indexación y actualización contable de activos."
    >


      {/* Filter and stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Buscar por fecha (AAAA-MM-DD) o tasa..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.875rem',
              width: '320px',
              outline: 'none'
            }}
          />
        </div>
        {tasasList.length > 0 && (
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            textAlign: 'right',
            fontSize: '0.8rem',
            color: '#1e3a8a',
            fontWeight: 600
          }}>
            Última UFV registrada: <strong style={{ fontSize: '0.9rem', color: '#2563eb' }}>{parseFloat(String(tasasList[0].ufv || 0)).toFixed(6)}</strong> ({tasasList[0].fecha})
          </div>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Nro. Registro</th>
              <th>Fecha de Vigencia</th>
              <th>Tasa UFV</th>
              {puedeEditar && <th style={{ textAlign: 'center', width: '120px' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedTasas.length === 0 && (
              <tr>
                <td colSpan={puedeEditar ? 4 : 3} className="empty">No se encontraron tasas UFV.</td>
              </tr>
            )}
            {paginatedTasas.map((t: any) => (
              <tr key={t.fecha}>
                <td><strong>#{t.nro}</strong></td>
                <td>
                  <span className="badge badge-info" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {t.fecha}
                  </span>
                </td>
                <td style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a' }}>
                  {parseFloat(String(t.ufv || 0)).toFixed(6)}
                </td>
                {puedeEditar && (
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(t)}>
                        Editar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Anterior
          </button>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Página <strong>{currentPage}</strong> de {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal CRUD */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h2 className="modal-title">{editObj ? '✏️ Editar Tasa UFV' : '➕ Registrar UFV'}</h2>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="form-group">
                <label>Fecha de Vigencia *</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })}
                  disabled={!!editObj} // Date acts as the unique key in business logic
                />
              </div>
              <div className="form-group">
                <label>Tasa UFV *</label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Ej: 2.451923"
                  value={form.ufv}
                  onChange={e => setForm({ ...form, ufv: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saveLoading}>
                {saveLoading ? 'Guardando...' : 'Guardar Tasa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
