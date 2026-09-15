import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_TRANSFERENCIAS = gql`
  query GetTransferencias {
    todasTransferencias {
      codTransf
      tipoTransf
      codAsigOr
      codAsigDe
      fechaTransf
      estado
      codOfiRem {
        codOfic
        codDpto
        desDpto
        codPadre {
          codOfic
          codDpto
          desDpto
          codPadre {
            codOfic
            codDpto
            desDpto
          }
        }
      }
      codOfiDest {
        codOfic
        codDpto
        desDpto
        codPadre {
          codOfic
          codDpto
          desDpto
          codPadre {
            codOfic
            codDpto
            desDpto
          }
        }
      }
      inDetTranfSet {
        id
        cantidad
        nroActivo {
          nroActivo
          codActivo
          descripcion
        }
      }
    }
  }
`;

const GET_CATS = gql`
  query GetCats {
    todosActivos {
      nroActivo
      codActivo
      descripcion
      nroIngreso {
        codOficDest {
          codOfic
          codDpto
          desDpto
          codPadre {
            codOfic
            codDpto
            desDpto
            codPadre {
              codOfic
              codDpto
              desDpto
            }
          }
        }
      }
      inDetAsigSet {
        codAsig {
          codAsig
          estado
          codOfic {
            codOfic
            codDpto
            desDpto
            codPadre {
              codOfic
              codDpto
              desDpto
              codPadre {
                codOfic
                codDpto
                desDpto
              }
            }
          }
        }
      }
    }
    todasOficinas {
      codOfic
      codDpto
      desDpto
      codPadre {
        codOfic
        codDpto
        desDpto
        codPadre {
          codOfic
          codDpto
          desDpto
          codPadre {
            codOfic
            codDpto
            desDpto
          }
        }
      }
    }
    todasAsignaciones {
      codAsig
      estado
      fechaAsig
      codOfic {
        codOfic
        codDpto
        desDpto
        codPadre {
          codOfic
          codDpto
          desDpto
        }
      }
      codResp
    }
    todosResponsables {
      codResp
      codEstprog
      codEmp {
        nombre
        apellido
      }
    }
  }
`;

const CREAR_TRANSF = gql`
  mutation CrearTransferencia(
    $tipoTransf: String!, $codOfiRem: Int!, $codOfiDest: Int!, $fechaTransf: Date!,
    $codAsigOr: Int, $codAsigDe: Int
  ) {
    crearTransferencia(
      tipoTransf: $tipoTransf, codOfiRem: $codOfiRem, codOfiDest: $codOfiDest,
      fechaTransf: $fechaTransf, codAsigOr: $codAsigOr, codAsigDe: $codAsigDe
    ) {
      transferido {
        codTransf
        fechaTransf
      }
    }
  }
`;

const EDITAR_TRANSF = gql`
  mutation EditarTransferencia($codTransf: Int!, $estado: String!) {
    editarTransferencia(codTransf: $codTransf, estado: $estado) {
      transferido {
        codTransf
        estado
      }
    }
  }
`;

const ANULAR_TRANSF = gql`
  mutation AnularTransferencia($codTransf: Int!) {
    anularTransferencia(codTransf: $codTransf) {
      transferido {
        codTransf
        estado
      }
    }
  }
`;

const AGREGAR_ACT_TRANSF = gql`
  mutation AgregarActivoTransferencia($codTransf: Int!, $nroActivo: Int!, $cantidad: Int) {
    agregarActivoTransferencia(codTransf: $codTransf, nroActivo: $nroActivo, cantidad: $cantidad) {
      detTranf {
        codTransf {
          codTransf
        }
      }
    }
  }
`;

const estadoLabel: Record<string, string> = {
  'P': 'Pendiente',
  'A': 'Aprobado',
  'C': 'Completado',
  'R': 'Rechazado',
  'B': 'Anulado'
};

const estadoClass: Record<string, string> = {
  'P': 'badge-warning',
  'A': 'badge-success',
  'C': 'badge-info',
  'R': 'badge-danger',
  'B': 'badge-secondary'
};

function getOfficeFullCode(ofic: any): string {
  if (!ofic) return '';
  const parts = [];
  let current = ofic;
  while (current) {
    parts.unshift(current.codDpto);
    current = current.codPadre;
  }
  return parts.join('-');
}

