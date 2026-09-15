import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_TIPOS = gql`
  query GetTipos {
    todosTipos(soloActivos: false) {
      codTipo
      desTipo
      aB
    }
  }
`;

const CREAR_TIPO = gql`
  mutation CrearTipo($codTipo: Int!, $desTipo: String!) {
    crearTipo(codTipo: $codTipo, desTipo: $desTipo) {
      tipo {
        codTipo
        desTipo
        aB
      }
    }
  }
`;

const EDITAR_TIPO = gql`
  mutation EditarTipo($codTipo: Int!, $desTipo: String!) {
    editarTipo(codTipo: $codTipo, desTipo: $desTipo) {
      tipo {
        codTipo
        desTipo
        aB
      }
    }
  }
`;

const DAR_DE_BAJA_TIPO = gql`
  mutation DarDeBajaTipo($codTipo: Int!) {
    darDeBajaTipo(codTipo: $codTipo) {
      tipo {
        codTipo
        aB
      }
    }
  }
`;

export default function Tipos() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_tipo');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_tipo');
  const puedeEliminar = user?.esAdmin || user?.permisos.includes('eliminar_tipo');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ codTipo: '', desTipo: '' });

  const { data, loading, error, refetch } = useQuery(GET_TIPOS);
  const [crearTipo] = useMutation(CREAR_TIPO);
  const [editarTipo] = useMutation(EDITAR_TIPO);
  const [darDeBajaTipo] = useMutation(DAR_DE_BAJA_TIPO);

  const handleSubmit = async () => {
    if (!form.codTipo || !form.desTipo.trim()) {
      alert('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    try {
      if (editando) {
        await editarTipo({
          variables: {
            codTipo: parseInt(form.codTipo),
            desTipo: form.desTipo,
          },
        });
      } else {
        await crearTipo({
          variables: {
            codTipo: parseInt(form.codTipo),
            desTipo: form.desTipo,
          },
        });
      }
      setShowModal(false);
      setEditando(null);
      setForm({ codTipo: '', desTipo: '' });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleDarDeBaja = async (codTipo: number) => {
    if (!window.confirm('¿Está seguro de dar de baja este tipo de activo?')) return;
    try {
      await darDeBajaTipo({
        variables: { codTipo },
      });
      refetch();
    } catch (e: any) {
      alert('Error al dar de baja: ' + e.message);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ codTipo: '', desTipo: '' });
    setShowModal(true);
  };

  const abrirEditar = (t: any) => {
    setEditando(t);
    setForm({
      codTipo: t.codTipo.toString(),
      desTipo: t.desTipo,
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Cargando tipos de activos...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Tipos de Activo"
      actions={
        puedeCrear ? [
          { label: 'Nuevo', icon: '+', variant: 'primary' as const, onClick: abrirNuevo },
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ] : [
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ]
      }
    >

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.todosTipos?.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  No hay tipos de activos registrados
                </td>
              </tr>
            )}
            {data?.todosTipos?.map((t: any) => (
              <tr key={t.codTipo} style={{ opacity: t.aB === 'B' ? 0.6 : 1 }}>
                <td>
                  <strong>#{t.codTipo}</strong>
                </td>
                <td>{t.desTipo}</td>
                <td>
                  <span className={`badge ${t.aB === 'A' ? 'badge-success' : 'badge-danger'}`}>
                    {t.aB === 'A' ? 'Activo' : 'De Baja'}
                  </span>
                </td>
                <td>
                  <div className="btn-group">
                    {puedeEditar && (
                      <button className="btn btn-warning btn-sm" onClick={() => abrirEditar(t)}>
                        Editar
                      </button>
                    )}
                    {puedeEliminar && t.aB === 'A' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDarDeBaja(t.codTipo)}>
                        Dar de Baja
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {editando ? 'Editar Tipo de Activo' : 'Registrar Tipo de Activo'}
            </h2>

            <div className="form-group">
              <label>Código (Número) *</label>
              <input
                type="number"
                value={form.codTipo}
                onChange={e => setForm({ ...form, codTipo: e.target.value })}
                disabled={!!editando}
                placeholder="Ej. 1"
              />
            </div>

            <div className="form-group">
              <label>Descripción *</label>
              <input
                type="text"
                value={form.desTipo}
                onChange={e => setForm({ ...form, desTipo: e.target.value })}
                placeholder="Ej. Equipos de Computación"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editando ? 'Guardar Cambios' : 'Registrar Tipo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
