import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_GESTIONES = gql`
  query GetGestiones {
    todasGestiones(soloActivas: false) {
      codGest
      gestIni
      gestFin
      aB
    }
  }
`;

const CREAR_GESTION = gql`
  mutation CrearGestion($gestIni: Int!, $gestFin: Int) {
    crearGestion(gestIni: $gestIni, gestFin: $gestFin) {
      gestion {
        codGest
        gestIni
        gestFin
        aB
      }
    }
  }
`;

const EDITAR_GESTION = gql`
  mutation EditarGestion($codGest: Int!, $gestIni: Int, $gestFin: Int) {
    editarGestion(codGest: $codGest, gestIni: $gestIni, gestFin: $gestFin) {
      gestion {
        codGest
        gestIni
        gestFin
        aB
      }
    }
  }
`;

const DAR_DE_BAJA_GESTION = gql`
  mutation DarDeBajaGestion($codGest: Int!) {
    darDeBajaGestion(codGest: $codGest) {
      gestion {
        codGest
        aB
      }
    }
  }
`;

export default function Gestiones() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_gestion');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_gestion');
  const puedeEliminar = user?.esAdmin || user?.permisos.includes('eliminar_gestion');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ gestIni: '', gestFin: '' });

  const { data, loading, error, refetch } = useQuery(GET_GESTIONES);
  const [crearGestion] = useMutation(CREAR_GESTION);
  const [editarGestion] = useMutation(EDITAR_GESTION);
  const [darDeBajaGestion] = useMutation(DAR_DE_BAJA_GESTION);

  const handleSubmit = async () => {
    if (!form.gestIni) {
      alert('Por favor ingrese al menos la gestión inicial (año).');
      return;
    }

    try {
      if (editando) {
        await editarGestion({
          variables: {
            codGest: parseInt(String(editando.codGest)),
            gestIni: parseInt(form.gestIni),
            gestFin: form.gestFin ? parseInt(form.gestFin) : null
          }
        });
      } else {
        await crearGestion({
          variables: {
            gestIni: parseInt(form.gestIni),
            gestFin: form.gestFin ? parseInt(form.gestFin) : null
          }
        });
      }
      setShowModal(false);
      setEditando(null);
      setForm({ gestIni: '', gestFin: '' });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleDarDeBaja = async (codGest: any) => {
    if (!window.confirm('¿Está seguro de dar de baja esta gestión?')) return;
    try {
      await darDeBajaGestion({
        variables: {
          codGest: parseInt(String(codGest))
        }
      });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ gestIni: '', gestFin: '' });
    setShowModal(true);
  };

  const abrirEditar = (g: any) => {
    setEditando(g);
    setForm({
      gestIni: g.gestIni.toString(),
      gestFin: g.gestFin ? g.gestFin.toString() : ''
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Cargando gestiones...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Gestiones"
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
              <th>ID</th>
              <th>Gestión Inicio (Año)</th>
              <th>Gestión Fin (Año)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.todasGestiones?.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  No hay gestiones registradas
                </td>
              </tr>
            )}
            {data?.todasGestiones?.map((g: any) => (
              <tr key={g.codGest}>
                <td>
                  <strong>#{g.codGest}</strong>
                </td>
                <td>{g.gestIni}</td>
                <td>{g.gestFin || 'En curso / Sin definir'}</td>
                <td>
                  <span className={`badge ${g.aB === 'A' ? 'badge-success' : 'badge-secondary'}`}>
                    {g.aB === 'A' ? 'Activo' : 'De Baja'}
                  </span>
                </td>
                <td>
                  <div className="btn-group">
                    {g.aB === 'A' && (
                      <>
                        {puedeEditar && (
                          <button className="btn btn-warning btn-sm" onClick={() => abrirEditar(g)}>
                            Editar
                          </button>
                        )}
                        {puedeEliminar && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDarDeBaja(g.codGest)}>
                            Dar de Baja
                          </button>
                        )}
                      </>
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
              {editando ? 'Editar Gestión' : 'Registrar Nueva Gestión'}
            </h2>

            <div className="form-group">
              <label>Gestión Inicio (Año) *</label>
              <input
                type="number"
                value={form.gestIni}
                onChange={e => setForm({ ...form, gestIni: e.target.value })}
                placeholder="Ej. 2026"
              />
            </div>

            <div className="form-group">
              <label>Gestión Fin (Año - Opcional)</label>
              <input
                type="number"
                value={form.gestFin}
                onChange={e => setForm({ ...form, gestFin: e.target.value })}
                placeholder="Ej. 2026"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editando ? 'Guardar Cambios' : 'Registrar Gestión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