function getOfficeUnifiedCode(ofic: any): string {
  if (!ofic) return '';
  const parts = [];
  let current = ofic;
  while (current) {
    parts.unshift(current.codDpto);
    current = current.codPadre;
  }
  return parts.join('');
}

function formatOfficeName(oficina: any): string {
  if (!oficina) return '';
  const path: string[] = [];
  let current = oficina;
  while (current) {
    if (current.desDpto) {
      path.unshift(current.desDpto);
    }
    current = current.codPadre;
  }
  const code = getOfficeUnifiedCode(oficina);
  return `[${code || oficina.codOfic}] ${path.join(' > ')}`;
}

function formatAsignacion(asig: any, responsables: any[]): string {
  if (!asig) return '';
  const resp = responsables?.find((r: any) => String(r.codResp) === String(asig.codResp));
  const respName = resp ? `${resp.codEmp.nombre} ${resp.codEmp.apellido}` : `Resp ID: ${asig.codResp}`;
  const oficName = asig.codOfic ? asig.codOfic.desDpto : 'Sin oficina';
  return `#${asig.codAsig} — ${respName} (${oficName}, ${asig.fechaAsig})`;
}

// Helper function to resolve the current office of an asset
function getActivoOffice(activo: any) {
  // 1. Check if there's an active assignment
  const activeAsig = activo.inDetAsigSet?.find(
    (det: any) => det.codAsig?.estado === 'A'
  );
  if (activeAsig?.codAsig?.codOfic) {
    return activeAsig.codAsig.codOfic;
  }
  // 2. Fallback to nroIngreso's codOficDest
  if (activo.nroIngreso?.codOficDest) {
    return activo.nroIngreso.codOficDest;
  }
  return null;
}

