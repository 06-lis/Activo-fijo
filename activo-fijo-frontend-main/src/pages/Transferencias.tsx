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
          codResp
          empleadoResponsable {
            idEmpleado
            nombre
            apellido
            cargo
          }
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
  nivel
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
        idEmpleado
        nombre
        apellido
        cargo
      }
    }
  }
`;

const CREAR_ASIGNACION = gql`
  mutation CrearAsignacion($tipoAsig: Int!, $tipoResp: Int!, $codResp: Int!, $codOfic: Int!, $fechaAsig: Date!) {
    crearAsignacion(tipoAsig: $tipoAsig, tipoResp: $tipoResp, codResp: $codResp, codOfic: $codOfic, fechaAsig: $fechaAsig) {
      asignado {
        codAsig
        fechaAsig
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

  const code = String(ofic.codDpto || '');

  if (!ofic.codPadre) return code;

  const parentCode = getOfficeFullCode(ofic.codPadre);

  if (!parentCode) return code;

  if (code.startsWith(parentCode + '-')) {
    return code;
  }

  return parentCode + '-' + code;
}

function getOfficeUnifiedCode(ofic: any): string {
  return getOfficeFullCode(ofic);
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// Helper function to resolve the current custodian of an asset
function getActivoCustodio(activo: any, responsables?: any[]): { nombre: string; cargo?: string; codResp?: number; codAsig?: number } | null {
  if (!activo) return null;
  const activeAsig = activo.inDetAsigSet?.find(
    (det: any) => det.codAsig?.estado === 'A'
  );
  if (activeAsig?.codAsig) {
    const emp = activeAsig.codAsig.empleadoResponsable;
    if (emp) {
      return {
        nombre: `${emp.nombre} ${emp.apellido}`,
        cargo: emp.cargo || '',
        codResp: activeAsig.codAsig.codResp,
        codAsig: activeAsig.codAsig.codAsig,
      };
    }
    if (activeAsig.codAsig.codResp && responsables) {
      const resp = responsables.find((r: any) => String(r.codResp) === String(activeAsig.codAsig.codResp));
      if (resp?.codEmp) {
        return {
          nombre: `${resp.codEmp.nombre} ${resp.codEmp.apellido}`,
          cargo: resp.codEmp.cargo || '',
          codResp: activeAsig.codAsig.codResp,
          codAsig: activeAsig.codAsig.codAsig,
        };
      }
    }
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
    codOfiDest: '',
    fechaTransf: new Date().toISOString().split('T')[0]
  });
  const [nroActivoTransf, setNroActivoTransf] = useState('');
  
  // Selection states for new transfer active list
  const [selectedActivos, setSelectedActivos] = useState<any[]>([]);

  // Autocomplete search states - Destino
  const [oficinaDestSearch, setOficinaDestSearch] = useState('');
  const [showOficinaDestDropdown, setShowOficinaDestDropdown] = useState(false);

  const [nuevoRespSearch, setNuevoRespSearch] = useState('');
  const [selectedNuevoResp, setSelectedNuevoResp] = useState<any | null>(null);
  const [showNuevoRespDropdown, setShowNuevoRespDropdown] = useState(false);

  // Asset autocomplete search states
  const [activoNewSearch, setActivoNewSearch] = useState('');
  const [showActivoNewDropdown, setShowActivoNewDropdown] = useState(false);

  const [activoExistSearch, setActivoExistSearch] = useState('');
  const [showActivoExistDropdown, setShowActivoExistDropdown] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_TRANSFERENCIAS);
  const { data: cats } = useQuery(GET_CATS);
  const [crearTransf] = useMutation(CREAR_TRANSF);
  const [crearAsignacion] = useMutation(CREAR_ASIGNACION);
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

  const handleSelectNuevoResp = (r: any) => {
    setSelectedNuevoResp(r);
    setNuevoRespSearch(`${r.codEmp.nombre} ${r.codEmp.apellido}${r.codEmp.cargo ? ` (${r.codEmp.cargo})` : ''}`);
    setShowNuevoRespDropdown(false);
  };

  const handleNuevoRespSearchChange = (val: string) => {
    setNuevoRespSearch(val);
    setSelectedNuevoResp(null);
    setShowNuevoRespDropdown(true);
  };
  // Autocomplete filtering
  const filteredOficinasDest = cats?.todasOficinas?.filter((o: any) => {
    if (Number(o.nivel) !== 3) return false;

    const fullCode = getOfficeFullCode(o).toLowerCase();
    const unifiedCode = fullCode.replace(/-/g, '');
    const text = formatOfficeName(o).toLowerCase();
    const query = oficinaDestSearch.trim().toLowerCase();

    return text.includes(query)
      || fullCode.includes(query)
      || unifiedCode.includes(query);
  }) || [];

  const filteredResponsables = cats?.todosResponsables?.filter((r: any) => {
    if (!r.codEmp) return false;
    const fullName = `${r.codEmp.nombre} ${r.codEmp.apellido}`.toLowerCase();
    const cargo = (r.codEmp.cargo || '').toLowerCase();
    const query = nuevoRespSearch.toLowerCase();

    return fullName.includes(query)
      || cargo.includes(query)
      || String(r.codResp).includes(query);
  }) || [];

  const filteredActivosNew = cats?.todosActivos?.filter((a: any) => {
    if (selectedActivos.some(sel => String(sel.nroActivo) === String(a.nroActivo))) return false;
    const code = a.codActivo.toLowerCase();
    const desc = a.descripcion.toLowerCase();
    const query = activoNewSearch.toLowerCase();
    return code.includes(query) || desc.includes(query);
  }) || [];

  const filteredActivosExist = cats?.todosActivos?.filter((a: any) => {
  const transferencia = data?.todasTransferencias?.find(
    (t: any) => String(t.codTransf) === String(transfCreada)
  );

  const yaAgregado = transferencia?.inDetTranfSet?.some(
    (det: any) =>
      String(det.nroActivo?.nroActivo) === String(a.nroActivo)
  );

  if (yaAgregado) return false;

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
    setNuevoRespSearch('');
    setSelectedNuevoResp(null);
    setActivoNewSearch('');
    setActivoExistSearch('');
    setForm({
      codOfiDest: '',
      fechaTransf: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleCrear = async () => {
    if (selectedActivos.length === 0) {
      alert('Debe seleccionar al menos un activo para transferir.');
      return;
    }
    if (!form.codOfiDest) {
      alert('Debe seleccionar la Oficina / Ubicación Destino.');
      return;
    }
    if (!selectedNuevoResp) {
      alert('Debe seleccionar al Nuevo Custodio / Funcionario Receptor.');
      return;
    }
    if (!form.fechaTransf) {
      alert('Debe ingresar la Fecha de Traslado.');
      return;
    }

    // Resolve source office, origin custodian, and active assignment for each selected asset
    const assetsWithOffice = selectedActivos.map(asset => {
      const office = getActivoOffice(asset);
      const activeAsig = asset.inDetAsigSet?.find((det: any) => det.codAsig?.estado === 'A')?.codAsig;
      const custodio = getActivoCustodio(asset, cats?.todosResponsables);
      return { asset, office, activeAsig, custodio };
    });

    // Verify all selected assets have a derived source office
    const missingOffice = assetsWithOffice.find(x => !x.office);
    if (missingOffice) {
      alert(`No se pudo determinar la oficina origen del activo ${missingOffice.asset.codActivo}.`);
      return;
    }

    // Group assets by origin (office + active assignment / origin custodian)
    // If assets come from different offices or custodians, they each get their own legal transfer!
    const groups: Record<string, { office: any; activeAsig: any; custodio: any; assets: any[] }> = {};
    assetsWithOffice.forEach(x => {
      const groupKey = `${x.office.codOfic}_${x.activeAsig?.codAsig || '0'}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          office: x.office,
          activeAsig: x.activeAsig,
          custodio: x.custodio,
          assets: []
        };
      }
      groups[groupKey].assets.push(x.asset);
    });

    try {
      // 1. Create or ensure Destination Assignment for the recipient in the destination office
      const asigRes = await crearAsignacion({
        variables: {
          tipoAsig: 1, // Normal
          tipoResp: 1, // Empleado
          codResp: parseInt(selectedNuevoResp.codResp),
          codOfic: parseInt(form.codOfiDest),
          fechaAsig: form.fechaTransf
        }
      });
      const newCodAsigDe = asigRes.data?.crearAsignacion?.asignado?.codAsig;

      const createdTransfers: { codTransf: number; origenOffice: string; origenCustodio: string; count: number }[] = [];

      // 2. Perform creation for each origin group
      for (const key of Object.keys(groups)) {
        const group = groups[key];

        const res = await crearTransf({
          variables: {
            tipoTransf: 'T',
            codOfiRem: parseInt(String(group.office.codOfic)),
            codOfiDest: parseInt(form.codOfiDest),
            fechaTransf: form.fechaTransf,
            codAsigOr: group.activeAsig?.codAsig ? parseInt(String(group.activeAsig.codAsig)) : null,
            codAsigDe: newCodAsigDe ? parseInt(String(newCodAsigDe)) : null
          }
        });

        const newCodTransf = res.data?.crearTransferencia?.transferido?.codTransf;
        if (!newCodTransf) throw new Error("No se pudo obtener el ID de la transferencia creada");

        // 3. Attach assets in this group
        for (const asset of group.assets) {
          await agregarActivo({
            variables: {
              codTransf: parseInt(String(newCodTransf)),
              nroActivo: parseInt(String(asset.nroActivo)),
              cantidad: 1
            }
          });
        }

        createdTransfers.push({
          codTransf: newCodTransf,
          origenOffice: group.office.desDpto || `Oficina #${group.office.codOfic}`,
          origenCustodio: group.custodio?.nombre || 'Sin custodio',
          count: group.assets.length
        });
      }

      const respNombre = `${selectedNuevoResp.codEmp.nombre} ${selectedNuevoResp.codEmp.apellido}`;
      const msg = createdTransfers.length === 1
        ? `✅ Transferencia #${createdTransfers[0].codTransf} registrada con éxito hacia ${oficinaDestSearch}.\nCustodio receptor: ${respNombre} (${createdTransfers[0].count} activo/s transferidos).`
        : `✅ Se generaron ${createdTransfers.length} transferencias automáticas por origen hacia ${oficinaDestSearch}:\n` +
          createdTransfers.map(t => `• Transferencia #${t.codTransf}: Origen [${t.origenOffice} · ${t.origenCustodio}] (${t.count} activo/s)`).join('\n') +
          `\nTodos asignados a: ${respNombre}`;

      alert(msg);
      setShowModal(false);
      setSelectedActivos([]);
      setOficinaDestSearch('');
      setNuevoRespSearch('');
      setSelectedNuevoResp(null);
      setActivoNewSearch('');
      setActivoExistSearch('');
      setForm({
        codOfiDest: '',
        fechaTransf: new Date().toISOString().split('T')[0]
      });
      refetch();
    } catch (e: any) {
      alert('Error al registrar las transferencias: ' + e.message);
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
      setNuevoRespSearch('');
      setSelectedNuevoResp(null);
      setActivoNewSearch('');
      setActivoExistSearch('');
      setForm({
        codOfiDest: '',
        fechaTransf: new Date().toISOString().split('T')[0]
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
    setNuevoRespSearch('');
    setSelectedNuevoResp(null);
    setActivoNewSearch('');
    setActivoExistSearch('');
    setForm({
      codOfiDest: '',
      fechaTransf: new Date().toISOString().split('T')[0]
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
         <div
  className="modal modal-lg"
  onClick={e => e.stopPropagation()}
  style={transfCreada ? {
    width: '95%',
    maxWidth: '1000px',
    minHeight: 'min(450px, 85vh)',
    maxHeight: '90vh',
 overflowY: 'auto',
display: 'flex',
flexDirection: 'column'
  } : undefined}
>
            <h2 className="modal-title">
              {transfCreada ? `Transferencia #${transfCreada} — Agregar Activo` : 'Nueva Transferencia'}
            </h2>

            {!transfCreada ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* SECCIÓN 1: ACTIVOS A TRANSFERIR (ORIGEN) */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                        1. Seleccionar Activos a Transferir *
                      </label>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                        Busque y agregue los activos. El sistema detectará automáticamente la ubicación y el responsable actual de cada uno.
                      </p>
                    </div>

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
                            const custodio = getActivoCustodio(a, cats?.todosResponsables);
                            return (
                              <li
                                key={a.nroActivo}
                                className="autocomplete-item"
                                onClick={() => handleSelectAssetForForm(a)}
                                style={{ padding: '8px 12px' }}
                              >
                                <strong style={{ color: '#2563eb' }}>{a.codActivo}</strong> — {a.descripcion}
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                  <span>📍 {officeLabel}</span>
                                  {custodio && <span style={{ marginLeft: '10px' }}>👤 {custodio.nombre}</span>}
                                </div>
                              </li>
                            );
                          })}
                          {filteredActivosNew.length === 0 && (
                            <li className="autocomplete-no-results">No se encontraron activos disponibles</li>
                          )}
                        </ul>
                      )}
                    </div>

                    {selectedActivos.length > 0 && (
                      <div style={{ marginTop: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                          Activos Seleccionados ({selectedActivos.length}):
                        </span>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {selectedActivos.map((a: any) => {
                            const office = getActivoOffice(a);
                            const custodio = getActivoCustodio(a, cats?.todosResponsables);
                            return (
                              <li
                                key={a.nroActivo}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px 12px',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '6px',
                                  background: '#ffffff',
                                  fontSize: '0.8rem'
                                }}
                              >
                                <div>
                                  <div style={{ color: '#1e293b' }}>
                                    <strong style={{ fontFamily: 'monospace', color: '#2563eb', marginRight: '6px' }}>{a.codActivo}</strong>
                                    — {a.descripcion}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                    <span>📍 <strong>Origen:</strong> {office ? formatOfficeName(office) : 'Sin oficina determinada'}</span>
                                    <span>👤 <strong>A cargo:</strong> {custodio ? `${custodio.nombre}${custodio.cargo ? ` (${custodio.cargo})` : ''}` : <span style={{ color: '#94a3b8' }}>Sin custodio asignado</span>}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAssetFromForm(a.nroActivo)}
                                  style={{
                                    background: '#fee2e2',
                                    border: '1px solid #fca5a5',
                                    color: '#dc2626',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    marginLeft: '12px'
                                  }}
                                >
                                  ✕ Quitar
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* SECCIÓN 2: DESTINO DE LA TRANSFERENCIA */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                        2. Destino de la Transferencia
                      </label>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                        Indique la oficina receptora, la persona que asumirá la custodia y la fecha del traslado.
                      </p>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Oficina / Ubicación Destino *</label>
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
                        <label>Nuevo Responsable Receptor *</label>
                        <div className="autocomplete-container">
                          <input
                            type="text"
                            value={nuevoRespSearch}
                            onChange={e => handleNuevoRespSearchChange(e.target.value)}
                            onFocus={() => setShowNuevoRespDropdown(true)}
                            onBlur={() => setTimeout(() => setShowNuevoRespDropdown(false), 200)}
                            placeholder="Buscar custodio por nombre o cargo..."
                          />
                          {showNuevoRespDropdown && (
                            <ul className="autocomplete-dropdown">
                              {filteredResponsables.slice(0, 20).map((r: any) => (
                                <li
                                  key={r.codResp}
                                  className="autocomplete-item"
                                  onClick={() => handleSelectNuevoResp(r)}
                                >
                                  <strong>{r.codEmp.nombre} {r.codEmp.apellido}</strong>
                                  {r.codEmp.cargo && <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '6px' }}>({r.codEmp.cargo})</span>}
                                </li>
                              ))}
                              {filteredResponsables.length === 0 && (
                                <li className="autocomplete-no-results">No se encontraron responsables</li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Fecha de Traslado *</label>
                        <input
                          type="date"
                          value={form.fechaTransf}
                          onChange={e => setForm({ ...form, fechaTransf: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button className="btn btn-secondary" onClick={handleCerrarModal}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleCrear}>Confirmar y Crear Transferencia(s)</button>
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
  <ul className="autocomplete-dropdown" style={{
    position: 'relative',
    maxHeight: '280px',
    overflowY: 'auto',
    width: '100%'
  }}>
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
               <div className="modal-actions" style={{
  display: 'flex',
  gap: '8px',
  justifyContent: 'flex-end',
  marginTop: 'auto',
  padding: '12px',
  flexShrink: 0
}}>
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