import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

// ==================== QUERIES & MUTATIONS ====================
const GET_ADQUISICIONES_DATA = gql`
  query GetAdquisiciones {
    todasSolicitudes(soloActivas: false) {
      nroSol
      gestion
      codEstprog
      glosa
      fecha
      aB
      empSol {
        codResp
        codEmp {
          idEmpleado
          nombre
          apellido
        }
      }
      empResp {
        codResp
        codEmp {
          idEmpleado
          nombre
          apellido
        }
      }
    }
    todasOfertas {
      nroOferta
      fechaOfer
      glosa
      estado
      nroSol {
        nroSol
        glosa
      }
      codProv {
        codProv
        nombre
      }
    }
    todasOrdenesCompra(soloActivas: false) {
      nroCompra
      fechaOrden
      glosa
      nroComEgre
      aB
      nroOferta {
        nroOferta
        codProv {
          nombre
        }
      }
      empResp {
        codResp
        codEmp {
          nombre
          apellido
        }
      }
    }
    todosResponsables(soloActivos: true) {
      codResp
      codEstprog
      codEmp {
        idEmpleado
        nombre
        apellido
      }
    }
    todosProvedores {
      codProv
      nombre
    }
    todosUsuarios {
      idUsuario
      correo
      idEmpleado {
        idEmpleado
      }
    }
    todasMarcas {
      codMarca
      desMarca
    }
    todosModelos {
      codModelo
      desModelo
      codMarca {
        codMarca
      }
    }
    todosTipomats {
      tipoMat
      desMat
    }
  }
`;

const GET_DET_SOL = gql`
  query GetDetSol($nroSol: Int!) {
    detSolPorSolicitud(nroSol: $nroSol) {
      idMaterial
      cantidad
    }
  }
`;

const GET_DET_OFER = gql`
  query GetDetOfer($nroOferta: Int!) {
    detOferPorOferta(nroOferta: $nroOferta) {
      idMaterial
      cantidad
      montoUni
      idMarca
      idModelo
    }
  }
`;

const CREAR_SOLICITUD = gql`
  mutation CrearSolicitud($gestion: Int!, $codEstprog: String!, $empSol: Int!, $glosa: String!, $empResp: Int!, $codEmp: Int!, $fecha: Date!) {
    crearSolicitud(gestion: $gestion, codEstprog: $codEstprog, empSol: $empSol, glosa: $glosa, empResp: $empResp, codEmp: $codEmp, fecha: $fecha) {
      solicitud {
        nroSol
      }
    }
  }
`;

const AGREGAR_DET_SOL = gql`
  mutation AgregarDetSol($nroSol: Int!, $idMaterial: Int!, $cantidad: Int!) {
    agregarDetSol(nroSol: $nroSol, idMaterial: $idMaterial, cantidad: $cantidad) {
      detSol {
        idMaterial
      }
    }
  }
`;

const ANULAR_SOLICITUD = gql`
  mutation AnularSolicitud($nroSol: Int!) {
    anularSolicitud(nroSol: $nroSol) {
      solicitud {
        nroSol
        aB
      }
    }
  }
`;

const APROBAR_SOLICITUD = gql`
  mutation AprobarSolicitud($nroSol: Int!) {
    aprobarSolicitud(nroSol: $nroSol) {
      solicitud {
        nroSol
        aB
      }
    }
  }
`;

const RECHAZAR_SOLICITUD = gql`
  mutation RechazarSolicitud($nroSol: Int!, $motivo: String) {
    rechazarSolicitud(nroSol: $nroSol, motivo: $motivo) {
      solicitud {
        nroSol
        aB
      }
    }
  }
`;
const CREAR_OFERTA = gql`
  mutation CrearOferta($nroSol: Int!, $codProv: Int!, $fechaOfer: Date!, $glosa: String) {
    crearOferta(nroSol: $nroSol, codProv: $codProv, fechaOfer: $fechaOfer, glosa: $glosa) {
      oferta {
        nroOferta
      }
    }
  }
`;

const AGREGAR_DET_OFER = gql`
  mutation AgregarDetOfer($nroOferta: Int!, $idMaterial: Int!, $cantidad: Int!, $montoUni: Float!, $idMarca: Int, $idModelo: Int) {
    agregarDetOfer(nroOferta: $nroOferta, idMaterial: $idMaterial, cantidad: $cantidad, montoUni: $montoUni, idMarca: $idMarca, idModelo: $idModelo) {
      detOfer {
        idMaterial
      }
    }
  }
`;

const ANULAR_OFERTA = gql`
  mutation AnularOferta($nroOferta: Int!) {
    anularOferta(nroOferta: $nroOferta) {
      oferta {
        nroOferta
        estado
      }
    }
  }
`;

const CREAR_ORDEN_COMPRA = gql`
  mutation CrearOrdenCompra($nroOferta: Int!, $empResp: Int!, $fechaOrden: Date!, $glosa: String, $nroComEgre: Int) {
    crearOrdenCompra(nroOferta: $nroOferta, empResp: $empResp, fechaOrden: $fechaOrden, glosa: $glosa, nroComEgre: $nroComEgre) {
      ordenCompra {
        nroCompra
      }
    }
  }
`;