export default function Transferencias() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('solicitar_transferencia');
  const puedeAutorizar = user?.esAdmin || user?.permisos.includes('autorizar_transferencia');

  const [showModal, setShowModal] = useState(false);
  const [transfCreada, setTransfCreada] = useState<number | null>(null);
  const [form, setForm] = useState({
    codOfiRem: '',
    codOfiDest: '',
    fechaTransf: '',
    codAsigOr: '',
    codAsigDe: ''
  });
  const [nroActivoTransf, setNroActivoTransf] = useState('');
  
  // Selection states for new transfer active list
  const [selectedActivos, setSelectedActivos] = useState<any[]>([]);

  // Autocomplete search states
  const [oficinaDestSearch, setOficinaDestSearch] = useState('');
  const [showOficinaDestDropdown, setShowOficinaDestDropdown] = useState(false);

  const [asigOrSearch, setAsigOrSearch] = useState('');
  const [showAsigOrDropdown, setShowAsigOrDropdown] = useState(false);

  const [asigDeSearch, setAsigDeSearch] = useState('');
  const [showAsigDeDropdown, setShowAsigDeDropdown] = useState(false);

  // Asset autocomplete search states
  const [activoNewSearch, setActivoNewSearch] = useState('');
  const [showActivoNewDropdown, setShowActivoNewDropdown] = useState(false);

  const [activoExistSearch, setActivoExistSearch] = useState('');
  const [showActivoExistDropdown, setShowActivoExistDropdown] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_TRANSFERENCIAS);
  const { data: cats } = useQuery(GET_CATS);
  const [crearTransf] = useMutation(CREAR_TRANSF);
  const [editarTransf] = useMutation(EDITAR_TRANSF);
  const [anularTransf] = useMutation(ANULAR_TRANSF);
  const [agregarActivo] = useMutation(AGREGAR_ACT_TRANSF);

  // Add asset select handler for the new transfer form
  const handleSelectAssetForForm = (asset: any) => {
    if (asset && !selectedActivos.some(a => String(a.nroActivo) === String(asset.nroActivo))) {
      setSelectedActivos([...selectedActivos, asset]);
    }
    setActivoNewSearch('');
    setShowActivoNewDropdown(false);
  };

  const handleSelectAssetForExist = (asset: any) => {
    setNroActivoTransf(asset.nroActivo.toString());
    setActivoExistSearch(`${asset.codActivo} — ${asset.descripcion}`);
    setShowActivoExistDropdown(false);
  };

  const handleActivoExistSearchChange = (val: string) => {
    setActivoExistSearch(val);
    setNroActivoTransf('');
    setShowActivoExistDropdown(true);
  };

  const handleRemoveAssetFromForm = (nroActivo: string) => {
    setSelectedActivos(selectedActivos.filter(a => String(a.nroActivo) !== String(nroActivo)));
  };

  // Autocomplete handlers
  const handleSelectOficinaDest = (o: any) => {
    setForm(prev => ({ ...prev, codOfiDest: o.codOfic.toString() }));
    setOficinaDestSearch(formatOfficeName(o));
    setShowOficinaDestDropdown(false);
  };

  const handleOficinaDestSearchChange = (val: string) => {
    setOficinaDestSearch(val);
    setForm(prev => ({ ...prev, codOfiDest: '' }));
    setShowOficinaDestDropdown(true);
  };

  const handleSelectAsigOr = (a: any) => {
    setForm(prev => ({ ...prev, codAsigOr: a.codAsig.toString() }));
    setAsigOrSearch(formatAsignacion(a, cats?.todosResponsables));
    setShowAsigOrDropdown(false);
  };

  const handleAsigOrSearchChange = (val: string) => {
    setAsigOrSearch(val);
    setForm(prev => ({ ...prev, codAsigOr: '' }));
    setShowAsigOrDropdown(true);
  };

  const handleSelectAsigDe = (a: any) => {
    setForm(prev => ({ ...prev, codAsigDe: a.codAsig.toString() }));
    setAsigDeSearch(formatAsignacion(a, cats?.todosResponsables));
    setShowAsigDeDropdown(false);
  };

  const handleAsigDeSearchChange = (val: string) => {
    setAsigDeSearch(val);
    setForm(prev => ({ ...prev, codAsigDe: '' }));
    setShowAsigDeDropdown(true);
  };

  // Autocomplete filtering
  const filteredOficinasDest = cats?.todasOficinas?.filter((o: any) => {
    const fullCode = getOfficeFullCode(o).toLowerCase();
    const unifiedCode = getOfficeUnifiedCode(o).toLowerCase();
    const text = o.desDpto.toLowerCase();
    const query = oficinaDestSearch.toLowerCase();
    return text.includes(query) || fullCode.includes(query) || unifiedCode.includes(query);
  }) || [];

  const filteredAsigOr = cats?.todasAsignaciones?.filter((asig: any) => {
    const resp = cats?.todosResponsables?.find((r: any) => String(r.codResp) === String(asig.codResp));
    const respName = resp ? `${resp.codEmp.nombre} ${resp.codEmp.apellido}`.toLowerCase() : '';
    const oficName = asig.codOfic ? asig.codOfic.desDpto.toLowerCase() : '';
    const query = asigOrSearch.toLowerCase();
    return (
      String(asig.codAsig).includes(query) ||
      respName.includes(query) ||
      oficName.includes(query)
    );
  }) || [];

  const filteredAsigDe = cats?.todasAsignaciones?.filter((asig: any) => {
    const resp = cats?.todosResponsables?.find((r: any) => String(r.codResp) === String(asig.codResp));
    const respName = resp ? `${resp.codEmp.nombre} ${resp.codEmp.apellido}`.toLowerCase() : '';
    const oficName = asig.codOfic ? asig.codOfic.desDpto.toLowerCase() : '';
    const query = asigDeSearch.toLowerCase();
    return (
      String(asig.codAsig).includes(query) ||
      respName.includes(query) ||
      oficName.includes(query)
    );
  }) || [];

  const filteredActivosNew = cats?.todosActivos?.filter((a: any) => {
    if (selectedActivos.some(sel => String(sel.nroActivo) === String(a.nroActivo))) return false;
    const code = a.codActivo.toLowerCase();
    const desc = a.descripcion.toLowerCase();
    const query = activoNewSearch.toLowerCase();
    return code.includes(query) || desc.includes(query);
  }) || [];

  const filteredActivosExist = cats?.todosActivos?.filter((a: any) => {
    const code = a.codActivo.toLowerCase();
    const desc = a.descripcion.toLowerCase();
    const query = activoExistSearch.toLowerCase();
    return code.includes(query) || desc.includes(query);
  }) || [];

  // Abrir modal para transferencia EXISTENTE
  const handleAbrirExistente = (codTransf: number) => {
    setTransfCreada(codTransf);
    setNroActivoTransf('');
    setActivoExistSearch('');
    setShowModal(true);
  };

  // Abrir modal para transferencia NUEVA
  const handleNueva = () => {
    setTransfCreada(null);
    setNroActivoTransf('');
    setSelectedActivos([]);
    setOficinaDestSearch('');
    setAsigOrSearch('');
    setAsigDeSearch('');
    setActivoNewSearch('');
    setActivoExistSearch('');
    setForm({
      codOfiRem: '',
      codOfiDest: '',
      fechaTransf: '',
      codAsigOr: '',
      codAsigDe: ''
    });
    setShowModal(true);
  };

  const handleCrear = async () => {
    if (!form.codOfiDest || !form.fechaTransf) {
      alert('Complete los campos obligatorios (Oficina Destino y Fecha)');
      return;
    }
    if (selectedActivos.length === 0) {
      alert('Debe seleccionar al menos un activo para transferir');
      return;
    }

    // Resolve source office for each selected asset
    const assetsWithOffice = selectedActivos.map(asset => {
      const office = getActivoOffice(asset);
      return { asset, office };
    });

    // Verify all selected assets have a derived source office
    const missingOffice = assetsWithOffice.find(x => !x.office);
    if (missingOffice) {
      alert(`No se pudo determinar la oficina origen del activo ${missingOffice.asset.codActivo}.`);
      return;
    }

    // Group assets by source office ID
    const groups: Record<string, any[]> = {};
    assetsWithOffice.forEach(x => {
      const officeId = String(x.office.codOfic);
      if (!groups[officeId]) {
        groups[officeId] = [];
      }
      groups[officeId].push(x.asset);
    });

    try {
      const createdTransfers: number[] = [];
      
      // Perform creation for each group sequentially
      for (const officeId of Object.keys(groups)) {
        const assetsInGroup = groups[officeId];
        
        // 1. Create the transfer record
        const res = await crearTransf({
          variables: {
            tipoTransf: 'T',
            codOfiRem: parseInt(officeId),
            codOfiDest: parseInt(form.codOfiDest),
            fechaTransf: form.fechaTransf,
            codAsigOr: form.codAsigOr ? parseInt(form.codAsigOr) : null,
            codAsigDe: form.codAsigDe ? parseInt(form.codAsigDe) : null
          }
        });
        
        const newCodTransf = res.data?.crearTransferencia?.transferido?.codTransf;
        if (!newCodTransf) throw new Error("No se pudo obtener el ID de la transferencia creada");
        
        // 2. Add each asset in the group to this transfer
        for (const asset of assetsInGroup) {
          await agregarActivo({
            variables: {
              codTransf: parseInt(String(newCodTransf)),
              nroActivo: parseInt(String(asset.nroActivo)),
              cantidad: 1
            }
          });
        }
        
        createdTransfers.push(newCodTransf);
      }

      alert(`Se crearon con éxito ${createdTransfers.length} transferencia(s) para los activos seleccionados: ` + createdTransfers.map(id => `#${id}`).join(', '));
      setShowModal(false);
      setSelectedActivos([]);
      setOficinaDestSearch('');
      setAsigOrSearch('');
      setAsigDeSearch('');
      setActivoNewSearch('');
      setActivoExistSearch('');
      setForm({
        codOfiRem: '',
        codOfiDest: '',
        fechaTransf: '',
        codAsigOr: '',
        codAsigDe: ''
      });
      refetch();
    } catch (e: any) {
      alert('Error al crear las transferencias: ' + e.message);
    }
  };

  const handleAgregar = async () => {
    if (!transfCreada || !nroActivoTransf) {
      alert('Seleccione un activo');
      return;
    }
    try {
      await agregarActivo({
        variables: {
          codTransf: parseInt(String(transfCreada)),
          nroActivo: parseInt(nroActivoTransf),
          cantidad: 1
        }
      });
      alert('Activo agregado a la transferencia #' + transfCreada);
      setShowModal(false);
      setTransfCreada(null);
      setOficinaDestSearch('');
      setAsigOrSearch('');
      setAsigDeSearch('');
      setActivoNewSearch('');
      setActivoExistSearch('');
      setForm({
        codOfiRem: '',
        codOfiDest: '',
        fechaTransf: '',
        codAsigOr: '',
        codAsigDe: ''
      });
      setNroActivoTransf('');
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleCambiarEstado = async (codTransf: number, nuevoEstado: string) => {
    try {
      await editarTransf({
        variables: {
          codTransf: parseInt(String(codTransf)),
          estado: nuevoEstado
        }
      });
      alert(`Transferencia #${codTransf} actualizada a: ` + (estadoLabel[nuevoEstado] || nuevoEstado));
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleAnular = async (codTransf: number) => {
    if (!window.confirm('¿Está seguro de que desea ANULAR esta transferencia?')) return;
    try {
      await anularTransf({
        variables: {
          codTransf: parseInt(String(codTransf))
        }
      });
      alert(`Transferencia #${codTransf} anulada.`);
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleCerrarModal = () => {
    setShowModal(false);
    setTransfCreada(null);
    setSelectedActivos([]);
    setOficinaDestSearch('');
    setAsigOrSearch('');
    setAsigDeSearch('');
    setActivoNewSearch('');
    setActivoExistSearch('');
    setForm({
      codOfiRem: '',
      codOfiDest: '',
      fechaTransf: '',
      codAsigOr: '',
      codAsigDe: ''
    });
    setNroActivoTransf('');
  };

  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Transferencias de Activos"
      actions={[
        ...(puedeCrear ? [{ label: 'Nuevo', icon: '+', variant: 'primary' as const, onClick: handleNueva }] : []),
        { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
      ]}
    >
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Nro.</th>
              <th>Origen</th>
              <th>Destino</th>
              <th style={{ width: '180px' }}>Asig. Origen / Destino</th>
              <th>Activos Transferidos</th>
              <th style={{ width: '110px' }}>Fecha</th>
              <th style={{ width: '100px' }}>Estado</th>
              <th style={{ width: '240px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse border-b border-slate-700/30">
                  <td><div className="h-4 bg-slate-700 rounded w-8"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-44"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-44"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-24"></div></td>
                  <td><div className="h-6 bg-slate-700 rounded w-60"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-20"></div></td>
                  <td><div className="h-5 bg-slate-700 rounded-full w-16"></div></td>
                  <td><div className="h-6 bg-slate-700 rounded w-36 ml-auto"></div></td>
                </tr>
              ))
            ) : (
              <>
                {data?.todasTransferencias?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No hay transferencias registradas
                    </td>
                  </tr>
                )}
                {data?.todasTransferencias?.map((t: any) => (
                  <tr key={t.codTransf} className="border-b border-slate-700 hover:bg-slate-700/30 transition">
                <td><strong>#{t.codTransf}</strong></td>
                <td>{formatOfficeName(t.codOfiRem) || '-'}</td>
                <td>{formatOfficeName(t.codOfiDest) || '-'}</td>
                <td>
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {t.codAsigOr ? `Asig. #${t.codAsigOr}` : '-'} → {t.codAsigDe ? `Asig. #${t.codAsigDe}` : '-'}
                  </span>
                </td>
                <td>
                  {t.inDetTranfSet && t.inDetTranfSet.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1rem', listStyleType: 'disc', fontSize: '0.78rem', color: '#475569' }}>
                      {t.inDetTranfSet.map((det: any) => (
                        <li key={det.id} style={{ marginBottom: '2px' }}>
                          <strong style={{ fontFamily: 'monospace', color: '#2563eb' }}>{det.nroActivo?.codActivo}</strong> — {det.nroActivo?.descripcion}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      Sin activos asignados
                    </span>
                  )}
                </td>
                <td>{t.fechaTransf || '-'}</td>
                <td>
                  <span className={`badge ${estadoClass[t.estado] || 'badge-secondary'}`}>
                    {estadoLabel[t.estado] || t.estado}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {puedeCrear && t.estado === 'P' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        onClick={() => handleAbrirExistente(t.codTransf)}
                      >
                        + Activo
                      </button>
                    )}
                    {puedeAutorizar && t.estado === 'P' && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.75rem', backgroundColor: '#16a34a', color: '#fff', border: 'none' }}
                          onClick={() => handleCambiarEstado(t.codTransf, 'A')}
                        >
                          Aprobar
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.75rem', backgroundColor: '#dc2626', color: '#fff', border: 'none' }}
                          onClick={() => handleCambiarEstado(t.codTransf, 'R')}
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {puedeAutorizar && t.estado === 'A' && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.75rem', backgroundColor: '#2563eb', color: '#fff', border: 'none' }}
                        onClick={() => handleCambiarEstado(t.codTransf, 'C')}
                      >
                        Completar
                      </button>
                    )}
                    {t.estado !== 'B' && t.estado !== 'C' && (puedeCrear || puedeAutorizar) && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.75rem', backgroundColor: 'transparent', border: '1px solid #dc2626', color: '#dc2626' }}
                        onClick={() => handleAnular(t.codTransf)}
                      >
                        Anular
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCerrarModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {transfCreada ? `Transferencia #${transfCreada} — Agregar Activo` : 'Nueva Transferencia'}
            </h2>

            {!transfCreada ? (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Oficina Destino *</label>
                    <div className="autocomplete-container">
                      <input
                        type="text"
                        value={oficinaDestSearch}
                        onChange={e => handleOficinaDestSearchChange(e.target.value)}
                        onFocus={() => setShowOficinaDestDropdown(true)}
                        onBlur={() => setTimeout(() => setShowOficinaDestDropdown(false), 200)}
                        placeholder="Buscar oficina por código o nombre..."
                      />
                      {showOficinaDestDropdown && (
                        <ul className="autocomplete-dropdown">
                          {filteredOficinasDest.slice(0, 20).map((o: any) => (
                            <li
                              key={o.codOfic}
                              className="autocomplete-item"
                              onClick={() => handleSelectOficinaDest(o)}
                            >
                              {formatOfficeName(o)}
                            </li>
                          ))}
                          {filteredOficinasDest.length === 0 && (
                            <li className="autocomplete-no-results">No se encontraron oficinas</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Fecha *</label>
                    <input type="date" value={form.fechaTransf} onChange={e => setForm({...form, fechaTransf: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <label className="mb-0">Asignación Origen (Opcional)</label>
                      <span 
                        className="cursor-help text-blue-400 hover:text-blue-300 font-bold font-mono text-[10px] select-none bg-blue-500/10 border border-blue-500/20 w-4 h-4 rounded-full flex items-center justify-center transition-all"
                        title="Opcional. Vincula la transferencia a una asignación de origen específica."
                      >
                        ?
                      </span>
                    </div>
                    <div className="autocomplete-container">
                      <input
                        type="text"
                        value={asigOrSearch}
                        onChange={e => handleAsigOrSearchChange(e.target.value)}
                        onFocus={() => setShowAsigOrDropdown(true)}
                        onBlur={() => setTimeout(() => setShowAsigOrDropdown(false), 200)}
                        placeholder="Buscar asignación por código, custodio u oficina..."
                      />
                      {showAsigOrDropdown && (
                        <ul className="autocomplete-dropdown">
                          {filteredAsigOr.slice(0, 20).map((a: any) => (
                            <li
                              key={a.codAsig}
                              className="autocomplete-item"
                              onClick={() => handleSelectAsigOr(a)}
                            >
                              {formatAsignacion(a, cats?.todosResponsables)}
                            </li>
                          ))}
                          {filteredAsigOr.length === 0 && (
                            <li className="autocomplete-no-results">No se encontraron asignaciones</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <label className="mb-0">Asignación Destino (Opcional)</label>
                      <span 
                        className="cursor-help text-blue-400 hover:text-blue-300 font-bold font-mono text-[10px] select-none bg-blue-500/10 border border-blue-500/20 w-4 h-4 rounded-full flex items-center justify-center transition-all"
                        title="Opcional. Registra automáticamente una asignación de destino para el activo."
                      >
                        ?
                      </span>
                    </div>
                    <div className="autocomplete-container">
                      <input
                        type="text"
                        value={asigDeSearch}
                        onChange={e => handleAsigDeSearchChange(e.target.value)}
                        onFocus={() => setShowAsigDeDropdown(true)}
                        onBlur={() => setTimeout(() => setShowAsigDeDropdown(false), 200)}
                        placeholder="Buscar asignación por código, custodio u oficina..."
                      />
                      {showAsigDeDropdown && (
                        <ul className="autocomplete-dropdown">
                          {filteredAsigDe.slice(0, 20).map((a: any) => (
                            <li
                              key={a.codAsig}
                              className="autocomplete-item"
                              onClick={() => handleSelectAsigDe(a)}
                            >
                              {formatAsignacion(a, cats?.todosResponsables)}
                            </li>
                          ))}
                          {filteredAsigDe.length === 0 && (
                            <li className="autocomplete-no-results">No se encontraron asignaciones</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label style={{ fontWeight: 'bold' }}>Agregar Activos a Transferir *</label>
                  <div className="autocomplete-container">
                    <input
                      type="text"
                      value={activoNewSearch}
                      onChange={e => {
                        setActivoNewSearch(e.target.value);
                        setShowActivoNewDropdown(true);
                      }}
                      onFocus={() => setShowActivoNewDropdown(true)}
                      onBlur={() => setTimeout(() => setShowActivoNewDropdown(false), 200)}
                      placeholder="Buscar por código de activo o descripción..."
                    />
                    {showActivoNewDropdown && (
                      <ul className="autocomplete-dropdown">
                        {filteredActivosNew.slice(0, 20).map((a: any) => {
                          const office = getActivoOffice(a);
                          const officeLabel = office ? formatOfficeName(office) : 'Sin oficina';
                          return (
                            <li
                              key={a.nroActivo}
                              className="autocomplete-item"
                              onClick={() => handleSelectAssetForForm(a)}
                            >
                              <strong style={{ color: '#2563eb' }}>{a.codActivo}</strong> — {a.descripcion} ({officeLabel})
                            </li>
                          );
                        })}
                        {filteredActivosNew.length === 0 && (
                          <li className="autocomplete-no-results">No se encontraron activos</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                {selectedActivos.length > 0 && (
                  <div style={{ marginTop: '0.75rem', maxHeight: '180px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px', background: '#f8fafc' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Activos Seleccionados ({selectedActivos.length}):</span>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {selectedActivos.map((a: any) => {
                        const office = getActivoOffice(a);
                        return (
                          <li key={a.nroActivo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                            <span style={{ color: '#334155' }}>
                              <strong style={{ fontFamily: 'monospace', color: '#2563eb' }}>{a.codActivo}</strong> — {a.descripcion}
                              <br />
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Origen: {office ? formatOfficeName(office) : 'Sin determinar'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAssetFromForm(a.nroActivo)}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                            >
                              Quitar
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button className="btn btn-secondary" onClick={handleCerrarModal}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleCrear}>Crear Transferencia(s)</button>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Activo *</label>
                  <div className="autocomplete-container">
                    <input
                      type="text"
                      value={activoExistSearch}
                      onChange={e => handleActivoExistSearchChange(e.target.value)}
                      onFocus={() => setShowActivoExistDropdown(true)}
                      onBlur={() => setTimeout(() => setShowActivoExistDropdown(false), 200)}
                      placeholder="Buscar activo por código o descripción..."
                    />
                    {showActivoExistDropdown && (
                      <ul className="autocomplete-dropdown">
                        {filteredActivosExist.slice(0, 20).map((a: any) => {
                          const office = getActivoOffice(a);
                          const officeLabel = office ? formatOfficeName(office) : 'Sin oficina';
                          return (
                            <li
                              key={a.nroActivo}
                              className="autocomplete-item"
                              onClick={() => handleSelectAssetForExist(a)}
                            >
                              <strong style={{ color: '#2563eb' }}>{a.codActivo}</strong> — {a.descripcion} ({officeLabel})
                            </li>
                          );
                        })}
                        {filteredActivosExist.length === 0 && (
                          <li className="autocomplete-no-results">No se encontraron activos</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1.15rem' }}>
                  <button className="btn btn-secondary" onClick={handleCerrarModal}>Cerrar</button>
                  <button className="btn btn-primary" onClick={handleAgregar}>Agregar Activo</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}