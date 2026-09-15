import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { GET_ACTIVOS_PAGINADOS, GET_CATALOGOS_ACTIVOS } from '../graphql/queries';
import { CREAR_ACTIVO, EDITAR_ACTIVO, APROBAR_ACTIVO } from '../graphql/mutations';
import PageLayout from '../components/ui/PageLayout';
import { useAuth } from '../context/AuthContext';
import { Code39Barcode, QRCodeImage } from '../utils/barcodes';


const GET_VEHICULO = gql`
  query GetVehiculo($nroActivo: Int!) {
    vehiculoPorActivo(nroActivo: $nroActivo) {
      nroActivo {
        nroActivo
      }
      tipo
      marca
      modelo
      anio
      color
      placa
      motor
      chasis
      cilindrada
      industria
      ruat
      carnetProp
      poliza
      factura
      resMin
      resAdm
      infTec
      leyEstado
      ds
      docTransf
      docCompVen
      minuta
      actaCoVe
      imagen
    }
  }
`;

const GUARDAR_VEHICULO = gql`
  mutation GuardarVehiculo(
    $nroActivo: Int!, $tipo: String, $marca: String, $modelo: String,
    $anio: Int, $color: String, $placa: String, $motor: String, $chasis: String,
    $cilindrada: Int, $industria: String, $ruat: String, $carnetProp: String,
    $poliza: String, $factura: Int, $resMin: String, $resAdm: String,
    $infTec: String, $leyEstado: String, $ds: String, $docTransf: String,
    $docCompVen: String, $minuta: String, $actaCoVe: String, $imagen: String
  ) {
    guardarVehiculo(
      nroActivo: $nroActivo, tipo: $tipo, marca: $marca, modelo: $modelo,
      anio: $anio, color: $color, placa: $placa, motor: $motor, chasis: $chasis,
      cilindrada: $cilindrada, industria: $industria, ruat: $ruat, carnetProp: $carnetProp,
      poliza: $poliza, factura: $factura, resMin: $resMin, resAdm: $resAdm,
      infTec: $infTec, leyEstado: $leyEstado, ds: $ds, docTransf: $docTransf,
      docCompVen: $docCompVen, minuta: $minuta, actaCoVe: $actaCoVe, imagen: $imagen
    ) {
      vehiculo {
        nroActivo {
          nroActivo
        }
        placa
      }
    }
  }
`;

const GET_SPECS_DATA = gql`
  query GetSpecsData($codGrupo: Int!, $nroActivo: Int!) {
    atributosPorGrupo(codGrupo: $codGrupo, soloActivos: true) {
      codAtrib
      des
      inDetAtribSet {
        codDetAtrib
        nroAtrib
        des
        aB
      }
    }
    atribActivosPorActivo(nroActivo: $nroActivo) {
      codDetAtrib {
        codDetAtrib
        codAtrib {
          codAtrib
        }
      }
      ok
      valor
    }
  }
`;

const ASIGNAR_ATRIB_ACTIVO = gql`
  mutation AsignarAtribActivo($codDetAtrib: Int!, $nroActivo: Int!, $ok: String, $valor: String) {
    asignarAtribActivo(codDetAtrib: $codDetAtrib, nroActivo: $nroActivo, ok: $ok, valor: $valor) {
      atribActivo {
        codDetAtrib {
          codDetAtrib
        }
        ok
        valor
      }
    }
  }
`;

const EDITAR_ATRIB_ACTIVO = gql`
  mutation EditarAtribActivo($codDetAtrib: Int!, $nroActivo: Int!, $ok: String, $valor: String) {
    editarAtribActivo(codDetAtrib: $codDetAtrib, nroActivo: $nroActivo, ok: $ok, valor: $valor) {
      atribActivo {
        codDetAtrib {
          codDetAtrib
        }
        ok
        valor
      }
    }
  }
`;

const CREAR_DET_ATRIB = gql`
  mutation CrearDetAtrib($codAtrib: Int!, $nroAtrib: String!, $des: String!) {
    crearDetAtrib(codAtrib: $codAtrib, nroAtrib: $nroAtrib, des: $des) {
      detAtrib {
        codDetAtrib
        nroAtrib
        des
        aB
      }
    }
  }
`;

const GRUPOS_SIMPLES = ['MOBILIARIO', 'MUEBLES', 'ENSERES', 'SILLA', 'MESA', 'ESCRITORIO'];
const esGrupoSimple = (desGrupo: string) =>
  GRUPOS_SIMPLES.some(g => desGrupo?.toUpperCase().includes(g));

// Helper functions for office/group codes
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

function getGroupFullCode(grupo: any): string {
  if (!grupo) return '';
  const parts = [];
  let current = grupo;
  while (current) {
    parts.unshift(current.codHijo);
    current = current.codPadre;
  }
  return parts.join('-');
}

function getGroupUnifiedCode(grupo: any): string {
  if (!grupo) return '';
  const parts = [];
  let current = grupo;
  while (current) {
    parts.unshift(current.codHijo);
    current = current.codPadre;
  }
  return parts.join('');
}

const FORM_VACIO = {
  codGest: '', codActivo: '', codGrupo: '', descripcion: '', codEstado: '',
  nroIngreso: '', monto: '', fecAdqui: '', nroSerie: '',
  codMarca: '', codModelo: '', codProve: '', codCond: '', codUnidad: '',
  organismoFinanciador: '', codRube: '', nroConvenio: '', estadoRegistro: 'ELABORADO'
};

const ITEMS_POR_PAGINA = 8;