const ANULAR_ORDEN_COMPRA = gql`
  mutation AnularOrdenCompra($nroCompra: Int!) {
    anularOrdenCompra(nroCompra: $nroCompra) {
      ordenCompra {
        nroCompra
        aB
      }
    }
  }
`;

export default function Adquisiciones() {
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || '';
  const [activeTab, setActiveTab] = useState<'solicitudes' | 'ofertas' | 'ordenes'>('solicitudes');

  // Permisos granulares
  const puedeVerOrdenes = user?.esAdmin || user?.permisos.includes('ver_ordenes');
  const puedeVerFacturas = user?.esAdmin || user?.permisos.includes('ver_facturas');
  const puedeVerGlobal = puedeVerOrdenes || puedeVerFacturas;

  const puedeCrearOrden = user?.esAdmin || user?.permisos.includes('crear_orden');
  const puedeAutorizarOrden = user?.esAdmin || user?.permisos.includes('autorizar_orden');
  const puedeEliminarOrden = user?.esAdmin || user?.permisos.includes('eliminar_orden');

  const puedeCrearFactura = user?.esAdmin || user?.permisos.includes('crear_factura');
  const puedeEliminarFactura = user?.esAdmin || user?.permisos.includes('eliminar_factura');

  // Expanded rows
  const [expandedSol, setExpandedSol] = useState<number | null>(null);
  const [expandedOfer, setExpandedOfer] = useState<number | null>(null);

  // Modals
  const [showSolModal, setShowSolModal] = useState(false);
  const [showOferModal, setShowOferModal] = useState(false);
  const [showOrdenModal, setShowOrdenModal] = useState(false);

  // Form states - Solicitud
  const [solForm, setSolForm] = useState({
    gestion: new Date().getFullYear().toString(),
    codEstprog: '',
    empSol: '',
    empResp: '',
    glosa: '',
    fecha: new Date().toISOString().split('T')[0]
  });
  const [solItems, setSolItems] = useState<{ idMaterial: string; cantidad: string }[]>([
    { idMaterial: '', cantidad: '' }
  ]);

  // Form states - Oferta
  const [oferForm, setOferForm] = useState({
    nroSol: '',
    codProv: '',
    fechaOfer: new Date().toISOString().split('T')[0],
    glosa: ''
  });
  const [oferItems, setOferItems] = useState<Record<number, { cantidad: string; montoUni: string; idMarca: string; idModelo: string }>>({});

  // Form states - Orden Compra
  const [ordenForm, setOrdenForm] = useState({
    nroOferta: '',
    empResp: '',
    fechaOrden: new Date().toISOString().split('T')[0],
    glosa: '',
    nroComEgre: ''
  });

  // Apollo queries
  const { data, loading, error, refetch } = useQuery(GET_ADQUISICIONES_DATA);

  // Apollo mutations
  const [crearSolicitud] = useMutation(CREAR_SOLICITUD);
  const [agregarDetSol] = useMutation(AGREGAR_DET_SOL);
  const [anularSolicitud] = useMutation(ANULAR_SOLICITUD);
  const [aprobarSolicitud] = useMutation(APROBAR_SOLICITUD);
  const [rechazarSolicitud] = useMutation(RECHAZAR_SOLICITUD);
  const [crearOferta] = useMutation(CREAR_OFERTA);
  const [agregarDetOfer] = useMutation(AGREGAR_DET_OFER);
  const [anularOferta] = useMutation(ANULAR_OFERTA);
  const [crearOrdenCompra] = useMutation(CREAR_ORDEN_COMPRA);
  const [anularOrdenCompra] = useMutation(ANULAR_ORDEN_COMPRA);

  // Redirección por defecto según permisos
  React.useEffect(() => {
    if (!puedeVerOrdenes && puedeVerFacturas) {
      setActiveTab('ofertas');
    }
  }, [puedeVerOrdenes, puedeVerFacturas]);

  if (loading) return <div className="loading">Cargando datos de adquisiciones...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  if (!puedeVerGlobal) {
    return (
      <PageLayout
        title="Acceso Restringido"
        subtitle="No tiene los permisos necesarios para ver esta sección."
      >
        <div className="error-container" style={{ padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Acceso Denegado</h2>
          <p style={{ color: '#666' }}>Se requiere el permiso de ver órdenes o facturas para ingresar al módulo de adquisiciones.</p>
        </div>
      </PageLayout>
    );
  }

  // Resolve current user's employee and their responsable record
  const currentUsrObj = data?.todosUsuarios?.find((u: any) => u.correo === userEmail);
  const currentEmpId = currentUsrObj?.idEmpleado?.idEmpleado;
  // Find the responsable associated with the current employee
  const myResponsable = data?.todosResponsables?.find((r: any) => r.codEmp?.idEmpleado === currentEmpId);
  const myRespId = myResponsable?.codResp ? String(myResponsable.codResp) : '';

  // ==================== SOLICITUDES HANDLERS ====================
  const handleAddSolItem = () => {
    setSolItems([...solItems, { idMaterial: '', cantidad: '' }]);
  };

  const handleRemoveSolItem = (index: number) => {
    const next = [...solItems];
    next.splice(index, 1);
    setSolItems(next);
  };

  const handleSolItemChange = (index: number, field: string, value: string) => {
    const next = [...solItems];
    next[index] = { ...next[index], [field]: value };
    setSolItems(next);
  };

  const handleOpenSolModal = () => {
    setSolForm(prev => ({
      ...prev,
      empSol: myRespId  // Auto-fill with current user's responsable
    }));
    setShowSolModal(true);
  };

  const handleSubmitSolicitud = async () => {
    const { gestion, codEstprog, empSol, empResp, glosa, fecha } = solForm;
    if (!gestion || !codEstprog || !empSol || !empResp || !glosa || !fecha) {
      alert('Por favor complete todos los campos de cabecera.');
      return;
    }
    if (solItems.length === 0 || solItems.some(i => !i.idMaterial || !i.cantidad)) {
      alert('Por favor agregue al menos un ítem con tipo de material y cantidad válidos.');
      return;
    }

    try {
      // 1. Crear solicitud
      const res = await crearSolicitud({
        variables: {
          gestion: parseInt(gestion),
          codEstprog,
          empSol: parseInt(empSol),
          glosa,
          empResp: parseInt(empResp),
          codEmp: parseInt(String(currentEmpId || empSol)),
          fecha
        }
      });

      const nroSolGenerated = res.data?.crearSolicitud?.solicitud?.nroSol;

      // 2. Agregar detalles
      if (nroSolGenerated) {
        for (const item of solItems) {
          await agregarDetSol({
            variables: {
              nroSol: parseInt(String(nroSolGenerated)),
              idMaterial: parseInt(item.idMaterial),
              cantidad: parseInt(item.cantidad)
            }
          });
        }
      }

      alert('✅ Solicitud de compra registrada con éxito');
      setShowSolModal(false);
      setSolForm({
        gestion: new Date().getFullYear().toString(),
        codEstprog: '',
        empSol: '',
        empResp: '',
        glosa: '',
        fecha: new Date().toISOString().split('T')[0]
      });
      setSolItems([{ idMaterial: '', cantidad: '' }]);
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleAnularSolicitud = async (nroSol: number) => {
    if (!window.confirm(`¿Está seguro de anular la solicitud #${nroSol}?`)) return;
    try {
      await anularSolicitud({ variables: { nroSol: parseInt(String(nroSol)) } });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleAprobarSolicitud = async (nroSol: number) => {
    if (!window.confirm(`¿Confirmar aprobación de la solicitud #${nroSol}?\n\nLuego podrá registrar cotizaciones (ofertas) vinculadas a esta solicitud.`)) return;
    try {
      await aprobarSolicitud({ variables: { nroSol: parseInt(String(nroSol)) } });
      alert('✅ Solicitud aprobada. Ya puede registrar cotizaciones.');
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleRechazarSolicitud = async (nroSol: number) => {
    const motivo = window.prompt(`¿Motivo de rechazo para la solicitud #${nroSol}? (opcional)`);
    if (motivo === null) return; // user cancelled
    try {
      await rechazarSolicitud({ variables: { nroSol: parseInt(String(nroSol)), motivo: motivo || undefined } });
      alert('❌ Solicitud rechazada.');
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // ==================== OFERTAS HANDLERS ====================
  const handleSelectSolForOferta = async (nroSolStr: string) => {
    setOferForm(prev => ({ ...prev, nroSol: nroSolStr }));
    if (!nroSolStr) {
      setOferItems({});
      return;
    }
    // Fetch details of selected solicitud to pre-populate offer items
    try {
      await refetch();
      // Since refetch fetches everything, we can also fetch detSolPorSolicitud manually using Apollo client
      // But we can query the backend directly using client if needed. To keep it simple, we fetch details when opening
    } catch (e) {}
  };

  // Pre-load materials for the selected Solicitud in Oferta Form
  const triggerLoadSolDetails = async (nroSolId: number) => {
    try {
      await refetch(); // just to ensure data is updated
    } catch (e) {}
  };

  const handleSubmitOferta = async () => {
    const { nroSol, codProv, fechaOfer, glosa } = oferForm;
    if (!nroSol || !codProv || !fechaOfer) {
      alert('Complete los campos obligatorios de la oferta.');
      return;
    }

    const itemsArray = Object.entries(oferItems).map(([matId, fields]) => ({
      idMaterial: parseInt(matId),
      cantidad: parseInt(fields.cantidad),
      montoUni: parseFloat(fields.montoUni),
      idMarca: fields.idMarca ? parseInt(fields.idMarca) : 0,
      idModelo: fields.idModelo ? parseInt(fields.idModelo) : 0
    }));

    if (itemsArray.length === 0 || itemsArray.some(i => !i.cantidad || isNaN(i.montoUni))) {
      alert('Especifique cantidades y montos unitarios válidos para los ítems.');
      return;
    }

    try {
      // 1. Crear Oferta
      const res = await crearOferta({
        variables: {
          nroSol: parseInt(nroSol),
          codProv: parseInt(codProv),
          fechaOfer,
          glosa
        }
      });

      const nroOfertaGenerated = res.data?.crearOferta?.oferta?.nroOferta;

      // 2. Agregar Detalles
      if (nroOfertaGenerated) {
        for (const item of itemsArray) {
          await agregarDetOfer({
            variables: {
              nroOferta: parseInt(String(nroOfertaGenerated)),
              idMaterial: item.idMaterial,
              cantidad: item.cantidad,
              montoUni: item.montoUni,
              idMarca: item.idMarca || null,
              idModelo: item.idModelo || null
            }
          });
        }
      }

      alert('✅ Oferta/Cotización del proveedor registrada con éxito');
      setShowOferModal(false);
      setOferForm({
        nroSol: '',
        codProv: '',
        fechaOfer: new Date().toISOString().split('T')[0],
        glosa: ''
      });
      setOferItems({});
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleAnularOferta = async (nroOferta: number) => {
    if (!window.confirm(`¿Está seguro de anular la oferta #${nroOferta}?`)) return;
    try {
      await anularOferta({ variables: { nroOferta: parseInt(String(nroOferta)) } });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // ==================== ORDENES HANDLERS ====================
  const handleSubmitOrden = async () => {
    const { nroOferta, empResp, fechaOrden, glosa, nroComEgre } = ordenForm;
    if (!nroOferta || !empResp || !fechaOrden || !nroComEgre) {
      alert('Complete los campos obligatorios para generar la orden.');
      return;
    }

    try {
      await crearOrdenCompra({
        variables: {
          nroOferta: parseInt(nroOferta),
          empResp: parseInt(empResp),
          fechaOrden,
          glosa,
          nroComEgre: parseInt(nroComEgre)
        }
      });

      alert('✅ Orden de compra generada con éxito.');
      setShowOrdenModal(false);
      setOrdenForm({
        nroOferta: '',
        empResp: '',
        fechaOrden: new Date().toISOString().split('T')[0],
        glosa: '',
        nroComEgre: ''
      });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleAnularOrden = async (nroCompra: number) => {
    if (!window.confirm(`¿Está seguro de anular la orden de compra #${nroCompra}?`)) return;
    try {
      await anularOrdenCompra({ variables: { nroCompra: parseInt(String(nroCompra)) } });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const pageActions = [];
  let showNewButton = false;
  if (activeTab === 'solicitudes' && puedeCrearOrden) showNewButton = true;
  if (activeTab === 'ofertas' && puedeCrearFactura) showNewButton = true;
  if (activeTab === 'ordenes' && puedeCrearOrden) showNewButton = true;

  if (showNewButton) {
    pageActions.push({
      label: activeTab === 'solicitudes' ? 'Nueva Solicitud' : activeTab === 'ofertas' ? 'Nueva Oferta' : 'Generar Orden',
      icon: '+',
      variant: 'primary' as const,
      onClick: () => {
        if (activeTab === 'solicitudes') handleOpenSolModal();
        else if (activeTab === 'ofertas') setShowOferModal(true);
        else setShowOrdenModal(true);
      }
    });
  }
  pageActions.push({ label: 'Actualizar', icon: '↺', onClick: () => refetch() });

  return (
    <PageLayout
      title="Portal de Adquisiciones"
      actions={pageActions}
    >


      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', marginBottom: '1.5rem', gap: '0.5rem' }}>
        {puedeVerOrdenes && (
          <button
            onClick={() => setActiveTab('solicitudes')}
            style={{
              padding: '0.6rem 1.25rem',
              border: 'none',
              borderBottom: activeTab === 'solicitudes' ? '3px solid #3b82f6' : '3px solid transparent',
              background: 'none',
              fontWeight: activeTab === 'solicitudes' ? '700' : '500',
              color: activeTab === 'solicitudes' ? '#3b82f6' : '#64748b',
              cursor: 'pointer'
            }}
          >
            Solicitudes (Requisiciones)
          </button>
        )}
        {puedeVerFacturas && (
          <button
            onClick={() => setActiveTab('ofertas')}
            style={{
              padding: '0.6rem 1.25rem',
              border: 'none',
              borderBottom: activeTab === 'ofertas' ? '3px solid #10b981' : '3px solid transparent',
              background: 'none',
              fontWeight: activeTab === 'ofertas' ? '700' : '500',
              color: activeTab === 'ofertas' ? '#10b981' : '#64748b',
              cursor: 'pointer'
            }}
          >
            Ofertas / Cotizaciones
          </button>
        )}
        {puedeVerOrdenes && (
          <button
            onClick={() => setActiveTab('ordenes')}
            style={{
              padding: '0.6rem 1.25rem',
              border: 'none',
              borderBottom: activeTab === 'ordenes' ? '3px solid #1a3c6e' : '3px solid transparent',
              background: 'none',
              fontWeight: activeTab === 'ordenes' ? '700' : '500',
              color: activeTab === 'ordenes' ? '#1a3c6e' : '#64748b',
              cursor: 'pointer'
            }}
          >
            Órdenes de Compra
          </button>
        )}
      </div>

      {/* TAB CONTENT: SOLICITUDES */}
      {activeTab === 'solicitudes' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nro Sol.</th>
                <th>Gestión</th>
                <th>Est. Prog.</th>
                <th>Glosa / Descripción</th>
                <th>Solicitante</th>
                <th>Aprobador</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.todasSolicitudes?.length === 0 && (
                <tr><td colSpan={9} className="empty">No hay solicitudes registradas</td></tr>
              )}
              {data?.todasSolicitudes?.map((s: any) => {
                const isExpanded = expandedSol === s.nroSol;
                return (
                  <React.Fragment key={s.nroSol}>
                    <tr
                      onClick={() => setExpandedSol(isExpanded ? null : s.nroSol)}
                      style={{ cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white' }}
                    >
                      <td><strong>#{s.nroSol}</strong></td>
                      <td>{s.gestion}</td>
                      <td><span className="badge badge-info">{s.codEstprog}</span></td>
                      <td>{s.glosa}</td>
                      <td>{s.empSol ? `${s.empSol.codEmp.nombre} ${s.empSol.codEmp.apellido}` : '-'}</td>
                      <td>{s.empResp ? `${s.empResp.codEmp.nombre} ${s.empResp.codEmp.apellido}` : '-'}</td>
                      <td>{s.fecha}</td>
                      <td>
                        {s.aB === 'A' && <span className="badge" style={{ background: '#f59e0b', color: 'white' }}>Pendiente</span>}
                        {s.aB === 'P' && <span className="badge badge-success">Aprobada</span>}
                        {s.aB === 'R' && <span className="badge badge-danger">Rechazada</span>}
                        {s.aB === 'B' && <span className="badge" style={{ background: '#94a3b8', color: 'white' }}>Anulada</span>}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="btn-group">
                           <button className="btn btn-info btn-sm" onClick={() => setExpandedSol(isExpanded ? null : s.nroSol)}>
                            {isExpanded ? 'Ocultar' : 'Ver Detalle'}
                          </button>
                          {/* Aprobador puede Aprobar o Rechazar solicitudes pendientes */}
                          {s.aB === 'A' && s.empResp?.codResp === myResponsable?.codResp && puedeAutorizarOrden && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleAprobarSolicitud(s.nroSol)}
                                title="Aprobar solicitud"
                              >
                                Aprobar
                              </button>
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => handleRechazarSolicitud(s.nroSol)}
                                title="Rechazar solicitud"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {s.aB === 'A' && s.empResp?.codResp !== myResponsable?.codResp && (
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              Pendiente de {s.empResp?.codEmp?.nombre}
                            </span>
                          )}
                          {s.aB === 'A' && puedeEliminarOrden && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleAnularSolicitud(s.nroSol)}>
                              Anular
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                      <td colSpan={9} style={{ background: '#f1f5f9', padding: '1rem' }}>
                        <SolicitudDetalles nroSol={s.nroSol} tiposMat={data?.todosTipomats || []} />
                      </td>
                    </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: OFERTAS */}
      {activeTab === 'ofertas' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nro Oferta</th>
                <th>Solicitud Ref</th>
                <th>Proveedor</th>
                <th>Glosa</th>
                <th>Fecha Cotiz.</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.todasOfertas?.length === 0 && (
                <tr><td colSpan={7} className="empty">No hay cotizaciones u ofertas registradas</td></tr>
              )}
              {data?.todasOfertas?.map((o: any) => {
                const isExpanded = expandedOfer === o.nroOferta;
                return (
                  <React.Fragment key={o.nroOferta}>
                    <tr
                      onClick={() => setExpandedOfer(isExpanded ? null : o.nroOferta)}
                      style={{ cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white' }}
                    >
                      <td><strong>#{o.nroOferta}</strong></td>
                      <td>#{o.nroSol?.nroSol} — {o.nroSol?.glosa}</td>
                      <td><strong>{o.codProv?.nombre}</strong></td>
                      <td>{o.glosa || '-'}</td>
                      <td>{o.fechaOfer}</td>
                      <td>
                        <span className={`badge ${
                          o.estado === 'A' ? 'badge-success' :
                          o.estado === 'P' ? 'badge-warning' :
                          'badge-danger'
                        }`}>
                          {o.estado === 'A' ? 'Aprobada' : o.estado === 'P' ? 'Pendiente' : 'Anulada'}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="btn-group">
                          <button className="btn btn-info btn-sm" onClick={() => setExpandedOfer(isExpanded ? null : o.nroOferta)}>
                            {isExpanded ? 'Ocultar Detalle' : 'Ver Detalle'}
                          </button>
                          {o.estado === 'P' && puedeEliminarFactura && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleAnularOferta(o.nroOferta)}>
                              Anular
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ background: '#f1f5f9', padding: '1rem' }}>
                          <OfertaDetalles nroOferta={o.nroOferta} marcas={data.todasMarcas} modelos={data.todosModelos} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: ORDENES */}
      {activeTab === 'ordenes' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nro Orden</th>
                <th>Oferta Ref</th>
                <th>Proveedor</th>
                <th>Glosa</th>
                <th>Nro Compr. Egresos</th>
                <th>Fecha Autoriz.</th>
                <th>Aprobado Por</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.todasOrdenesCompra?.length === 0 && (
                <tr><td colSpan={9} className="empty">No hay órdenes de compra registradas</td></tr>
              )}
              {data?.todasOrdenesCompra?.map((o: any) => (
                <tr key={o.nroCompra}>
                  <td><strong>#{o.nroCompra}</strong></td>
                  <td>#{o.nroOferta?.nroOferta}</td>
                  <td><strong>{o.nroOferta?.codProv?.nombre}</strong></td>
                  <td>{o.glosa}</td>
                  <td><span className="badge badge-info">{o.nroComEgre}</span></td>
                  <td>{o.fechaOrden}</td>
                  <td>{o.empResp ? `${o.empResp.codEmp.nombre} ${o.empResp.codEmp.apellido}` : '-'}</td>
                  <td>
                    <span className={`badge ${o.aB === 'A' ? 'badge-success' : 'badge-danger'}`}>
                      {o.aB === 'A' ? 'Autorizada' : 'Anulada'}
                    </span>
                  </td>
                  <td>
                    {o.aB === 'A' && puedeEliminarOrden && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleAnularOrden(o.nroCompra)}>
                        Anular
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== MODAL: NUEVA SOLICITUD ==================== */}
      {showSolModal && (
        <div className="modal-overlay" onClick={() => setShowSolModal(false)}>
          <div className="modal" style={{ width: '700px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Registrar Nueva Solicitud de Compra</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Gestión Anual *</label>
                <input
                  type="number"
                  value={solForm.gestion}
                  onChange={e => setSolForm({ ...solForm, gestion: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Código de Programa (Est. Prog.) *</label>
                <input
                  type="text"
                  placeholder="Ej. 1221"
                  value={solForm.codEstprog}
                  onChange={e => setSolForm({ ...solForm, codEstprog: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Responsable Solicitante *</label>
                {myRespId ? (
                  <div style={{ padding: '0.5rem 0.75rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', fontSize: '0.875rem', color: '#166534', fontWeight: 600 }}>
                    ✓ {myResponsable?.codEmp?.nombre} {myResponsable?.codEmp?.apellido} — Prog. {myResponsable?.codEstprog}
                    <input type="hidden" value={solForm.empSol} />
                  </div>
                ) : (
                  <select
                    value={solForm.empSol}
                    onChange={e => setSolForm({ ...solForm, empSol: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {data?.todosResponsables?.map((r: any) => (
                      <option key={r.codResp} value={r.codResp}>
                        [{r.codEstprog}] {r.codEmp.nombre} {r.codEmp.apellido}
                      </option>
                    ))}
                  </select>
                )}
                {!myRespId && <small style={{ color: '#ef4444', fontSize: '0.75rem' }}>Tu usuario no tiene un responsable asignado. Selecciónalo manualmente.</small>}
              </div>

              <div className="form-group">
                <label>Responsable Aprobador *</label>
                <select
                  value={solForm.empResp}
                  onChange={e => setSolForm({ ...solForm, empResp: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {data?.todosResponsables?.map((r: any) => (
                    <option key={r.codResp} value={r.codResp}>
                      [{r.codEstprog}] {r.codEmp.nombre} {r.codEmp.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group form-group-full">
                <label>Glosa / Justificación de Compra *</label>
                <input
                  type="text"
                  placeholder="Ej. Adquisición de computadoras portátiles para soporte"
                  value={solForm.glosa}
                  onChange={e => setSolForm({ ...solForm, glosa: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Fecha Solicitud *</label>
                <input
                  type="date"
                  value={solForm.fecha}
                  onChange={e => setSolForm({ ...solForm, fecha: e.target.value })}
                />
              </div>
            </div>

            {/* Dynamic Items Entry */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #cbd5e1', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#1a3c6e', fontWeight: 600 }}>Ítems / Materiales Solicitados</h4>
                <button className="btn btn-success btn-sm" onClick={handleAddSolItem}>+ Agregar Material</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {solItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ flex: 3 }}>
                      <select
                        value={item.idMaterial}
                        onChange={e => handleSolItemChange(idx, 'idMaterial', e.target.value)}
                        style={{ padding: '0.4rem', width: '100%' }}
                      >
                        <option value="">Seleccionar tipo de material...</option>
                        {data?.todosTipomats?.map((t: any) => (
                          <option key={t.tipoMat} value={t.tipoMat}>{t.desMat}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="number"
                        placeholder="Cantidad"
                        value={item.cantidad}
                        onChange={e => handleSolItemChange(idx, 'cantidad', e.target.value)}
                        style={{ padding: '0.4rem' }}
                      />
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleRemoveSolItem(idx)}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowSolModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmitSolicitud}>Registrar Solicitud</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NUEVA OFERTA ==================== */}
      {showOferModal && (
        <div className="modal-overlay" onClick={() => setShowOferModal(false)}>
          <div className="modal" style={{ width: '750px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Registrar Oferta / Cotización de Proveedor</h2>

            <div className="form-grid">
              <div className="form-group">
                <label>Solicitud de Compra Ref. *</label>
                <select
                  value={oferForm.nroSol}
                  onChange={e => {
                    handleSelectSolForOferta(e.target.value);
                    if (e.target.value) {
                      triggerLoadSolDetails(parseInt(e.target.value));
                    }
                  }}
                >
                  <option value="">Seleccionar Solicitud...</option>
                  {data?.todasSolicitudes?.filter((s: any) => s.aB === 'A').map((s: any) => (
                    <option key={s.nroSol} value={s.nroSol}>
                      #{s.nroSol} — {s.glosa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Proveedor *</label>
                <select
                  value={oferForm.codProv}
                  onChange={e => setOferForm({ ...oferForm, codProv: e.target.value })}
                >
                  <option value="">Seleccione Proveedor...</option>
                  {data?.todosProvedores?.map((p: any) => (
                    <option key={p.codProv} value={p.codProv}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Fecha Cotización *</label>
                <input
                  type="date"
                  value={oferForm.fechaOfer}
                  onChange={e => setOferForm({ ...oferForm, fechaOfer: e.target.value })}
                />
              </div>

              <div className="form-group form-group-full">
                <label>Glosa / Observaciones</label>
                <input
                  type="text"
                  placeholder="Ej. Propuesta económica de equipos HP con descuento corporativo"
                  value={oferForm.glosa}
                  onChange={e => setOferForm({ ...oferForm, glosa: e.target.value })}
                />
              </div>
            </div>

            {/* Items details load based on selected solicitud */}
            {oferForm.nroSol && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #cbd5e1', paddingTop: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#10b981', fontWeight: 600 }}>Detallar Precios Ofertados</h4>
                <OfertaItemLoader
                  nroSol={parseInt(oferForm.nroSol)}
                  marcas={data.todasMarcas}
                  modelos={data.todosModelos}
                  onChange={(items) => setOferItems(items)}
                />
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowOferModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmitOferta}>Guardar Cotización</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NUEVA ORDEN DE COMPRA ==================== */}
      {showOrdenModal && (
        <div className="modal-overlay" onClick={() => setShowOrdenModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Generar Orden de Compra</h2>

            <div className="form-grid">
              <div className="form-group form-group-full">
                <label>Seleccionar Oferta Aprobada *</label>
                <select
                  value={ordenForm.nroOferta}
                  onChange={e => setOrdenForm({ ...ordenForm, nroOferta: e.target.value })}
                >
                  <option value="">Seleccione Cotización Ganadora...</option>
                  {data?.todasOfertas?.filter((o: any) => o.estado === 'P').map((o: any) => (
                    <option key={o.nroOferta} value={o.nroOferta}>
                      #{o.nroOferta} — {o.codProv?.nombre} (Sol Ref: #{o.nroSol?.nroSol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Responsable Aprobador *</label>
                <select
                  value={ordenForm.empResp}
                  onChange={e => setOrdenForm({ ...ordenForm, empResp: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {data?.todosResponsables?.map((r: any) => (
                    <option key={r.codResp} value={r.codResp}>
                      [{r.codEstprog}] {r.codEmp.nombre} {r.codEmp.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Nro Comprobante Egreso *</label>
                <input
                  type="number"
                  placeholder="Ej. 100234"
                  value={ordenForm.nroComEgre}
                  onChange={e => setOrdenForm({ ...ordenForm, nroComEgre: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Fecha de la Orden *</label>
                <input
                  type="date"
                  value={ordenForm.fechaOrden}
                  onChange={e => setOrdenForm({ ...ordenForm, fechaOrden: e.target.value })}
                />
              </div>

              <div className="form-group form-group-full">
                <label>Glosa de Autorización</label>
                <input
                  type="text"
                  placeholder="Justificación / Referencia de Orden de Compra"
                  value={ordenForm.glosa}
                  onChange={e => setOrdenForm({ ...ordenForm, glosa: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowOrdenModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmitOrden}>Autorizar Orden de Compra</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

// ==================== SUBCOMPONENTS ====================

// Solicitud Detail View
function SolicitudDetalles({ nroSol, tiposMat }: { nroSol: number; tiposMat: any[] }) {
  const { data, loading, error } = useQuery(GET_DET_SOL, {
    variables: { nroSol: parseInt(String(nroSol)) },
    skip: !nroSol
  });

  if (loading) return <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Cargando detalles...</div>;
  if (error) return <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Error: {error.message}</div>;

  return (
    <div>
      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Materiales Solicitados:</h4>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {data?.detSolPorSolicitud?.map((item: any, idx: number) => {
          const mat = tiposMat.find((t: any) => t.tipoMat === item.idMaterial);
          return (
            <div key={idx} style={{ background: 'white', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
              <strong>{mat ? mat.desMat : `Mat. #${item.idMaterial}`}</strong> | Cantidad: <strong>{item.cantidad}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Oferta Detail View
function OfertaDetalles({ nroOferta, marcas, modelos }: { nroOferta: number; marcas: any[]; modelos: any[] }) {
  const { data, loading, error } = useQuery(GET_DET_OFER, {
    variables: { nroOferta: parseInt(String(nroOferta)) },
    skip: !nroOferta
  });

  if (loading) return <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Cargando detalles...</div>;
  if (error) return <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Error: {error.message}</div>;

  return (
    <div>
      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Artículos Ofertados y Precios:</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
        {data?.detOferPorOferta?.map((item: any, idx: number) => {
          const brand = marcas?.find((m: any) => m.codMarca === item.idMarca);
          const model = modelos?.find((m: any) => m.codModelo === item.idModelo);
          return (
            <div key={idx} style={{ background: 'white', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}>
              Material Ref: <strong>#{item.idMaterial}</strong> <br />
              Cantidad: <strong>{item.cantidad}</strong> | P. Unitario: <strong style={{ color: '#059669' }}>Bs. {parseFloat(item.montoUni).toFixed(2)}</strong> <br />
              {brand && <span>Marca: {brand.desMarca} {model ? `/ Modelo: ${model.desModelo}` : ''}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Component to dynamically enter cotization inputs for materials of the referenced Solicitud
function OfertaItemLoader({ nroSol, marcas, modelos, onChange }: { nroSol: number; marcas: any[]; modelos: any[]; onChange: (items: any) => void }) {
  const { data, loading, error } = useQuery(GET_DET_SOL, {
    variables: { nroSol: parseInt(String(nroSol)) },
    skip: !nroSol
  });

  const [itemsMap, setItemsMap] = useState<Record<number, { cantidad: string; montoUni: string; idMarca: string; idModelo: string }>>({});

  React.useEffect(() => {
    if (data?.detSolPorSolicitud) {
      const initialMap: any = {};
      data.detSolPorSolicitud.forEach((item: any) => {
        initialMap[item.idMaterial] = {
          cantidad: item.cantidad.toString(),
          montoUni: '',
          idMarca: '',
          idModelo: ''
        };
      });
      setItemsMap(initialMap);
      onChange(initialMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleChange = (materialId: number, field: string, value: string) => {
    const next = {
      ...itemsMap,
      [materialId]: {
        ...itemsMap[materialId],
        [field]: value
      }
    };
    setItemsMap(next);
    onChange(next);
  };

  if (loading) return <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Cargando requerimientos de solicitud...</div>;
  if (error) return <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Error: {error.message}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto' }}>
      {data?.detSolPorSolicitud?.map((item: any) => {
        const current = itemsMap[item.idMaterial] || { cantidad: item.cantidad.toString(), montoUni: '', idMarca: '', idModelo: '' };
        
        // Filter models for selected brand
        const modelsFiltered = modelos?.filter((m: any) => String(m.codMarca?.codMarca) === String(current.idMarca)) || [];

        return (
          <div key={item.idMaterial} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '100px', fontSize: '0.8rem' }}>
              Material: <strong>#{item.idMaterial}</strong> <br />
              Req: <strong>{item.cantidad} u</strong>
            </div>
            
            <div style={{ flex: '1', minWidth: '80px' }}>
              <input
                type="number"
                placeholder="Cant. Cotiz"
                value={current.cantidad}
                onChange={e => handleChange(item.idMaterial, 'cantidad', e.target.value)}
                style={{ padding: '0.35rem', fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ flex: '1', minWidth: '80px' }}>
              <input
                type="number"
                step="0.01"
                placeholder="Bs. Unitario"
                value={current.montoUni}
                onChange={e => handleChange(item.idMaterial, 'montoUni', e.target.value)}
                style={{ padding: '0.35rem', fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ flex: '1.2', minWidth: '110px' }}>
              <select
                value={current.idMarca}
                onChange={e => handleChange(item.idMaterial, 'idMarca', e.target.value)}
                style={{ padding: '0.35rem', fontSize: '0.8rem' }}
              >
                <option value="">Marca...</option>
                {marcas?.map((m: any) => (
                  <option key={m.codMarca} value={m.codMarca}>{m.desMarca}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1.2', minWidth: '110px' }}>
              <select
                value={current.idModelo}
                onChange={e => handleChange(item.idMaterial, 'idModelo', e.target.value)}
                style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                disabled={!current.idMarca}
              >
                <option value="">Modelo...</option>
                {modelsFiltered.map((m: any) => (
                  <option key={m.codModelo} value={m.codModelo}>{m.desModelo}</option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
