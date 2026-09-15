import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_CONDICIONES = gql`
  query {
    todasCondiciones {
      codCond
      desCond
    }
  }
`;

const CREAR_CONDICION = gql`
  mutation CrearCondicion($codCond: Int!, $desCond: String!) {
    crearCondicion(codCond: $codCond, desCond: $desCond) {
      condicion {
        codCond
        desCond
      }
    }
  }
`;

const EDITAR_CONDICION = gql`
  mutation EditarCondicion($codCond: Int!, $desCond: String!) {
    editarCondicion(codCond: $codCond, desCond: $desCond) {
      condicion {
        codCond
        desCond
      }
    }
  }
`;

export default function Condiciones() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_condicion_activo');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_condicion_activo');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ codCond: '', desCond: '' });

  const { data, loading, error, refetch } = useQuery(GET_CONDICIONES);
  const [crearCondicion] = useMutation(CREAR_CONDICION);
  const [editarCondicion] = useMutation(EDITAR_CONDICION);

  const handleSubmit = async () => {
    if (!form.codCond || !form.desCond) {
      alert('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    try {
      if (editando) {
        await editarCondicion({
          variables: {
            codCond: parseInt(form.codCond),
            desCond: form.desCond,
          },
        });
      } else {
        await crearCondicion({
          variables: {
            codCond: parseInt(form.codCond),
            desCond: form.desCond,
          },
        });
      }
      setShowModal(false);
      setEditando(null);
      setForm({ codCond: '', desCond: '' });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ codCond: '', desCond: '' });
    setShowModal(true);
  };

  const abrirEditar = (c: any) => {
    setEditando(c);
    setForm({
      codCond: c.codCond.toString(),
      desCond: c.desCond,
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Cargando condiciones...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Condiciones de Activos"
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.todasCondiciones?.length === 0 && (
              <tr>
                <td colSpan={3} className="empty">
                  No hay condiciones registradas
                </td>
              </tr>
            )}
            {data?.todasCondiciones?.map((c: any) => (
              <tr key={c.codCond}>
                <td>
                  <strong>#{c.codCond}</strong>
                </td>
                <td>{c.desCond}</td>
                <td>
                  {puedeEditar && (
                    <div className="btn-group">
                      <button className="btn btn-warning btn-sm" onClick={() => abrirEditar(c)}>
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
              {editando ? 'Editar Condición' : 'Registrar Nueva Condición'}
            </h2>

            <div className="form-group">
              <label>Código (Número) *</label>
              <input
                type="number"
                value={form.codCond}
                onChange={e => setForm({ ...form, codCond: e.target.value })}
                disabled={!!editando}
                placeholder="Ej. 4"
              />
            </div>

            <div className="form-group">
              <label>Descripción *</label>
              <input
                type="text"
                value={form.desCond}
                onChange={e => setForm({ ...form, desCond: e.target.value })}
                placeholder="Ej. Regular"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editando ? 'Guardar Cambios' : 'Registrar Condición'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