export default function Activos() {  
  // ==================== PERMISOS ====================
  const { user } = useAuth();
  const puedeVer = user?.esAdmin || user?.permisos.includes('ver_activos');
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_activo');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_activo');

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(FORM_VACIO);
  const [grupoSelDes, setGrupoSelDes] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [selectedActivoSpecs, setSelectedActivoSpecs] = useState<any>(null);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [showMassSpecsModal, setShowMassSpecsModal] = useState(false);
  const [showVehiculoModal, setShowVehiculoModal] = useState(false);
  const [selectedActivoVehiculo, setSelectedActivoVehiculo] = useState<any>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedActivoLabel, setSelectedActivoLabel] = useState<any>(null);

  // Estados para filtro y selección masiva
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [selectedActivos, setSelectedActivos] = useState<number[]>([]);
  const [aprobandoMasivo, setAprobandoMasivo] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number, right: number } | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBusqueda(busqueda);
    }, 400);
    return () => clearTimeout(handler);
  }, [busqueda]);

  useEffect(() => {
    const closeDropdown = () => setOpenDropdownId(null);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);

  // Autocomplete search states for grupos
  const [grupoSearch, setGrupoSearch] = useState('');
  const [showGruposDropdown, setShowGruposDropdown] = useState(false);

  // Autocomplete search states for ingresos
  const [ingresoSearch, setIngresoSearch] = useState('');
  const [showIngresosDropdown, setShowIngresosDropdown] = useState(false);

  // Estado para creación en lote
  const [cantidadLote, setCantidadLote] = useState(1);
  const [creandoLote, setCreandoLote] = useState(false);
  const [progresoLote, setProgresoLote] = useState({ actual: 0, total: 0 });

  const { data, loading, error: queryError, refetch } = useQuery(GET_ACTIVOS_PAGINADOS, {
    variables: {
      limit: ITEMS_POR_PAGINA,
      offset: (paginaActual - 1) * ITEMS_POR_PAGINA,
      search: debouncedBusqueda.trim() || "",
      soloPendientes: soloPendientes
    }
  });
  const { data: cats } = useQuery(GET_CATALOGOS_ACTIVOS);
  const [crearActivo] = useMutation(CREAR_ACTIVO);
  const [editarActivo] = useMutation(EDITAR_ACTIVO);
  const [aprobarActivo] = useMutation(APROBAR_ACTIVO);

  const modelosFiltrados = cats?.todosModelos?.filter(
    (m: any) => !form.codMarca || String(m.codMarca?.codMarca) === String(form.codMarca)
  ) || [];

  const esSimple = esGrupoSimple(grupoSelDes);

  // ==================== FILTROS Y PAGINACIÓN ====================
  const totalCount = data?.todosActivosPaginados?.totalCount || 0;
  const totalPaginas = Math.ceil(totalCount / ITEMS_POR_PAGINA);
  const paginaActualSegura = Math.min(paginaActual, totalPaginas || 1);
  const activosPaginados = data?.todosActivosPaginados?.results || [];


  // ==================== HANDLERS ====================
  const handleSelectGrupo = (g: any) => {
    setForm({ ...form, codGrupo: g.codGrupo.toString(), codMarca: '', codModelo: '' });
    setGrupoSelDes(g.desGrupo || '');
    const unified = getGroupUnifiedCode(g);
    setGrupoSearch(`[${unified}] ${g.desGrupo}`);
    setShowGruposDropdown(false);
  };

  const handleSelectIngreso = (i: any) => {
    setForm({ ...form, nroIngreso: i.nroIngreso.toString() });
    setIngresoSearch(`#${i.nroIngreso} - ${i.glosa || 'Sin glosa'}`);
    setShowIngresosDropdown(false);
  };

  const filteredGrupos = cats?.todosGrupos?.filter((g: any) => {
    const fullCode = getGroupFullCode(g).toLowerCase();
    const unifiedCode = getGroupUnifiedCode(g).toLowerCase();
    const text = g.desGrupo.toLowerCase();
    const query = grupoSearch.toLowerCase();
    return text.includes(query) || fullCode.includes(query) || unifiedCode.includes(query);
  }) || [];

  const filteredIngresos = cats?.todosIngresos?.filter((i: any) => {
    const text = i.glosa ? i.glosa.toLowerCase() : '';
    const num = i.nroIngreso.toString();
    const query = ingresoSearch.toLowerCase();
    return text.includes(query) || num.includes(query);
  }) || [];

  // Autocomplete code generator
  useEffect(() => {
    if (editId) return; // Do not auto-generate code when editing an existing asset
    if (form.nroIngreso && form.codGrupo && cats?.todosIngresos && cats?.todosGrupos) {
      const selectedIngreso = cats.todosIngresos.find((i: any) => String(i.nroIngreso) === String(form.nroIngreso));
      const selectedGroup = cats.todosGrupos.find((g: any) => String(g.codGrupo) === String(form.codGrupo));
      
      if (selectedIngreso?.codOficDest && selectedGroup) {
        const officeCode = getOfficeUnifiedCode(selectedIngreso.codOficDest);
        const groupCode = getGroupUnifiedCode(selectedGroup);
        
        let combined = (officeCode + groupCode).replace(/[^0-9A-Z]/gi, '');
        if (combined.length > 8) {
          combined = combined.substring(0, 8);
        } else {
          combined = combined.padEnd(8, '0');
        }
        
        const generated = `U${combined}0001`;
        setForm((prev: any) => ({ ...prev, codActivo: generated }));
      }
    }
  }, [form.nroIngreso, form.codGrupo, cats?.todosIngresos, cats?.todosGrupos, editId]);

  // Creación en lote
  const handleSubmitLote = async () => {
    if (!puedeCrear) {
      setError('No tienes permiso para crear activos');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    const cantidad = cantidadLote || 1;
    if (cantidad < 1) {
      setError('La cantidad debe ser al menos 1');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!form.codGest || !form.codActivo || !form.codGrupo || !form.descripcion || !form.codEstado || !form.nroIngreso) {
      setError('Complete los campos obligatorios (*)');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setCreandoLote(true);
    setProgresoLote({ actual: 0, total: cantidad });

    let exitos = 0;
    let fallos = 0;
    let errorMsg = '';

    const basePrefix = form.codActivo.substring(0, 9);
    const prefix = basePrefix.padEnd(9, '0');

    for (let i = 0; i < cantidad; i++) {
      const seqStr = (i + 1).toString().padStart(4, '0');
      const codigoCompleto = `${prefix}${seqStr}`;
      try {
        await crearActivo({
          variables: {
            codGest: parseInt(form.codGest),
            codActivo: codigoCompleto,
            codGrupo: parseInt(form.codGrupo),
            descripcion: form.descripcion,
            codEstado: parseInt(form.codEstado),
            nroIngreso: parseInt(form.nroIngreso),
            monto: form.monto ? parseFloat(form.monto) : null,
            fecAdqui: form.fecAdqui || null,
            nroSerie: form.nroSerie || null,
            codMarca: form.codMarca ? parseInt(form.codMarca) : null,
            codModelo: form.codModelo ? parseInt(form.codModelo) : null,
            codProve: form.codProve ? parseInt(form.codProve) : null,
            codCond: form.codCond ? parseInt(form.codCond) : null,
            codUnidad: form.codUnidad ? parseInt(form.codUnidad) : null,
            organismoFinanciador: form.organismoFinanciador ? parseInt(form.organismoFinanciador) : null,
            codRube: form.codRube || null,
            nroConvenio: form.nroConvenio || null,
          }
        });
        exitos++;
      } catch (err: any) {
        fallos++;
        errorMsg = `Error en ${codigoCompleto}: ${err.message}`;
        break; // Detener en el primer fallo para no ensuciar DB
      }
      setProgresoLote({ actual: i + 1, total: cantidad });
    }

    setTimeout(() => {
      setCreandoLote(false);
      if (fallos > 0) {
        setError(`Lote interrumpido. ${exitos} creados. ${errorMsg}`);
        setTimeout(() => setError(''), 6000);
      } else {
        setMensaje(`Lote completado: ${exitos} creados exitosamente.`);
        setShowModal(false);
        setForm(FORM_VACIO);
        setGrupoSelDes('');
        setGrupoSearch('');
        setIngresoSearch('');
        refetch();
        setTimeout(() => setMensaje(''), 4000);
      }
    }, 500);
  };

  const handleEdit = (a: any) => {
    setEditId(a.nroActivo);
    setForm({
      codGest: String(a.nroIngreso?.gestion?.codGest || ''),
      codActivo: a.codActivo || '',
      codGrupo: String(a.codGrupo?.codGrupo || ''),
      descripcion: a.descripcion || '',
      codEstado: String(a.codEstado?.codEstado || ''),
      nroIngreso: String(a.nroIngreso?.nroIngreso || ''),
      monto: a.monto ? String(a.monto) : '',
      fecAdqui: a.fecAdqui || '',
      nroSerie: a.nroSerie || '',
      codMarca: String(a.codMarca?.codMarca || ''),
      codModelo: String(a.codModelo?.codModelo || ''),
      codProve: String(a.codProve?.codProv || ''),
      codCond: String(a.codCond?.codCond || ''),
      codUnidad: String(a.codUnidad?.codUnidad || ''),
      organismoFinanciador: a.organismoFinanciador ? String(a.organismoFinanciador) : '',
      codRube: a.codRube || '',
      nroConvenio: a.nroConvenio || '',
      estadoRegistro: a.estadoRegistro || 'ELABORADO'
    });
    setGrupoSelDes(a.codGrupo?.desGrupo || '');
    const unified = a.codGrupo ? getGroupUnifiedCode(a.codGrupo) : '';
    setGrupoSearch(a.codGrupo ? `[${unified}] ${a.codGrupo.desGrupo}` : '');
    setShowModal(true);
  };

  const handleAprobar = async (nroActivo: any) => {
    if (!window.confirm('¿Está seguro de que desea APROBAR este activo? Esta acción bloqueará campos contables y no podrá deshacerse.')) {
      return;
    }
    try {
      await aprobarActivo({
        variables: { nroActivo: parseInt(String(nroActivo)) }
      });
      setMensaje('Activo aprobado con éxito.');
      refetch();
    } catch (e: any) {
      setError('Error al aprobar activo: ' + e.message);
    }
  };

  const handleAprobarMasivo = async () => {
    if (selectedActivos.length === 0) return;
    if (!window.confirm(`¿Está seguro de que desea APROBAR los ${selectedActivos.length} activos seleccionados?`)) return;

    setAprobandoMasivo(true);
    setMensaje('');
    setError('');
    let successCount = 0;
    
    try {
      await Promise.all(
        selectedActivos.map(async (id) => {
          await aprobarActivo({ variables: { nroActivo: parseInt(String(id)) } });
          successCount++;
        })
      );
      setMensaje(`Se aprobaron ${successCount} activos con éxito.`);
      setSelectedActivos([]); // Limpiar selección
      refetch();
    } catch (e: any) {
      setError(`Error al aprobar algunos activos. Se aprobaron ${successCount} correctamente.`);
      refetch();
    } finally {
      setAprobandoMasivo(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = activosPaginados.map((a: any) => a.nroActivo);
      setSelectedActivos(allIds);
    } else {
      setSelectedActivos([]);
    }
  };

  const handleSelectRow = (nroActivo: number) => {
    setSelectedActivos(prev => 
      prev.includes(nroActivo) ? prev.filter(id => id !== nroActivo) : [...prev, nroActivo]
    );
  };

  const handleSubmitIndividual = async () => {
    if (editId) {
      try {
        await editarActivo({
          variables: {
            nroActivo: parseInt(String(editId)),
            descripcion: form.descripcion,
            codEstado: form.codEstado ? parseInt(form.codEstado) : null,
            codGrupo: form.codGrupo ? parseInt(form.codGrupo) : null,
            codMarca: form.codMarca ? parseInt(form.codMarca) : null,
            codModelo: form.codModelo ? parseInt(form.codModelo) : null,
            codCond: form.codCond ? parseInt(form.codCond) : null,
            codUnidad: form.codUnidad ? parseInt(form.codUnidad) : null,
            monto: form.monto ? parseFloat(form.monto) : null,
            nroSerie: form.nroSerie || null,
            fecAdqui: form.fecAdqui || null,
            organismoFinanciador: form.organismoFinanciador ? parseInt(form.organismoFinanciador) : null,
            codRube: form.codRube || null,
            nroConvenio: form.nroConvenio || null,
          }
        });
        setMensaje('Activo editado correctamente');
        setShowModal(false);
        setForm(FORM_VACIO);
        setEditId(null);
        setGrupoSelDes('');
        setGrupoSearch('');
        refetch();
        setTimeout(() => setMensaje(''), 3000);
      } catch (e: any) {
        setError('Error al editar: ' + e.message);
        setTimeout(() => setError(''), 3000);
      }
      return;
    }

    if (!puedeCrear) {
      setError('No tienes permiso para crear activos');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!form.codGest || !form.codActivo || !form.codGrupo || !form.descripcion || !form.codEstado || !form.nroIngreso) {
      setError('Complete los campos obligatorios (*)');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      await crearActivo({
        variables: {
          codGest: parseInt(form.codGest),
          codActivo: form.codActivo,
          codGrupo: parseInt(form.codGrupo),
          descripcion: form.descripcion,
          codEstado: parseInt(form.codEstado),
          nroIngreso: parseInt(form.nroIngreso),
          monto: form.monto ? parseFloat(form.monto) : null,
          fecAdqui: form.fecAdqui || null,
          nroSerie: form.nroSerie || null,
          codMarca: form.codMarca ? parseInt(form.codMarca) : null,
          codModelo: form.codModelo ? parseInt(form.codModelo) : null,
          codProve: form.codProve ? parseInt(form.codProve) : null,
          codCond: form.codCond ? parseInt(form.codCond) : null,
          codUnidad: form.codUnidad ? parseInt(form.codUnidad) : null,
          organismoFinanciador: form.organismoFinanciador ? parseInt(form.organismoFinanciador) : null,
          codRube: form.codRube || null,
          nroConvenio: form.nroConvenio || null,
        }
      });
      setMensaje('Activo creado correctamente');
      setShowModal(false);
      setForm(FORM_VACIO);
      setGrupoSelDes('');
      setGrupoSearch('');
      refetch();
      setTimeout(() => setMensaje(''), 3000);
    } catch (e: any) {
      setError('Error: ' + e.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ==================== RENDER ====================
  if (!puedeVer) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--status-elaborado)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#128274;</div>
        <strong>Acceso denegado.</strong> No tiene permisos para ver los activos.
      </div>
    );
  }

  if (queryError) return <div className="error">Error: {queryError.message}</div>;

  const acciones = [
    {
      label: 'Nuevo',
      icon: '+',
      variant: 'primary' as const,
      disabled: !puedeCrear,
      onClick: () => { setForm(FORM_VACIO); setGrupoSelDes(''); setGrupoSearch(''); setShowModal(true); },
      show: true,
    },
    {
      label: `Espec. Masivas (${selectedActivos.length})`,
      icon: '',
      onClick: () => {
        const assetsToSpec = activosPaginados.filter((a: any) => selectedActivos.includes(a.nroActivo));
        const groups = new Set(assetsToSpec.map((a: any) => a.codGrupo?.codGrupo));
        if (groups.size > 1) {
          alert('Para aplicar especificaciones en masa, todos los activos seleccionados deben pertenecer al mismo Grupo.');
          return;
        }
        setShowMassSpecsModal(true);
      },
      show: selectedActivos.length > 0 && puedeEditar,
    },
    {
      label: aprobandoMasivo ? 'Aprobando...' : `Aprobar (${selectedActivos.length})`,
      icon: '',
      onClick: handleAprobarMasivo,
      show: selectedActivos.length > 0 && puedeEditar,
    },
    {
      label: 'Actualizar',
      icon: '↻',
      onClick: () => refetch(),
      show: true,
    },
  ];

  return (
    <PageLayout
      title="Activos Fijos"
      actions={acciones}
      toolbar={
        <>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por codigo, descripcion o serie..."
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPaginaActual(1); }}
            style={{ maxWidth: '300px' }}
          />
          <label className="flex items-center gap-2 text-sm text-slate-300 ml-4 cursor-pointer">
            <input 
              type="checkbox" 
              checked={soloPendientes}
              onChange={(e) => {
                setSoloPendientes(e.target.checked);
                setPaginaActual(1);
              }}
              className="form-checkbox h-4 w-4 text-blue-600 rounded bg-slate-800 border-slate-600"
            />
            Ver Solo Pendientes
          </label>
          {/* Botones masivos movidos a la lista de acciones laterales */}
        </>
      }
      footer={
        totalPaginas > 1 ? (
          <div className="pagination">
            <span>Pagina {paginaActualSegura} de {totalPaginas} ({totalCount} registros)</span>
            <div className="pagination-controls">
              <button className="pagination-btn" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActualSegura === 1}>&laquo; Anterior</button>
              <button className="pagination-btn" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActualSegura === totalPaginas}>Siguiente &raquo;</button>
            </div>
          </div>
        ) : undefined
      }
    >
      {/* Mensajes */}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error   && <div className="alert alert-danger">{error}</div>}

      {/* Tabla */}
      <div className="table-container" style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={activosPaginados.length > 0 && selectedActivos.length === activosPaginados.length}
                  onChange={handleSelectAll}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded bg-slate-800 border-slate-600 cursor-pointer"
                />
              </th>
              <th>Código</th>
              <th>Descripción</th>
              <th>Grupo</th>
              <th>Marca / Modelo</th>
              <th>Monto (Bs.)</th>
              <th>Fecha Adq.</th>
              <th>Condición</th>
              <th>Estado</th>
              <th>Registro</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse border-b border-slate-700/30">
                  <td><div className="h-4 bg-slate-700 rounded w-4 mx-auto"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-16"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-44"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-28"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-32"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-16"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-20"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-16"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-16"></div></td>
                  <td><div className="h-5 bg-slate-700 rounded-full w-24"></div></td>
                  <td><div className="h-6 bg-slate-700 rounded w-12 ml-auto"></div></td>
                </tr>
              ))
            ) : (
              <>
                {activosPaginados.length === 0 && (
                  <tr><td colSpan={11} className="table-empty">No hay activos registrados</td></tr>
                )}
                {activosPaginados.map((a: any) => (
                  <tr key={a.nroActivo} className={`border-b border-slate-700 hover:bg-slate-700/30 transition ${selectedActivos.includes(a.nroActivo) ? 'bg-slate-700/20' : ''}`}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedActivos.includes(a.nroActivo)}
                        onChange={() => handleSelectRow(a.nroActivo)}
                        className="form-checkbox h-4 w-4 text-blue-600 rounded bg-slate-800 border-slate-600 cursor-pointer"
                      />
                    </td>
                    <td><strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{a.codActivo}</strong></td>
                    <td className="max-w-[200px] truncate" title={a.descripcion}>{a.descripcion}</td>
                    <td>{a.codGrupo?.desGrupo || '-'}</td>
                    <td>
                      {a.codMarca?.desMarca ? `${a.codMarca.desMarca}${a.codModelo?.desModelo ? ' / ' + a.codModelo.desModelo : ''}` : '-'}
                    </td>
                    <td style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                      {a.monto ? parseFloat(a.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td>{a.fecAdqui || '-'}</td>
                    <td>{a.codCond?.desCond || '-'}</td>
                    <td>
                      <span className={`badge ${
                        a.codEstado?.desEstado === 'ACTIVO' ? 'badge-success' :
                        a.codEstado?.desEstado === 'BAJA'   ? 'badge-danger'  :
                        'badge-secondary'
                      }`}>{a.codEstado?.desEstado || '-'}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        a.estadoRegistro === 'APROBADO' ? 'badge-success' : 'badge-warning'
                      }`}>{a.estadoRegistro || 'ELABORADO'}</span>
                    </td>
                    <td className="px-4 py-3" style={{ position: 'relative' }}>
                  <div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (openDropdownId === String(a.nroActivo)) {
                          setOpenDropdownId(null);
                          setDropdownPos(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdownPos({
                            top: rect.bottom,
                            right: window.innerWidth - rect.right
                          });
                          setOpenDropdownId(String(a.nroActivo));
                        }
                      }}
                    >
                      Acciones ▾
                    </button>
                    {openDropdownId === String(a.nroActivo) && dropdownPos && (
                      <div
                        className="dropdown-menu"
                        style={{
                          position: 'fixed',
                          right: dropdownPos.right,
                          top: dropdownPos.top + 4,
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          zIndex: 99999,
                          minWidth: '140px',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '4px 0'
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        {puedeEditar && (
                          <button
                            style={{
                              background: 'none', border: 'none', padding: '8px 16px',
                              textAlign: 'left', fontSize: '0.85rem', color: '#334155', cursor: 'pointer'
                            }}
                            onClick={() => { setOpenDropdownId(null); handleEdit(a); }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            Editar
                          </button>
                        )}
                        {puedeEditar && a.estadoRegistro !== 'APROBADO' && (
                          <button
                            style={{
                              background: 'none', border: 'none', padding: '8px 16px',
                              textAlign: 'left', fontSize: '0.85rem', color: '#16a34a', cursor: 'pointer'
                            }}
                            onClick={() => { setOpenDropdownId(null); handleAprobar(a.nroActivo); }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            Aprobar
                          </button>
                        )}
                        <button
                          style={{
                            background: 'none', border: 'none', padding: '8px 16px',
                            textAlign: 'left', fontSize: '0.85rem', color: '#2563eb', cursor: 'pointer'
                          }}
                          onClick={() => { setOpenDropdownId(null); setSelectedActivoSpecs(a); setShowSpecsModal(true); }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Especificaciones
                        </button>
                        <button
                          style={{
                            background: 'none', border: 'none', padding: '8px 16px',
                            textAlign: 'left', fontSize: '0.85rem', color: '#9333ea', cursor: 'pointer'
                          }}
                          onClick={() => { setOpenDropdownId(null); setSelectedActivoLabel(a); setShowLabelModal(true); }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Generar Etiqueta
                        </button>
                        <button
                          style={{
                            background: 'none', border: 'none', padding: '8px 16px',
                            textAlign: 'left', fontSize: '0.85rem', color: '#0d9488', cursor: 'pointer'
                          }}
                          onClick={() => { setOpenDropdownId(null); setSelectedActivoVehiculo(a); setShowVehiculoModal(true); }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Datos Vehículo
                        </button>
                      </div>
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

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="pagination">
          <span>Página {paginaActualSegura} de {totalPaginas} — {totalCount} registros</span>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              disabled={paginaActualSegura === 1}
            >Anterior</button>
            <button
              className="pagination-btn"
              onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaActualSegura === totalPaginas}
            >Siguiente</button>
          </div>
        </div>
      )}

      {/* Modal */}
{showModal && (
  <div className="modal-overlay" onClick={() => { setShowModal(false); setEditId(null); }}>
    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
      
      {/* Header */}
      <div className="modal-title">
        <span>{editId ? '✏️ EDITAR ACTIVO' : '➕ REGISTRAR ACTIVO'}</span>
        <button className="modal-close" onClick={() => { setShowModal(false); setEditId(null); }}>
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="modal-body">
        <div className="space-y-4">
          <div className="form-grid">
            <div className="form-group">
              <label>Gestión *</label>
              <select name="codGest" value={form.codGest} onChange={handleChange} disabled={editId !== null}>
                <option value="">Seleccionar...</option>
                {cats?.todasGestiones?.map((g: any, idx: number) => (
                  <option key={`gest-${g.codGest}-${idx}`} value={g.codGest}>{g.gestIni}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Ingreso *</label>
              <div className="autocomplete-container">
                <input
                  type="text"
                  value={ingresoSearch}
                  onChange={e => {
                    setIngresoSearch(e.target.value);
                    setForm({ ...form, nroIngreso: '' });
                    setShowIngresosDropdown(true);
                  }}
                  onFocus={() => { if (editId === null) setShowIngresosDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowIngresosDropdown(false), 200)}
                  placeholder="Buscar nro o glosa..."
                  disabled={editId !== null}
                />
                {showIngresosDropdown && editId === null && (
                  <ul className="autocomplete-dropdown">
                    {filteredIngresos.slice(0, 20).map((i: any, idx: number) => (
                      <li
                        key={`ing-${i.nroIngreso}-${idx}`}
                        className="autocomplete-item"
                        onClick={() => handleSelectIngreso(i)}
                      >
                        #{i.nroIngreso} - {i.glosa || 'Sin glosa'}
                      </li>
                    ))}
                    {filteredIngresos.length === 0 && (
                      <li className="autocomplete-no-results">No se encontraron ingresos</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="form-group form-group-full">
            <label>Código Activo *</label>
            <input 
              name="codActivo" 
              value={form.codActivo} 
              onChange={handleChange} 
              placeholder="Auto-generado al elegir Ingreso y Grupo" 
              readOnly={editId === null}
              disabled={editId !== null} 
              style={editId === null ? { backgroundColor: 'var(--bg-light)', cursor: 'not-allowed' } : {}}
              title={editId === null ? "Se autogenera al seleccionar un Ingreso y Grupo." : ""}
            />
          </div>

          <div className="form-group form-group-full">
            <label>Descripción *</label>
            <input name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción del activo" />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Grupo *</label>
              <div className="autocomplete-container">
                <input
                  type="text"
                  value={grupoSearch}
                  onChange={e => {
                    setGrupoSearch(e.target.value);
                    setForm({ ...form, codGrupo: '' });
                    setShowGruposDropdown(true);
                  }}
                  onFocus={() => { if (editId === null || form.estadoRegistro !== 'APROBADO') setShowGruposDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowGruposDropdown(false), 200)}
                  placeholder="Buscar código o descripción..."
                  disabled={editId !== null && form.estadoRegistro === 'APROBADO'}
                />
                {showGruposDropdown && (editId === null || form.estadoRegistro !== 'APROBADO') && (
                  <ul className="autocomplete-dropdown">
                    {filteredGrupos.slice(0, 20).map((g: any) => {
                      const unified = getGroupUnifiedCode(g);
                      return (
                        <li
                          key={g.codGrupo}
                          className="autocomplete-item"
                          onClick={() => handleSelectGrupo(g)}
                        >
                          [{unified}] {g.desGrupo}
                        </li>
                      );
                    })}
                    {filteredGrupos.length === 0 && (
                      <li className="autocomplete-no-results">No se encontraron grupos</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Estado *</label>
              <select name="codEstado" value={form.codEstado} onChange={handleChange}>
                <option value="">Seleccionar...</option>
                {cats?.todosEstados?.map((e: any) => (
                  <option key={e.codEstado} value={e.codEstado}>{e.desEstado}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Monto (Bs.)</label>
              <input type="number" name="monto" value={form.monto} onChange={handleChange} placeholder="0.00" disabled={editId !== null && form.estadoRegistro === 'APROBADO'} />
            </div>
            <div className="form-group">
              <label>Fecha Adquisición</label>
              <input type="date" name="fecAdqui" value={form.fecAdqui} onChange={handleChange} disabled={editId !== null && form.estadoRegistro === 'APROBADO'} />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Condición</label>
              <select name="codCond" value={form.codCond} onChange={handleChange} disabled={editId !== null && form.estadoRegistro === 'APROBADO'}>
                <option value="">Seleccionar...</option>
                {cats?.todasCondiciones?.map((c: any) => (
                  <option key={c.codCond} value={c.codCond}>{c.desCond}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Unidad</label>
              <select name="codUnidad" value={form.codUnidad} onChange={handleChange} disabled={editId !== null && form.estadoRegistro === 'APROBADO'}>
                <option value="">Seleccionar...</option>
                {cats?.todasUnidades?.map((u: any) => (
                  <option key={u.codUnidad} value={u.codUnidad}>{u.desUnidad}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group form-group-full">
            <label>Proveedor</label>
            <select name="codProve" value={form.codProve} onChange={handleChange} disabled={editId !== null}>
              <option value="">Seleccionar...</option>
              {cats?.todosProvedores?.map((p: any) => (
                <option key={p.codProv} value={p.codProv}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="section-bar" style={{ margin: '1rem 0 0.5rem' }}>Datos Fiscales / Control (VSIAF)</div>
          <div className="form-grid">
            <div className="form-group">
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="mb-0">Organismo Financiador</label>
                <span 
                  className="cursor-help text-blue-400 hover:text-blue-300 font-bold font-mono text-[10px] select-none bg-blue-500/10 border border-blue-500/20 w-4 h-4 rounded-full flex items-center justify-center transition-all"
                  title="Código de la fuente de financiamiento del bien (ej. 11: TGN, 41: Transferencias)."
                >
                  ?
                </span>
              </div>
              <input type="number" name="organismoFinanciador" value={form.organismoFinanciador} onChange={handleChange} placeholder="Ej: 11" />
            </div>
            <div className="form-group">
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="mb-0">Código RUBE</label>
                <span 
                  className="cursor-help text-blue-400 hover:text-blue-300 font-bold font-mono text-[10px] select-none bg-blue-500/10 border border-blue-500/20 w-4 h-4 rounded-full flex items-center justify-center transition-all"
                  title="Código de Registro Único de Bienes del Estado asignado por el MEFP."
                >
                  ?
                </span>
              </div>
              <input type="text" name="codRube" value={form.codRube} onChange={handleChange} placeholder="Ej: R-1234" />
            </div>
          </div>
          <div className="form-group form-group-full">
            <label>Nro. Convenio</label>
            <input type="text" name="nroConvenio" value={form.nroConvenio} onChange={handleChange} placeholder="Ej: Conv. MEFP-2026" />
          </div>

          {!esSimple && (
            <>
              <div className="section-bar" style={{ margin: '1rem 0 0.5rem' }}>Datos Técnicos (Equipo Detallado)</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nro. Serie</label>
                  <input name="nroSerie" value={form.nroSerie} onChange={handleChange} placeholder="Número de serie" />
                </div>
                <div className="form-group">
                  <label>Marca</label>
                  <select name="codMarca" value={form.codMarca} onChange={handleChange} disabled={editId !== null && form.estadoRegistro === 'APROBADO'}>
                    <option value="">Seleccionar...</option>
                    {cats?.todasMarcas?.map((m: any) => (
                      <option key={m.codMarca} value={m.codMarca}>{m.desMarca}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group form-group-full">
                <label>Modelo</label>
                <select name="codModelo" value={form.codModelo} onChange={handleChange} disabled={editId !== null && form.estadoRegistro === 'APROBADO'}>
                  <option value="">Seleccionar...</option>
                  {modelosFiltrados.map((m: any) => (
                    <option key={m.codModelo} value={m.codModelo}>{m.desModelo}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {editId === null && (
            <div className="form-group form-group-full">
              <label>Cantidad a crear</label>
              <input 
                type="number" 
                min="1" 
                value={String(cantidadLote)} 
                onChange={e => setCantidadLote(parseInt(e.target.value) || 1)} 
                placeholder="1" 
              />
              {creandoLote && (
                <div style={{ marginTop: '0.5rem', background: 'var(--blue-pale)', border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--navy)', fontWeight: 600, fontSize: '0.8rem' }}>Creando {progresoLote.actual} de {progresoLote.total}...</p>
                  <div style={{ marginTop: '0.25rem', height: '6px', background: 'var(--border-light)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--blue)', transition: 'width 0.3s', width: `${(progresoLote.actual / progresoLote.total) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-primary" onClick={editId ? handleSubmitIndividual : (cantidadLote > 1 ? handleSubmitLote : handleSubmitIndividual)}>
              {editId ? 'Guardar Cambios' : 'Registrar Activo'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditId(null); }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      {showSpecsModal && selectedActivoSpecs && (
        <SpecsModal
          activos={[selectedActivoSpecs]}
          onClose={() => {
            setShowSpecsModal(false);
            setSelectedActivoSpecs(null);
          }}
        />
      )}
      {showMassSpecsModal && selectedActivos.length > 0 && (
        <SpecsModal
          activos={activosPaginados.filter((a: any) => selectedActivos.includes(a.nroActivo))}
          onClose={() => setShowMassSpecsModal(false)}
        />
      )}
      {showVehiculoModal && selectedActivoVehiculo && (
        <VehiculoModal
          activo={selectedActivoVehiculo}
          onClose={() => {
            setShowVehiculoModal(false);
            setSelectedActivoVehiculo(null);
          }}
        />
      )}
      {showLabelModal && selectedActivoLabel && (
        <LabelModal
          activo={selectedActivoLabel}
          onClose={() => {
            setShowLabelModal(false);
            setSelectedActivoLabel(null);
          }}
        />
      )}
    </PageLayout>
  );
}

// ==================== SPECS MODAL SUBCOMPONENT ====================
function SpecsModal({ activos, onClose }: { activos: any[]; onClose: () => void }) {
  const activoBase = activos[0];
  const codGrupo = activoBase?.codGrupo?.codGrupo;
  const nroActivoRef = activoBase?.nroActivo;

  const { data, loading, error, refetch } = useQuery(GET_SPECS_DATA, {
    variables: { codGrupo: parseInt(codGrupo), nroActivo: parseInt(nroActivoRef) },
    skip: !codGrupo || !nroActivoRef
  });

  const [asignarAtrib] = useMutation(ASIGNAR_ATRIB_ACTIVO);
  const [editarAtrib] = useMutation(EDITAR_ATRIB_ACTIVO);
  const [crearDetAtrib] = useMutation(CREAR_DET_ATRIB);

  // Keep track of values being modified
  const [tempValues, setTempValues] = useState<Record<number, { codDetAtrib: string; valor: string }>>({});
  const [savingAtribId, setSavingAtribId] = useState<number | null>(null);
  const [creatingOptionAtribId, setCreatingOptionAtribId] = useState<number | null>(null);
  
  // State for new option modal
  const [showNewOptionModal, setShowNewOptionModal] = useState<{ atribId: number, options: any[] } | null>(null);
  const [newOptionDes, setNewOptionDes] = useState('');

  if (loading) return <div className="modal-overlay"><div className="modal">Cargando especificaciones...</div></div>;
  if (error)   return <div className="modal-overlay"><div className="modal">Error: {error.message}</div></div>;

  const activeSpecs = data?.atribActivosPorActivo || [];
  const groupAttributes = data?.atributosPorGrupo || [];

  const handleSave = async (atribId: number, codDetAtrib: string, valor: string) => {
    if (!codDetAtrib) {
      alert('Por favor seleccione una opción');
      return;
    }
    setSavingAtribId(atribId);
    try {
      await Promise.all(activos.map(async (act) => {
        const currentNroActivo = act.nroActivo;
        
        // Check if there is already an active assignment for this specific detail on the base ref
        // We assume existing logic roughly applies: we re-assign everything selected to the whole array
        const existingAssignment = activeSpecs.find(
          (spec: any) => spec.codDetAtrib?.codDetAtrib === parseInt(codDetAtrib)
        );

        const otherDetailAssignment = activeSpecs.find(
          (spec: any) =>
            spec.codDetAtrib?.codAtrib?.codAtrib === atribId &&
            spec.codDetAtrib?.codDetAtrib !== parseInt(codDetAtrib) &&
            spec.ok === 'S'
        );

        if (otherDetailAssignment) {
          await editarAtrib({
            variables: {
              codDetAtrib: parseInt(otherDetailAssignment.codDetAtrib.codDetAtrib),
              nroActivo: parseInt(currentNroActivo),
              ok: 'N',
              valor: otherDetailAssignment.valor
            }
          });
        }

        // We use create/assign which will get_or_create internally
        await asignarAtrib({
          variables: {
            codDetAtrib: parseInt(codDetAtrib),
            nroActivo: parseInt(currentNroActivo),
            ok: 'S',
            valor: valor
          }
        });
      }));

      refetch();
      alert(`Especificación guardada correctamente en ${activos.length} activo(s)`);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSavingAtribId(null);
    }
  };

  const saveNewOption = async () => {
    if (!showNewOptionModal || !newOptionDes.trim()) return;
    const { atribId, options } = showNewOptionModal;

    setCreatingOptionAtribId(atribId);
    try {
      // Calculate next correlative nroAtrib
      let maxNro = 0;
      for (const opt of options) {
        const nro = parseInt(opt.nroAtrib, 10);
        if (!isNaN(nro) && nro > maxNro) {
          maxNro = nro;
        }
      }
      const nextNroStr = String(maxNro + 1).padStart(2, '0');

      const { data } = await crearDetAtrib({
        variables: { 
          codAtrib: parseInt(atribId.toString(), 10), 
          nroAtrib: nextNroStr, 
          des: newOptionDes.trim() 
        }
      });
      
      const newCodDetAtrib = data?.crearDetAtrib?.detAtrib?.codDetAtrib;
      if (newCodDetAtrib) {
        setTempValues({ ...tempValues, [atribId]: { ...tempValues[atribId], codDetAtrib: String(newCodDetAtrib) } });
        await refetch();
      }
      
      setShowNewOptionModal(null);
      setNewOptionDes('');
    } catch (e: any) {
      alert("Error al crear la opción: " + e.message);
    } finally {
      setCreatingOptionAtribId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '620px' }}>
        <div className="modal-title">
          <span>⚙️ ESPECIFICACIONES TÉCNICAS {activos.length > 1 ? '(MASIVO)' : ''}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '1rem', background: 'var(--blue-pale)', padding: '0.75rem 1rem', border: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Activo(s):</p>
            {activos.length === 1 ? (
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)' }}>[{activoBase.codActivo}] {activoBase.descripcion}</p>
            ) : (
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)' }}>Aplicando a {activos.length} activos seleccionados.</p>
            )}
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Grupo: {activoBase.codGrupo?.desGrupo}</p>
          </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {groupAttributes.length === 0 ? (
            <p className="empty">Este grupo no tiene atributos configurados. Agrégalos en Catálogos &gt; Atributos.</p>
          ) : (
            groupAttributes.map((atrib: any) => {
              const assigned = activeSpecs.find(
                (spec: any) => spec.codDetAtrib?.codAtrib?.codAtrib === atrib.codAtrib && spec.ok === 'S'
              );
              const currentVal = tempValues[atrib.codAtrib] || {
                codDetAtrib: assigned?.codDetAtrib?.codDetAtrib?.toString() || '',
                valor: assigned?.valor || ''
              };
              const options = atrib.inDetAtribSet?.filter((o: any) => o.aB === 'A') || [];

              return (
                <div key={atrib.codAtrib} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>{atrib.des}</div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '150px', margin: 0 }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Opción *</span>
                        <button 
                          onClick={() => {
                            setShowNewOptionModal({ atribId: atrib.codAtrib, options });
                            setNewOptionDes('');
                          }}
                          disabled={creatingOptionAtribId === atrib.codAtrib}
                          style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                        >
                          {creatingOptionAtribId === atrib.codAtrib ? 'Creando...' : '[+] Nuevo'}
                        </button>
                      </label>
                      <select value={currentVal.codDetAtrib} onChange={e => setTempValues({ ...tempValues, [atrib.codAtrib]: { ...currentVal, codDetAtrib: e.target.value } })}>
                        <option value="">Seleccione...</option>
                        {options.map((o: any) => <option key={o.codDetAtrib} value={o.codDetAtrib}>{o.des}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '150px', margin: 0 }}>
                      <label>Valor / Unidad</label>
                      <input type="text" placeholder="Ej: 16 GB, Intel i7..." value={currentVal.valor} onChange={e => setTempValues({ ...tempValues, [atrib.codAtrib]: { ...currentVal, valor: e.target.value } })} />
                    </div>
                    <button className="btn btn-primary btn-sm" disabled={savingAtribId === atrib.codAtrib} onClick={() => handleSave(atrib.codAtrib, currentVal.codDetAtrib, currentVal.valor)}>
                      {savingAtribId === atrib.codAtrib ? '...' : 'Guardar'}
                    </button>
                  </div>
                  {assigned && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--secondary)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      ✅ Asignado: <strong>{assigned.codDetAtrib?.des}{assigned.valor ? ` — ${assigned.valor}` : ''}</strong>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
      {showNewOptionModal && (
        <div className="modal-overlay" onClick={() => setShowNewOptionModal(null)} style={{ zIndex: 10000, background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <div className="modal-title">
              <span>Crear Nueva Opción</span>
              <button className="modal-close" onClick={() => setShowNewOptionModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre de la Opción *</label>
                <input 
                  type="text" 
                  value={newOptionDes} 
                  onChange={e => setNewOptionDes(e.target.value)} 
                  autoFocus
                  placeholder="Ej. Core i9"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowNewOptionModal(null)}>Cancelar</button>
                <button 
                  className="btn btn-primary" 
                  onClick={saveNewOption} 
                  disabled={!newOptionDes.trim() || creatingOptionAtribId !== null}
                >
                  {creatingOptionAtribId !== null ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== VEHICULO MODAL SUBCOMPONENT ====================
function VehiculoModal({ activo, onClose }: { activo: any; onClose: () => void }) {
  const nroActivo = activo.nroActivo;
  const { data, loading } = useQuery(GET_VEHICULO, {
    variables: { nroActivo: parseInt(nroActivo) },
    skip: !nroActivo
  });

  const [guardarVehiculo] = useMutation(GUARDAR_VEHICULO);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    anio: '',
    color: '',
    placa: '',
    motor: '',
    chasis: '',
    cilindrada: '',
    industria: '',
    ruat: '',
    carnetProp: '',
    poliza: '',
    factura: '',
    resMin: '',
    resAdm: '',
    infTec: '',
    leyEstado: '',
    ds: '',
    docTransf: '',
    docCompVen: '',
    minuta: '',
    actaCoVe: '',
    imagen: ''
  });

  useEffect(() => {
    if (data?.vehiculoPorActivo) {
      const v = data.vehiculoPorActivo;
      setForm({
        tipo: v.tipo || '',
        marca: v.marca || '',
        modelo: v.modelo || '',
        anio: v.anio ? String(v.anio) : '',
        color: v.color || '',
        placa: v.placa || '',
        motor: v.motor || '',
        chasis: v.chasis || '',
        cilindrada: v.cilindrada ? String(v.cilindrada) : '',
        industria: v.industria || '',
        ruat: v.ruat || '',
        carnetProp: v.carnetProp || '',
        poliza: v.poliza || '',
        factura: v.factura ? String(v.factura) : '',
        resMin: v.resMin || '',
        resAdm: v.resAdm || '',
        infTec: v.infTec || '',
        leyEstado: v.leyEstado || '',
        ds: v.ds || '',
        docTransf: v.docTransf || '',
        docCompVen: v.docCompVen || '',
        minuta: v.minuta || '',
        actaCoVe: v.actaCoVe || '',
        imagen: v.imagen || ''
      });
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload_image/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al subir la imagen');
      }

      const result = await response.json();
      setForm(prev => ({ ...prev, imagen: result.filePath }));
      alert('📸 Imagen subida correctamente');
    } catch (err: any) {
      alert('⚠️ Error al subir la imagen: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await guardarVehiculo({
        variables: {
          nroActivo: parseInt(nroActivo),
          tipo: form.tipo,
          marca: form.marca,
          modelo: form.modelo,
          anio: form.anio ? parseInt(form.anio) : null,
          color: form.color,
          placa: form.placa,
          motor: form.motor,
          chasis: form.chasis,
          cilindrada: form.cilindrada ? parseInt(form.cilindrada) : null,
          industria: form.industria,
          ruat: form.ruat,
          carnetProp: form.carnetProp,
          poliza: form.poliza,
          factura: form.factura ? parseInt(form.factura) : null,
          resMin: form.resMin,
          resAdm: form.resAdm,
          infTec: form.infTec,
          leyEstado: form.leyEstado,
          ds: form.ds,
          docTransf: form.docTransf,
          docCompVen: form.docCompVen,
          minuta: form.minuta,
          actaCoVe: form.actaCoVe,
          imagen: form.imagen
        }
      });
      alert('🚗 Ficha de vehículo guardada correctamente');
      onClose();
    } catch (err: any) {
      alert('❌ Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <span>🚗 FICHA TÉCNICA DE VEHÍCULO</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '1rem', background: 'var(--blue-pale)', padding: '0.75rem 1rem', border: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Activo Asociado:</p>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)' }}>[{activo.codActivo}] {activo.descripcion}</p>
          </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Cargando datos del vehículo...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              {/* Imagen y Carga */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Fotografía</span>
                <div style={{ width: '100%', height: '140px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1', position: 'relative' }}>
                  {form.imagen ? (
                    <img 
                      src={`http://localhost:8000${form.imagen}`} 
                      alt="Vehículo" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src.includes('http://localhost:8000/media/')) {
                          img.src = form.imagen; 
                        }
                      }}
                    />
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '2.5rem' }}>🚗</span>
                  )}
                  {uploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(241, 245, 249, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#1a3c6e' }}>
                      Subiendo...
                    </div>
                  )}
                </div>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', textAlign: 'center', width: '100%', display: 'block' }}>
                  {form.imagen ? 'Cambiar Foto' : 'Subir Foto'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {/* Grid de campos principales */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Tipo de Vehículo</label>
                  <input type="text" name="tipo" value={form.tipo} onChange={handleChange} placeholder="Ej: Camioneta, Sedan" />
                </div>
                <div className="form-group">
                  <label>Placa</label>
                  <input type="text" name="placa" value={form.placa} onChange={handleChange} placeholder="Ej: 1234ABC" />
                </div>
                <div className="form-group">
                  <label>Marca</label>
                  <input type="text" name="marca" value={form.marca} onChange={handleChange} placeholder="Ej: Toyota" />
                </div>
                <div className="form-group">
                  <label>Modelo</label>
                  <input type="text" name="modelo" value={form.modelo} onChange={handleChange} placeholder="Ej: Hilux" />
                </div>
                <div className="form-group">
                  <label>Año</label>
                  <input type="number" name="anio" value={form.anio} onChange={handleChange} placeholder="Ej: 2020" />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input type="text" name="color" value={form.color} onChange={handleChange} placeholder="Ej: Blanco" />
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.25rem 0' }} />

            <h3 style={{ fontSize: '0.9rem', color: '#1a3c6e', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Identificación y Mecánica</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Motor</label>
                <input type="text" name="motor" value={form.motor} onChange={handleChange} placeholder="Nro de Motor" />
              </div>
              <div className="form-group">
                <label>Chasis</label>
                <input type="text" name="chasis" value={form.chasis} onChange={handleChange} placeholder="Nro de Chasis" />
              </div>
              <div className="form-group">
                <label>Cilindrada (cc)</label>
                <input type="number" name="cilindrada" value={form.cilindrada} onChange={handleChange} placeholder="Ej: 2400" />
              </div>
              <div className="form-group">
                <label>Industria</label>
                <input type="text" name="industria" value={form.industria} onChange={handleChange} placeholder="Ej: Japón, Brasil" />
              </div>
              <div className="form-group">
                <label>RUAT</label>
                <input type="text" name="ruat" value={form.ruat} onChange={handleChange} placeholder="Nro RUAT" />
              </div>
              <div className="form-group">
                <label>Carnet Propietario</label>
                <input type="text" name="carnetProp" value={form.carnetProp} onChange={handleChange} placeholder="Nro CRP" />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.25rem 0' }} />

            <h3 style={{ fontSize: '0.9rem', color: '#1a3c6e', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Documentación y Resoluciones</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Póliza</label>
                <input type="text" name="poliza" value={form.poliza} onChange={handleChange} placeholder="Nro de Póliza" />
              </div>
              <div className="form-group">
                <label>Factura</label>
                <input type="number" name="factura" value={form.factura} onChange={handleChange} placeholder="Nro de Factura" />
              </div>
              <div className="form-group">
                <label>Res. Ministerial</label>
                <input type="text" name="resMin" value={form.resMin} onChange={handleChange} placeholder="Resolución Min." />
              </div>
              <div className="form-group">
                <label>Res. Administrativa</label>
                <input type="text" name="resAdm" value={form.resAdm} onChange={handleChange} placeholder="Resolución Adm." />
              </div>
              <div className="form-group">
                <label>Informe Técnico</label>
                <input type="text" name="infTec" value={form.infTec} onChange={handleChange} placeholder="Informe Técnico" />
              </div>
              <div className="form-group">
                <label>Ley del Estado</label>
                <input type="text" name="leyEstado" value={form.leyEstado} onChange={handleChange} placeholder="Ley del Estado" />
              </div>
              <div className="form-group">
                <label>D.S. (Decreto Supremo)</label>
                <input type="text" name="ds" value={form.ds} onChange={handleChange} placeholder="Decreto Supremo" />
              </div>
              <div className="form-group">
                <label>Doc. Transferencia</label>
                <input type="text" name="docTransf" value={form.docTransf} onChange={handleChange} placeholder="Doc. Transferencia" />
              </div>
              <div className="form-group">
                <label>Minuta</label>
                <input type="text" name="minuta" value={form.minuta} onChange={handleChange} placeholder="Minuta de Compra/Venta" />
              </div>
              <div className="form-group">
                <label>Doc. Compra Venta</label>
                <input type="text" name="docCompVen" value={form.docCompVen} onChange={handleChange} placeholder="Doc. Compra/Venta" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Acta Compra Venta</label>
                <input type="text" name="actaCoVe" value={form.actaCoVe} onChange={handleChange} placeholder="Acta de Compra/Venta" />
              </div>
            </div>

          </div>
        )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Guardando...' : 'Guardar Ficha'}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ==================== LABEL PRINTING MODAL SUBCOMPONENT ====================
function LabelModal({ activo, onClose }: { activo: any; onClose: () => void }) {
  const [printMode, setPrintMode] = useState<'qr' | 'barcode'>('qr');
  // Helper to format full office hierarchy name
  const getActivoLocationName = (act: any): string => {
    const activeAsig = act.inDetAsigSet?.find(
      (det: any) => det.codAsig?.estado === 'A'
    );
    let oficina = null;
    if (activeAsig?.codAsig?.codOfic) {
      oficina = activeAsig.codAsig.codOfic;
    } else if (act.nroIngreso?.codOficDest) {
      oficina = act.nroIngreso.codOficDest;
    }

    if (!oficina) return 'Sin Ubicación asignada';

    const path: string[] = [];
    let current = oficina;
    while (current) {
      if (current.desDpto) {
        path.unshift(current.desDpto);
      }
      current = current.codPadre;
    }
    return path.join(' > ');
  };

  // Helper to determine remaining/current useful life
  const getActivoUsefulLife = (act: any): string => {
    const activeReval = act.inDetRevalSet?.find(
      (det: any) => det.estado === 'A'
    );

    if (activeReval) {
      const years = activeReval.vidaUtilAno;
      const months = activeReval.vidaUtilMes;
      return `${years}a ${months}m (Revaluado)`;
    }

    const defaultYears = act.codGrupo?.vidaUtilDefault;
    if (defaultYears !== undefined && defaultYears !== null) {
      return `${defaultYears} años (Grupo)`;
    }

    return 'No definida';
  };

  // Helper to resolve financial/depreciation values
  const getActivoValues = (act: any) => {
    const montoCompra = typeof act.monto === 'number' ? act.monto : (parseFloat(act.monto) || 0);
    const depSet = act.inDepAcumuladaSet || [];
    let depAcum = 0;
    let valActual = montoCompra;

    if (depSet.length > 0) {
      const sorted = [...depSet].sort((a: any, b: any) => b.nroSerie - a.nroSerie);
      const latest = sorted[0];
      if (latest.acumulada !== null && latest.acumulada !== undefined) {
        depAcum = typeof latest.acumulada === 'number' ? latest.acumulada : (parseFloat(latest.acumulada) || 0);
      }
      if (latest.valorActual !== null && latest.valorActual !== undefined) {
        valActual = typeof latest.valorActual === 'number' ? latest.valorActual : (parseFloat(latest.valorActual) || 0);
      }
    }

    return {
      montoCompra,
      depAcum,
      valActual
    };
  };

  const values = getActivoValues(activo);
  const location = getActivoLocationName(activo);
  const usefulLife = getActivoUsefulLife(activo);

  // Construct highly informative QR payload
  const qrString = [
    `U.A.G.R.M. - VSIAF 2.0`,
    `----------------------`,
    `CÓDIGO: ${activo.codActivo}`,
    `DETALLE: ${activo.descripcion}`,
    `GRUPO: ${activo.codGrupo?.desGrupo || 'Sin Grupo'}`,
    `UBICACIÓN: ${location}`,
    `VIDA ÚTIL: ${usefulLife}`,
    `COMPRA: ${values.montoCompra.toFixed(2)} Bs.`,
    `DEP. ACUM.: ${values.depAcum.toFixed(2)} Bs.`,
    `VALOR ACTUAL: ${values.valActual.toFixed(2)} Bs.`
  ].join('\n');

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <style>{`
        @page {
          size: 60mm 30mm;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 60mm !important;
            height: 30mm !important;
            overflow: hidden !important;
            background: transparent !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-label-card, #printable-label-card * {
            visibility: visible !important;
          }
          #printable-label-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 2mm !important; /* Reducido para maximizar espacio */
            border: none !important;
            width: 60mm !important;
            height: 30mm !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            transform: none !important;
          }
          .no-print-btn {
            display: none !important;
          }
        }
      `}</style>
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          padding: '20px',
          maxWidth: '360px',
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: '1.05rem' }}>
          🏷️ Impresión de Etiqueta
        </h3>

        {/* Toggle buttons */}
        <div className="no-print-btn" style={{ display: 'flex', gap: '10px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
          <button
            onClick={() => setPrintMode('qr')}
            style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, background: printMode === 'qr' ? '#ffffff' : 'transparent', color: printMode === 'qr' ? '#0f172a' : '#64748b', boxShadow: printMode === 'qr' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Código QR
          </button>
          <button
            onClick={() => setPrintMode('barcode')}
            style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, background: printMode === 'barcode' ? '#ffffff' : 'transparent', color: printMode === 'barcode' ? '#0f172a' : '#64748b', boxShadow: printMode === 'barcode' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Código de Barras
          </button>
        </div>
        
        {/* Printable Label Card container */}
        <div
          id="printable-label-card"
          style={{
            width: '240px',
            height: '120px',
            border: '2px solid #0f172a',
            borderRadius: '6px',
            padding: '8px',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            color: '#000000', /* Uso de negro absoluto para impresoras térmicas */
            fontFamily: 'system-ui, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #000000', paddingBottom: '2px', marginBottom: '2px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>U.A.G.R.M.</span>
              <span style={{ fontSize: '7px', fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>Activos Fijos</span>
            </div>
            <span style={{ fontSize: '8px', fontWeight: 800, border: '1.5px solid #000000', padding: '2px 4px', borderRadius: '4px', color: '#000000' }}>VSIAF 2.0</span>
          </div>

          {/* Main area: Left metadata, Right QR */}
          <div style={{ display: 'flex', flex: 1, gap: '8px', alignItems: 'center', overflow: 'hidden' }}>
            {/* Left metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0, justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <span style={{ fontSize: '6px', textTransform: 'uppercase', color: '#000000', fontWeight: 800, letterSpacing: '0.5px' }}>CÓDIGO DE ACTIVO</span>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#000000', fontFamily: 'monospace' }}>{activo.codActivo}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                <span style={{ fontSize: '6px', textTransform: 'uppercase', color: '#000000', fontWeight: 800, letterSpacing: '0.5px' }}>DESCRIPCIÓN</span>
                <span style={{ fontSize: '8px', fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', color: '#000000' }} title={activo.descripcion}>
                  {activo.descripcion}
                </span>
              </div>
            </div>

            {/* Right QR */}
            {printMode === 'qr' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <QRCodeImage value={qrString} size={70} />
              </div>
            )}
          </div>

          {/* Bottom Barcode */}
          {printMode === 'barcode' && (
            <div style={{ paddingTop: '4px', marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <Code39Barcode value={activo.codActivo} height={38} showText={false} />
            </div>
          )}
        </div>

        {/* Modal controls (hidden during print) */}
        <div className="no-print-btn" style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.8rem', padding: '8px' }}
            onClick={() => window.print()}
          >
            🖨️ Imprimir
          </button>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}