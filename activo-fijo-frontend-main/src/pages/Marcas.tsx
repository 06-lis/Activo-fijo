import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_MARCAS = gql`query { todasMarcas { codMarca desMarca } }`;
const GET_MODELOS = gql`query { todosModelos { codModelo desModelo codMarca { codMarca desMarca } } }`;
const CREAR_MARCA = gql`mutation CrearMarca($desMarca: String!) { crearMarca(desMarca: $desMarca) { marca { codMarca desMarca } } }`;
const EDITAR_MARCA = gql`mutation EditarMarca($codMarca: Int!, $desMarca: String!) { editarMarca(codMarca: $codMarca, desMarca: $desMarca) { marca { codMarca desMarca } } }`;
const ELIMINAR_MARCA = gql`mutation($codMarca: Int!) { eliminarMarca(codMarca: $codMarca) { ok } }`;
const CREAR_MODELO = gql`mutation CrearModelo($codMarca: Int!, $desModelo: String!) { crearModelo(codMarca: $codMarca, desModelo: $desModelo) { modelo { codModelo desModelo } } }`;

export default function Marcas() {
  const { user } = useAuth();
  const puedeCrearMarca = user?.esAdmin || user?.permisos.includes('crear_marca');
  const puedeEditarMarca = user?.esAdmin || user?.permisos.includes('editar_marca');
  const puedeEliminarMarca = user?.esAdmin || user?.permisos.includes('eliminar_marca');
  const puedeCrearModelo = user?.esAdmin || user?.permisos.includes('crear_modelo');

  const [showMarcaModal, setShowMarcaModal] = useState(false);
  const [showModeloModal, setShowModeloModal] = useState(false);
  const [editandoMarca, setEditandoMarca] = useState<any>(null);
  const [formMarca, setFormMarca] = useState({ desMarca: '' });
  const [formModelo, setFormModelo] = useState({ codMarca: '', desModelo: '' });

  const { data: marcasData, loading, error, refetch: refetchMarcas } = useQuery(GET_MARCAS);
  const { data: modelosData, refetch: refetchModelos } = useQuery(GET_MODELOS);
  const [crearMarca] = useMutation(CREAR_MARCA);
  const [editarMarca] = useMutation(EDITAR_MARCA);
  const [eliminarMarca] = useMutation(ELIMINAR_MARCA);
  const [crearModelo] = useMutation(CREAR_MODELO);

  const handleMarca = async () => {
    try {
      if (editandoMarca) {
        await editarMarca({ variables: { codMarca: editandoMarca.codMarca, desMarca: formMarca.desMarca } });
      } else {
        await crearMarca({ variables: { desMarca: formMarca.desMarca } });
      }
      setShowMarcaModal(false); setEditandoMarca(null); setFormMarca({ desMarca: '' }); refetchMarcas();
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const handleModelo = async () => {
    try {
      await crearModelo({ variables: { codMarca: parseInt(formModelo.codMarca), desModelo: formModelo.desModelo } });
      setShowModeloModal(false); setFormModelo({ codMarca: '', desModelo: '' }); refetchModelos();
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Marcas y Modelos"
      actions={[
        ...(puedeCrearMarca ? [{ label: 'Nueva Marca', icon: '+', variant: 'primary' as const, onClick: () => { setEditandoMarca(null); setFormMarca({ desMarca: '' }); setShowMarcaModal(true); } }] : []),
        ...(puedeCrearModelo ? [{ label: 'Nuevo Modelo', icon: '+', onClick: () => setShowModeloModal(true) }] : []),
        { label: 'Actualizar', icon: '↺', onClick: () => { refetchMarcas(); refetchModelos(); } },
      ]}
    >


      <h3 style={{ margin: '0 0 0.75rem', color: '#555', fontSize: '1rem' }}>Marcas</h3>
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <table>
          <thead><tr><th>Nro.</th><th>Marca</th><th>Acciones</th></tr></thead>
          <tbody>
            {marcasData?.todasMarcas?.length === 0 && <tr><td colSpan={3} className="empty">No hay marcas</td></tr>}
            {marcasData?.todasMarcas?.map((m: any) => (
              <tr key={m.codMarca}>
                <td><strong>#{m.codMarca}</strong></td>
                <td>{m.desMarca}</td>
                <td>
                  <div className="btn-group">
                    {puedeEditarMarca && <button className="btn btn-warning btn-sm" onClick={() => { setEditandoMarca(m); setFormMarca({ desMarca: m.desMarca }); setShowMarcaModal(true); }}>Editar</button>}
                    {puedeEliminarMarca && <button className="btn btn-danger btn-sm" onClick={async () => { if (window.confirm('¿Eliminar?')) { await eliminarMarca({ variables: { codMarca: m.codMarca } }); refetchMarcas(); } }}>Eliminar</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ margin: '0 0 0.75rem', color: '#555', fontSize: '1rem' }}>Modelos</h3>
      <div className="table-container">
        <table>
          <thead><tr><th>Nro.</th><th>Modelo</th><th>Marca</th></tr></thead>
          <tbody>
            {modelosData?.todosModelos?.length === 0 && <tr><td colSpan={3} className="empty">No hay modelos</td></tr>}
            {modelosData?.todosModelos?.map((m: any) => (
              <tr key={m.codModelo}><td><strong>#{m.codModelo}</strong></td><td>{m.desModelo}</td><td>{m.codMarca?.desMarca}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMarcaModal && (
        <div className="modal-overlay" onClick={() => setShowMarcaModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editandoMarca ? 'Editar Marca' : 'Nueva Marca'}</h2>
            <div className="form-group"><label>Nombre *</label><input value={formMarca.desMarca} onChange={e => setFormMarca({ desMarca: e.target.value })} /></div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowMarcaModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleMarca}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showModeloModal && (
        <div className="modal-overlay" onClick={() => setShowModeloModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Nuevo Modelo</h2>
            <div className="form-group">
              <label>Marca *</label>
              <select value={formModelo.codMarca} onChange={e => setFormModelo({...formModelo, codMarca: e.target.value})}>
                <option value="">Seleccionar...</option>
                {marcasData?.todasMarcas?.map((m: any) => <option key={m.codMarca} value={m.codMarca}>{m.desMarca}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Nombre del modelo *</label><input value={formModelo.desModelo} onChange={e => setFormModelo({...formModelo, desModelo: e.target.value})} /></div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModeloModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleModelo}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}