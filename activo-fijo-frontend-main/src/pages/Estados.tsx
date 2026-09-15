import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_ESTADOS = gql`
  query GetEstados {
    todosEstados {
      codEstado
      desEstado
    }
  }
`;

const CREAR_ESTADO = gql`
  mutation CrearEstado($codEstado: Int!, $desEstado: String!) {
    crearEstado(codEstado: $codEstado, desEstado: $desEstado) {
      estado {
        codEstado
        desEstado
      }
    }
  }
`;

const EDITAR_ESTADO = gql`
  mutation EditarEstado($codEstado: Int!, $desEstado: String!) {
    editarEstado(codEstado: $codEstado, desEstado: $desEstado) {
      estado {
        codEstado
        desEstado
      }
    }
  }
`;

export default function Estados() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_estado_activo');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_estado_activo');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ codEstado: '', desEstado: '' });

  const { data, loading, error, refetch } = useQuery(GET_ESTADOS);
  const [crearEstado] = useMutation(CREAR_ESTADO);
  const [editarEstado] = useMutation(EDITAR_ESTADO);

  const handleSubmit = async () => {
    if (!form.codEstado || !form.desEstado.trim()) {
      alert('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    try {
      if (editando) {
        await editarEstado({
          variables: {
            codEstado: parseInt(form.codEstado),
            desEstado: form.desEstado,
          },
        });
      } else {
        await crearEstado({
          variables: {
            codEstado: parseInt(form.codEstado),
            desEstado: form.desEstado,
          },
        });
      }
      setShowModal(false);
      setEditando(null);
      setForm({ codEstado: '', desEstado: '' });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ codEstado: '', desEstado: '' });
    setShowModal(true);
  };

  const abrirEditar = (e: any) => {
    setEditando(e);
    setForm({
      codEstado: e.codEstado.toString(),
      desEstado: e.desEstado,
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Cargando estados...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Estados de Activos"
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
              <th>Descripción del Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.todosEstados?.length === 0 && (
              <tr>
                <td colSpan={3} className="empty">
                  No hay estados registrados
                </td>
              </tr>
            )}
            {data?.todosEstados?.map((e: any) => (
              <tr key={e.codEstado}>
                <td>
                  <strong>#{e.codEstado}</strong>
                </td>
                <td>{e.desEstado}</td>
                <td>
                  {puedeEditar && (
                    <div className="btn-group">
                      <button className="btn btn-warning btn-sm" onClick={() => abrirEditar(e)}>
                        Editar
                      </button>
                    </div>
                  )}
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
              {editando ? 'Editar Estado' : 'Registrar Nuevo Estado'}
            </h2>

            <div className="form-group">
              <label>Código (Número) *</label>
              <input
                type="number"
                value={form.codEstado}
                onChange={e => setForm({ ...form, codEstado: e.target.value })}
                disabled={!!editando}
                placeholder="Ej. 1"
              />
            </div>

            <div className="form-group">
              <label>Descripción del Estado *</label>
              <input
                type="text"
                value={form.desEstado}
                onChange={e => setForm({ ...form, desEstado: e.target.value })}
                placeholder="Ej. Bueno, Regular, Malo"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editando ? 'Guardar Cambios' : 'Registrar Estado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
