import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_PARTES = gql`
  query GetPartes {
    todasPartes(soloActivas: false) {
      codParte
      desParte
      aB
    }
  }
`;

const CREAR_PARTE = gql`
  mutation CrearParte($desParte: String!) {
    crearParte(desParte: $desParte) {
      parte {
        codParte
        desParte
        aB
      }
    }
  }
`;

const EDITAR_PARTE = gql`
  mutation EditarParte($codParte: Int!, $desParte: String!) {
    editarParte(codParte: $codParte, desParte: $desParte) {
      parte {
        codParte
        desParte
        aB
      }
    }
  }
`;

const DAR_DE_BAJA_PARTE = gql`
  mutation DarDeBajaParte($codParte: Int!) {
    darDeBajaParte(codParte: $codParte) {
      parte {
        codParte
        aB
      }
    }
  }
`;

export default function Partes() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_parte');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_parte');
  const puedeEliminar = user?.esAdmin || user?.permisos.includes('eliminar_parte');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ desParte: '' });

  const { data, loading, error, refetch } = useQuery(GET_PARTES);
  const [crearParte] = useMutation(CREAR_PARTE);
  const [editarParte] = useMutation(EDITAR_PARTE);
  const [darDeBajaParte] = useMutation(DAR_DE_BAJA_PARTE);

  const handleSubmit = async () => {
    if (!form.desParte) {
      alert('Por favor ingrese la descripción del componente.');
      return;
    }

    try {
      if (editando) {
        await editarParte({
          variables: {
            codParte: parseInt(String(editando.codParte)),
            desParte: form.desParte
          }
        });
      } else {
        await crearParte({
          variables: {
            desParte: form.desParte
          }
        });
      }
      setShowModal(false);
      setEditando(null);
      setForm({ desParte: '' });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleDarDeBaja = async (codParte: any) => {
    if (!window.confirm('¿Está seguro de dar de baja esta parte/componente?')) return;
    try {
      await darDeBajaParte({
        variables: {
          codParte: parseInt(String(codParte))
        }
      });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ desParte: '' });
    setShowModal(true);
  };

  const abrirEditar = (p: any) => {
    setEditando(p);
    setForm({
      desParte: p.desParte
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Cargando partes y componentes...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Partes y Componentes"
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
              <th>Descripción Componente</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.todasPartes?.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  No hay partes o componentes registrados
                </td>
              </tr>
            )}
            {data?.todasPartes?.map((p: any) => (
              <tr key={p.codParte}>
                <td>
                  <strong>#{p.codParte}</strong>
                </td>
                <td>{p.desParte}</td>
                <td>
                  <span className={`badge ${p.aB === 'A' ? 'badge-success' : 'badge-secondary'}`}>
                    {p.aB === 'A' ? 'Activo' : 'De Baja'}
                  </span>
                </td>
                <td>
                  <div className="btn-group">
                    {p.aB === 'A' && (
                      <>
                        {puedeEditar && (
                          <button className="btn btn-warning btn-sm" onClick={() => abrirEditar(p)}>
                            Editar
                          </button>
                        )}
                        {puedeEliminar && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDarDeBaja(p.codParte)}>
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
              {editando ? 'Editar Parte / Componente' : 'Registrar Nueva Parte / Componente'}
            </h2>

            <div className="form-group">
              <label>Descripción del Componente *</label>
              <input
                type="text"
                value={form.desParte}
                onChange={e => setForm({ ...form, desParte: e.target.value })}
                placeholder="Ej. Memoria RAM DDR4 8GB"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editando ? 'Guardar Cambios' : 'Registrar Parte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
