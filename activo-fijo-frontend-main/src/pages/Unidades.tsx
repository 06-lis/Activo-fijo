import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_UNIDADES = gql`
  query {
    todasUnidades {
      codUnidad
      desUnidad
      abrev
    }
  }
`;

const CREAR_UNIDAD = gql`
  mutation CrearUnidad($codUnidad: Int!, $desUnidad: String!, $abrev: String) {
    crearUnidad(codUnidad: $codUnidad, desUnidad: $desUnidad, abrev: $abrev) {
      unidad {
        codUnidad
        desUnidad
        abrev
      }
    }
  }
`;

const EDITAR_UNIDAD = gql`
  mutation EditarUnidad($codUnidad: Int!, $desUnidad: String, $abrev: String) {
    editarUnidad(codUnidad: $codUnidad, desUnidad: $desUnidad, abrev: $abrev) {
      unidad {
        codUnidad
        desUnidad
        abrev
      }
    }
  }
`;

export default function Unidades() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_unidad_medida');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_unidad_medida');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ codUnidad: '', desUnidad: '', abrev: '' });

  const { data, loading, error, refetch } = useQuery(GET_UNIDADES);
  const [crearUnidad] = useMutation(CREAR_UNIDAD);
  const [editarUnidad] = useMutation(EDITAR_UNIDAD);

  const handleSubmit = async () => {
    if (!form.codUnidad || !form.desUnidad) {
      alert('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    try {
      if (editando) {
        await editarUnidad({
          variables: {
            codUnidad: parseInt(form.codUnidad),
            desUnidad: form.desUnidad,
            abrev: form.abrev || null,
          },
        });
      } else {
        await crearUnidad({
          variables: {
            codUnidad: parseInt(form.codUnidad),
            desUnidad: form.desUnidad,
            abrev: form.abrev || null,
          },
        });
      }
      setShowModal(false);
      setEditando(null);
      setForm({ codUnidad: '', desUnidad: '', abrev: '' });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ codUnidad: '', desUnidad: '', abrev: '' });
    setShowModal(true);
  };

  const abrirEditar = (u: any) => {
    setEditando(u);
    setForm({
      codUnidad: u.codUnidad.toString(),
      desUnidad: u.desUnidad,
      abrev: u.abrev || '',
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Cargando unidades...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Unidades de Medida"
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
              <th>Abreviación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.todasUnidades?.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  No hay unidades registradas
                </td>
              </tr>
            )}
            {data?.todasUnidades?.map((u: any) => (
              <tr key={u.codUnidad}>
                <td>
                  <strong>#{u.codUnidad}</strong>
                </td>
                <td>{u.desUnidad}</td>
                <td>{u.abrev || '-'}</td>
                <td>
                  {puedeEditar && (
                    <div className="btn-group">
                      <button className="btn btn-warning btn-sm" onClick={() => abrirEditar(u)}>
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
              {editando ? 'Editar Unidad de Medida' : 'Registrar Unidad de Medida'}
            </h2>

            <div className="form-group">
              <label>Código (Número) *</label>
              <input
                type="number"
                value={form.codUnidad}
                onChange={e => setForm({ ...form, codUnidad: e.target.value })}
                disabled={!!editando}
                placeholder="Ej. 1"
              />
            </div>

            <div className="form-group">
              <label>Descripción *</label>
              <input
                type="text"
                value={form.desUnidad}
                onChange={e => setForm({ ...form, desUnidad: e.target.value })}
                placeholder="Ej. Piezas"
              />
            </div>

            <div className="form-group">
              <label>Abreviación</label>
              <input
                type="text"
                value={form.abrev}
                onChange={e => setForm({ ...form, abrev: e.target.value })}
                placeholder="Ej. pza"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editando ? 'Guardar Cambios' : 'Registrar Unidad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
