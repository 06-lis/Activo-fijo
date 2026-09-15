import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_FUNCIONES_ADM = gql`
  query GetFuncionesAdm {
    todasFuncionesAdm {
      codFunc
      des
      estprog
    }
  }
`;

const CREAR_FUNCION_ADM = gql`
  mutation CrearFuncionAdm($codFunc: Int!, $des: String!, $estprog: String) {
    crearFuncionAdm(codFunc: $codFunc, des: $des, estprog: $estprog) {
      funcionAdm {
        codFunc
        des
        estprog
      }
    }
  }
`;

const EDITAR_FUNCION_ADM = gql`
  mutation EditarFuncionAdm($codFunc: Int!, $des: String, $estprog: String) {
    editarFuncionAdm(codFunc: $codFunc, des: $des, estprog: $estprog) {
      funcionAdm {
        codFunc
        des
        estprog
      }
    }
  }
`;

export default function Funciones() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_funcion');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_funcion');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ codFunc: '', des: '', estprog: '' });

  const { data, loading, error, refetch } = useQuery(GET_FUNCIONES_ADM);
  const [crearFuncionAdm] = useMutation(CREAR_FUNCION_ADM);
  const [editarFuncionAdm] = useMutation(EDITAR_FUNCION_ADM);

  const handleSubmit = async () => {
    if (!form.codFunc || !form.des.trim()) {
      alert('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    try {
      if (editando) {
        await editarFuncionAdm({
          variables: {
            codFunc: parseInt(form.codFunc),
            des: form.des,
            estprog: form.estprog || null,
          },
        });
      } else {
        await crearFuncionAdm({
          variables: {
            codFunc: parseInt(form.codFunc),
            des: form.des,
            estprog: form.estprog || null,
          },
        });
      }
      setShowModal(false);
      setEditando(null);
      setForm({ codFunc: '', des: '', estprog: '' });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ codFunc: '', des: '', estprog: '' });
    setShowModal(true);
  };

  const abrirEditar = (f: any) => {
    setEditando(f);
    setForm({
      codFunc: f.codFunc.toString(),
      des: f.des,
      estprog: f.estprog || '',
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Cargando funciones administrativas...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Funciones Administrativas"
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
              <th>Estructura Programática</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.todasFuncionesAdm?.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  No hay funciones administrativas registradas
                </td>
              </tr>
            )}
            {data?.todasFuncionesAdm?.map((f: any) => (
              <tr key={f.codFunc}>
                <td>
                  <strong>#{f.codFunc}</strong>
                </td>
                <td>{f.des}</td>
                <td>{f.estprog ? <span className="badge badge-info">{f.estprog}</span> : '-'}</td>
                <td>
                  <div className="btn-group">
                    {puedeEditar && (
                      <button className="btn btn-warning btn-sm" onClick={() => abrirEditar(f)}>
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
              {editando ? 'Editar Función Administrativa' : 'Registrar Función Administrativa'}
            </h2>

            <div className="form-group">
              <label>Código (Número) *</label>
              <input
                type="number"
                value={form.codFunc}
                onChange={e => setForm({ ...form, codFunc: e.target.value })}
                disabled={!!editando}
                placeholder="Ej. 10"
              />
            </div>

            <div className="form-group">
              <label>Descripción *</label>
              <input
                type="text"
                value={form.des}
                onChange={e => setForm({ ...form, des: e.target.value })}
                placeholder="Ej. Administración General"
              />
            </div>

            <div className="form-group">
              <label>Estructura Programática (Max 5 caracteres)</label>
              <input
                type="text"
                maxLength={5}
                value={form.estprog}
                onChange={e => setForm({ ...form, estprog: e.target.value })}
                placeholder="Ej. 11.00"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editando ? 'Guardar Cambios' : 'Registrar Función'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
