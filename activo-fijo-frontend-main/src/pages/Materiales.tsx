import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_MATERIALES = gql`
  query GetMateriales {
    todosTipomats {
      tipoMat
      desMat
    }
  }
`;

const CREAR_MATERIAL = gql`
  mutation CrearTipomat($tipoMat: Int!, $desMat: String!) {
    crearTipomat(tipoMat: $tipoMat, desMat: $desMat) {
      tipomat {
        tipoMat
        desMat
      }
    }
  }
`;

const EDITAR_MATERIAL = gql`
  mutation EditarTipomat($tipoMat: Int!, $desMat: String!) {
    editarTipomat(tipoMat: $tipoMat, desMat: $desMat) {
      tipomat {
        tipoMat
        desMat
      }
    }
  }
`;

export default function Materiales() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_material');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_material');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ tipoMat: '', desMat: '' });

  const { data, loading, error, refetch } = useQuery(GET_MATERIALES);
  const [crearTipomat] = useMutation(CREAR_MATERIAL);
  const [editarTipomat] = useMutation(EDITAR_MATERIAL);

  const handleSubmit = async () => {
    if (!form.tipoMat || !form.desMat.trim()) {
      alert('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    try {
      if (editando) {
        await editarTipomat({
          variables: {
            tipoMat: parseInt(form.tipoMat),
            desMat: form.desMat,
          },
        });
      } else {
        await crearTipomat({
          variables: {
            tipoMat: parseInt(form.tipoMat),
            desMat: form.desMat,
          },
        });
      }
      setShowModal(false);
      setEditando(null);
      setForm({ tipoMat: '', desMat: '' });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ tipoMat: '', desMat: '' });
    setShowModal(true);
  };

  const abrirEditar = (m: any) => {
    setEditando(m);
    setForm({
      tipoMat: m.tipoMat.toString(),
      desMat: m.desMat,
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Cargando tipos de material...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Tipos de Material"
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
              <th>Descripción del Material</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.todosTipomats?.length === 0 && (
              <tr>
                <td colSpan={3} className="empty">
                  No hay tipos de material registrados
                </td>
              </tr>
            )}
            {data?.todosTipomats?.map((m: any) => (
              <tr key={m.tipoMat}>
                <td>
                  <strong>#{m.tipoMat}</strong>
                </td>
                <td>{m.desMat}</td>
                <td>
                  <div className="btn-group">
                    {puedeEditar && (
                      <button className="btn btn-warning btn-sm" onClick={() => abrirEditar(m)}>
                        Editar
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
              {editando ? 'Editar Tipo de Material' : 'Registrar Tipo de Material'}
            </h2>

            <div className="form-group">
              <label>Código (Número) *</label>
              <input
                type="number"
                value={form.tipoMat}
                onChange={e => setForm({ ...form, tipoMat: e.target.value })}
                disabled={!!editando}
                placeholder="Ej. 101"
              />
            </div>

            <div className="form-group">
              <label>Descripción del Material *</label>
              <input
                type="text"
                value={form.desMat}
                onChange={e => setForm({ ...form, desMat: e.target.value })}
                placeholder="Ej. Papelería y Útiles de Escritorio"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editando ? 'Guardar Cambios' : 'Registrar Material'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
