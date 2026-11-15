import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_ACTIVO_CONSULTA = gql`
  query GetActivoConsulta($codActivo: String!) {
    activoPorCodigo(codActivo: $codActivo) {
      nroActivo
      codActivo
      descripcion
      nroSerie
      fecAdqui
      monto
      estadoRegistro
      codGrupo {
        codGrupo
        desGrupo
        vidaUtilDefault
      }
      codMarca {
        desMarca
      }
      codModelo {
        desModelo
      }
      codCond {
        codCond
        desCond
      }
      codEstado {
        codEstado
        desEstado
      }
      vehiculo {
        placa
        motor
        chasis
        color
        anio
        fechaVencimientoSoat
        nombreChofer
        licenciaConducir
        telefonoChofer
        kilometrajeActual
        estadoMecanico
        codigoSipap
        soatNro
        soatAseguradora
        itvEstado
      }
      inDetAsigSet {
        codAsig {
          codAsig
          estado
          fechaAsig
          fechaFin
          tipoAsig {
            tipoAsig
            des
            abrev
          }
          empleadoResponsable {
            idEmpleado
            nombre
            apellido
            cargo
          }
          codOfic {
            codOfic
            desDpto
            codPadre {
              desDpto
              codPadre {
                desDpto
              }
            }
          }
        }
      }
    }
    todasCondiciones {
      codCond
      desCond
    }
  }
`;

const ACTUALIZAR_CONDICION = gql`
  mutation ActualizarCondicion($nroActivo: Int!, $codCond: Int!) {
    editarActivo(nroActivo: $nroActivo, codCond: $codCond) {
      activo {
        nroActivo
        codCond {
          codCond
          desCond
        }
      }
    }
  }
`;


interface SedeUbicacion {
  municipio: string;
  provincia: string;
  campus: string;
  direccion: string;
  lat: number;
  lng: number;
  esProvincia: boolean;
  searchQuery: string;
}

const SEDES_UAGRM: Record<string, SedeUbicacion> = {
  // --- Módulos específicos de Ciudad Universitaria ---
  '214': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Módulo 214 - Facultad de Tecnología',
    direccion: 'Ciudad Universitaria (Ingreso Av. Busch y 2do Anillo)',
    lat: -17.7768,
    lng: -63.1935,
    esProvincia: false,
    searchQuery: 'Modulo 214 Facultad de Tecnologia UAGRM Santa Cruz'
  },
  'veterinaria': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Hospital Escuela de Veterinaria (UAGRM)',
    direccion: 'Ciudad Universitaria (Sector Central)',
    lat: -17.7763,
    lng: -63.1953,
    esProvincia: false,
    searchQuery: 'Hospital Escuela de Veterinaria UAGRM Santa Cruz'
  },
  'hospital escuela': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Hospital Escuela de Veterinaria (UAGRM)',
    direccion: 'Ciudad Universitaria (Sector Central)',
    lat: -17.7763,
    lng: -63.1953,
    esProvincia: false,
    searchQuery: 'Hospital Escuela de Veterinaria UAGRM Santa Cruz'
  },
  '236': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Módulo 236 - FICCT',
    direccion: 'Ciudad Universitaria (Facultad de Cs. de la Computación)',
    lat: -17.7752,
    lng: -63.1958,
    esProvincia: false,
    searchQuery: 'Modulo 236 FICCT UAGRM Santa Cruz'
  },
  'ficct': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Módulo 236 - FICCT',
    direccion: 'Ciudad Universitaria (Facultad de Cs. de la Computación)',
    lat: -17.7752,
    lng: -63.1958,
    esProvincia: false,
    searchQuery: 'Modulo 236 FICCT UAGRM Santa Cruz'
  },
  '246': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Módulo 246',
    direccion: 'Ciudad Universitaria (Sector Aulas Centrales)',
    lat: -17.7768,
    lng: -63.1960,
    esProvincia: false,
    searchQuery: 'Modulo 246 UAGRM Santa Cruz'
  },
  'economicas': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Facultad de Ciencias Económicas y Financieras',
    direccion: 'Ciudad Universitaria (Campus Principal)',
    lat: -17.7760,
    lng: -63.1965,
    esProvincia: false,
    searchQuery: 'Facultad de Ciencias Economicas UAGRM Santa Cruz'
  },
  'juridicas': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Facultad de Ciencias Jurídicas (Módulo 293)',
    direccion: 'Ciudad Universitaria (Sector Santos Ortiz)',
    lat: -17.7770,
    lng: -63.1975,
    esProvincia: false,
    searchQuery: 'Facultad de Ciencias Juridicas UAGRM Santa Cruz'
  },
  '293': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Facultad de Ciencias Jurídicas (Módulo 293)',
    direccion: 'Ciudad Universitaria (Sector Santos Ortiz)',
    lat: -17.7770,
    lng: -63.1975,
    esProvincia: false,
    searchQuery: 'Modulo 293 UAGRM Santa Cruz'
  },
  'medicina': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Facultad de Medicina (Módulos 280-282)',
    direccion: 'Ciudad Universitaria',
    lat: -17.7745,
    lng: -63.1970,
    esProvincia: false,
    searchQuery: 'Facultad de Medicina UAGRM Santa Cruz'
  },
  'politecnica': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Facultad Politécnica (Módulo 224)',
    direccion: 'Ciudad Universitaria (Av. Busch)',
    lat: -17.7758,
    lng: -63.1938,
    esProvincia: false,
    searchQuery: 'Facultad Politecnica UAGRM Santa Cruz'
  },

  // --- Sedes Provinciales / Regionales ---
  'montero': {
    municipio: 'Montero',
    provincia: 'Obispo Santistevan',
    campus: 'Facultad Integral del Norte (FINOR)',
    direccion: 'Av. Circunvalación / Prolongación Isaías Parada, Montero',
    lat: -17.3422,
    lng: -63.2568,
    esProvincia: true,
    searchQuery: 'Facultad Integral del Norte FINOR UAGRM Montero'
  },
  'finor': {
    municipio: 'Montero',
    provincia: 'Obispo Santistevan',
    campus: 'Facultad Integral del Norte (FINOR)',
    direccion: 'Av. Circunvalación / Prolongación Isaías Parada, Montero',
    lat: -17.3422,
    lng: -63.2568,
    esProvincia: true,
    searchQuery: 'Facultad Integral del Norte FINOR UAGRM Montero'
  },
  'camiri': {
    municipio: 'Camiri',
    provincia: 'Cordillera',
    campus: 'Facultad Integral del Chaco (FICH)',
    direccion: 'Barrio Universitario, Camiri',
    lat: -20.0385,
    lng: -63.5242,
    esProvincia: true,
    searchQuery: 'Facultad Integral del Chaco FICH UAGRM Camiri'
  },
  'fich': {
    municipio: 'Camiri',
    provincia: 'Cordillera',
    campus: 'Facultad Integral del Chaco (FICH)',
    direccion: 'Barrio Universitario, Camiri',
    lat: -20.0385,
    lng: -63.5242,
    esProvincia: true,
    searchQuery: 'Facultad Integral del Chaco FICH UAGRM Camiri'
  },
  'vallegrande': {
    municipio: 'Vallegrande',
    provincia: 'Vallegrande',
    campus: 'Facultad Integral de los Valles (FINVAL)',
    direccion: 'Av. Marcelo Quiroga Santa Cruz, Vallegrande',
    lat: -18.4908,
    lng: -64.1062,
    esProvincia: true,
    searchQuery: 'Facultad Integral de los Valles FINVAL UAGRM Vallegrande'
  },
  'finval': {
    municipio: 'Vallegrande',
    provincia: 'Vallegrande',
    campus: 'Facultad Integral de los Valles (FINVAL)',
    direccion: 'Av. Marcelo Quiroga Santa Cruz, Vallegrande',
    lat: -18.4908,
    lng: -64.1062,
    esProvincia: true,
    searchQuery: 'Facultad Integral de los Valles FINVAL UAGRM Vallegrande'
  },
  'yapacani': {
    municipio: 'Yapacaní',
    provincia: 'Ichilo',
    campus: 'Facultad Integral de Ichilo (FIIC)',
    direccion: 'Av. Epifanio Ríos, Yapacaní',
    lat: -17.4042,
    lng: -63.8860,
    esProvincia: true,
    searchQuery: 'Facultad Integral de Ichilo FIIC UAGRM Yapacani'
  },
  'fiic': {
    municipio: 'Yapacaní',
    provincia: 'Ichilo',
    campus: 'Facultad Integral de Ichilo (FIIC)',
    direccion: 'Av. Epifanio Ríos, Yapacaní',
    lat: -17.4042,
    lng: -63.8860,
    esProvincia: true,
    searchQuery: 'Facultad Integral de Ichilo FIIC UAGRM Yapacani'
  },
  'san ignacio': {
    municipio: 'San Ignacio de Velasco',
    provincia: 'José Miguel de Velasco',
    campus: 'Facultad Integral de San Ignacio (FINSAN)',
    direccion: 'San Ignacio de Velasco',
    lat: -16.3755,
    lng: -60.9634,
    esProvincia: true,
    searchQuery: 'Facultad Integral de San Ignacio FINSAN UAGRM'
  },
  'finsan': {
    municipio: 'San Ignacio de Velasco',
    provincia: 'José Miguel de Velasco',
    campus: 'Facultad Integral de San Ignacio (FINSAN)',
    direccion: 'San Ignacio de Velasco',
    lat: -16.3755,
    lng: -60.9634,
    esProvincia: true,
    searchQuery: 'Facultad Integral de San Ignacio FINSAN UAGRM'
  },
  'san jose': {
    municipio: 'San José de Chiquitos',
    provincia: 'Chiquitos',
    campus: 'Facultad Integral Chiquitana (FINCHI)',
    direccion: 'San José de Chiquitos',
    lat: -17.8465,
    lng: -60.7441,
    esProvincia: true,
    searchQuery: 'Facultad Integral Chiquitana FINCHI UAGRM'
  },
  'finchi': {
    municipio: 'San José de Chiquitos',
    provincia: 'Chiquitos',
    campus: 'Facultad Integral Chiquitana (FINCHI)',
    direccion: 'San José de Chiquitos',
    lat: -17.8465,
    lng: -60.7441,
    esProvincia: true,
    searchQuery: 'Facultad Integral Chiquitana FINCHI UAGRM'
  },
  'san julian': {
    municipio: 'San Julián',
    provincia: 'Ñuflo de Chávez',
    campus: 'Facultad Integral del Noreste',
    direccion: 'San Julián, Santa Cruz',
    lat: -16.9150,
    lng: -62.6160,
    esProvincia: true,
    searchQuery: 'Facultad Integral del Noreste UAGRM San Julian'
  },
  'el torno': {
    municipio: 'El Torno',
    provincia: 'Andrés Ibáñez',
    campus: 'Unidad Académica El Torno',
    direccion: 'El Torno, Santa Cruz',
    lat: -17.9942,
    lng: -63.3812,
    esProvincia: true,
    searchQuery: 'UAGRM El Torno Santa Cruz'
  },
  'puerto suarez': {
    municipio: 'Puerto Suárez',
    provincia: 'Germán Busch',
    campus: 'Facultad Integral de la Chiquitania Sur',
    direccion: 'Puerto Suárez, Santa Cruz',
    lat: -18.9667,
    lng: -57.7997,
    esProvincia: true,
    searchQuery: 'UAGRM Puerto Suarez Santa Cruz'
  },
  'ciudad universitaria': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Ciudad Universitaria (Campus Principal)',
    direccion: 'Av. Busch entre 2do y 3er Anillo',
    lat: -17.7763,
    lng: -63.1953,
    esProvincia: false,
    searchQuery: 'Ciudad Universitaria UAGRM Santa Cruz'
  },
  'campus universitario': {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Campus Universitario (El Prado / Central)',
    direccion: 'Av. Centenario y 2do Anillo',
    lat: -17.7788,
    lng: -63.1930,
    esProvincia: false,
    searchQuery: 'Campus Universitario UAGRM Santa Cruz'
  },
  rectorado: {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: 'Edificio Central Rectorado UAGRM',
    direccion: 'Calle Junín esq. Libertad (Plaza 24 de Septiembre)',
    lat: -17.7831,
    lng: -63.1822,
    esProvincia: false,
    searchQuery: 'Rectorado UAGRM Calle Junin Santa Cruz'
  }
};

const detectarSedeUbicacion = (ubicacionStr: string): SedeUbicacion => {
  const norm = (ubicacionStr || '').toLowerCase();
  for (const [key, data] of Object.entries(SEDES_UAGRM)) {
    if (norm.includes(key)) return data;
  }
  // Dinámico si no coincide exactamente:
  const queryDinamica = ubicacionStr && !ubicacionStr.includes('No asignado')
    ? `${ubicacionStr.replace(/>/g, ' ')} UAGRM Santa Cruz`
    : 'Ciudad Universitaria UAGRM Santa Cruz';

  return {
    municipio: 'Santa Cruz de la Sierra',
    provincia: 'Andrés Ibáñez',
    campus: ubicacionStr && !ubicacionStr.includes('No asignado') ? ubicacionStr : 'Instalaciones Centrales UAGRM',
    direccion: 'Ciudad Universitaria - Av. Busch',
    lat: -17.7763,
    lng: -63.1953,
    esProvincia: false,
    searchQuery: queryDinamica
  };
};

export default function ConsultaActivo() {
  const { codActivo } = useParams<{ codActivo: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [nuevaCondicion, setNuevaCondicion] = useState<number | null>(null);
  const [mensajeAudit, setMensajeAudit] = useState<string | null>(null);
  const [mostrarMapa, setMostrarMapa] = useState<boolean>(false);
  const [mostrarHistorialCustodia, setMostrarHistorialCustodia] = useState<boolean>(false);

  const { data, loading, error, refetch } = useQuery(GET_ACTIVO_CONSULTA, {
    variables: { codActivo: codActivo || '' },
    skip: !codActivo,
    fetchPolicy: 'network-only'
  });

  const [actualizarCond, { loading: guardandoCond }] = useMutation(ACTUALIZAR_CONDICION);

  const activo = data?.activoPorCodigo;
  const condiciones = data?.todasCondiciones || [];

  const esAuditorOAdmin = isAuthenticated && (
    user?.esAdmin ||
    user?.permisos.includes('ver_auditoria') ||
    user?.permisos.includes('editar_activo') ||
    user?.permisos.includes('crear_activo')
  );

  const historialAsignaciones = [...(activo?.inDetAsigSet || [])].sort((a: any, b: any) => {
    const fA = a.codAsig?.fechaAsig ? new Date(a.codAsig.fechaAsig).getTime() : 0;
    const fB = b.codAsig?.fechaAsig ? new Date(b.codAsig.fechaAsig).getTime() : 0;
    if (fB !== fA) return fB - fA;
    const idA = Number(a.codAsig?.codAsig || 0);
    const idB = Number(b.codAsig?.codAsig || 0);
    return idB - idA;
  });

  // La asignación activa es la primera del historial ordenado (la más reciente)
  const asignacionActiva = historialAsignaciones.find((a: any) => a.codAsig?.estado === 'A') || historialAsignaciones[0];
  const oficina = asignacionActiva?.codAsig?.codOfic;
  const responsable = asignacionActiva?.codAsig?.empleadoResponsable;
  const vehiculo = activo?.vehiculo;
  const tieneHistorialPrevio = historialAsignaciones.length > 1;

  const buildUbicacion = () => {
    if (!oficina) return 'No asignado actualmente (En almacén/custodia general)';
    const partes: string[] = [];
    if (oficina.codPadre?.codPadre?.desDpto) partes.push(oficina.codPadre.codPadre.desDpto);
    if (oficina.codPadre?.desDpto) partes.push(oficina.codPadre.desDpto);
    if (oficina.desDpto) partes.push(oficina.desDpto);
    return partes.join(' > ') || oficina.desDpto;
  };

  const ubicacionTexto = buildUbicacion();
  const sedeInfo = detectarSedeUbicacion(ubicacionTexto);

  const handleAuditarConfirmar = async () => {
    if (!activo) return;
    try {
      if (nuevaCondicion && nuevaCondicion !== activo.codCond?.codCond) {
        await actualizarCond({
          variables: {
            nroActivo: parseInt(activo.nroActivo),
            codCond: nuevaCondicion
          }
        });
      }
      setMensajeAudit('Activo verificado y registrado en auditoría correctamente.');
      refetch();
      setTimeout(() => setMensajeAudit(null), 4000);
    } catch (e: any) {
      alert('Error al registrar verificación: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'sans-serif', padding: '20px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #cbd5e1', borderTopColor: '#1a3c6e', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', color: '#64748b', fontSize: '0.95rem' }}>Consultando activo en el sistema UAGRM...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'sans-serif', padding: '20px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', marginBottom: '16px', fontSize: '24px' }}>
          ⚠️
        </div>
        <h2 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '1.25rem' }}>Error de Conexión</h2>
        <p style={{ color: '#64748b', maxWidth: '340px', margin: '0 0 24px 0', fontSize: '0.9rem' }}>
          No se pudo conectar con el servidor de Activos Fijos ({error.message}). Por favor verifique la red.
        </p>
        <button
          onClick={() => refetch()}
          style={{ background: '#1a3c6e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
        >
          Reintentar Consulta
        </button>
      </div>
    );
  }

  if (!activo) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'sans-serif', padding: '20px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', marginBottom: '16px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h2 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '1.25rem' }}>Activo No Encontrado</h2>
        <p style={{ color: '#64748b', maxWidth: '320px', margin: '0 0 24px 0', fontSize: '0.9rem' }}>
          El código <strong>{codActivo}</strong> no coincide con ningún bien registrado o fue dado de baja.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ background: '#1a3c6e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
        >
          Ir al Inicio
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #e2e8f0', marginTop: '10px', marginBottom: '30px' }}>
        
        {/* Cabecera Institucional */}
        <div style={{ background: 'linear-gradient(135deg, #0d2347 0%, #1a3c6e 100%)', color: 'white', padding: '20px 16px', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#93c5fd' }}>
              U.A.G.R.M.
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 700, letterSpacing: '0.3px' }}>
            Dirección Universitaria de Activos Fijos
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>
            Ficha de Consulta y Verificación Oficial
          </p>
        </div>

        {/* Banner de Modo */}
        <div style={{
          padding: '8px 16px',
          background: esAuditorOAdmin ? '#ecfdf5' : '#eff6ff',
          borderBottom: `1px solid ${esAuditorOAdmin ? '#a7f3d0' : '#bfdbfe'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: esAuditorOAdmin ? '#065f46' : '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: esAuditorOAdmin ? '#10b981' : '#2563eb'
            }}></span>
            {esAuditorOAdmin ? 'MODO AUDITORÍA ACTIVO' : 'CONSULTA PÚBLICA INSTITUCIONAL'}
          </span>
          {!isAuthenticated ? (
            <button
              onClick={() => {
                sessionStorage.setItem('returnUrl', `/consulta/${codActivo}`);
                navigate('/login', { replace: true });
              }}
              style={{ background: '#1a3c6e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Soy Auditor (Iniciar Sesión)
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#1e293b', fontWeight: 600 }}>
                {user?.email}
              </span>
              <button
                onClick={() => navigate('/dashboard')}
                title="Ir al panel principal"
                style={{ background: '#0284c7', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                Panel ➔
              </button>
              <button
                onClick={logout}
                title="Cerrar sesión y ver como público"
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                Salir
              </button>
            </div>
          )}
        </div>

        {/* Tarjeta de Identificación Principal */}
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
                CÓDIGO DE ACTIVO
              </span>
              <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: '#1a3c6e', letterSpacing: '0.5px' }}>
                {activo.codActivo}
              </div>
            </div>
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              background: activo.codEstado?.desEstado?.toLowerCase().includes('activo') ? '#dcfce7' : '#fee2e2',
              color: activo.codEstado?.desEstado?.toLowerCase().includes('activo') ? '#15803d' : '#b91c1c',
              border: `1px solid ${activo.codEstado?.desEstado?.toLowerCase().includes('activo') ? '#86efac' : '#fca5a5'}`
            }}>
              {activo.codEstado?.desEstado || 'REGISTRADO'}
            </span>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              DESCRIPCIÓN DEL BIEN
            </span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', lineHeight: '1.4' }}>
              {activo.descripcion}
            </div>
          </div>

          {/* Tabla de Datos de Consulta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Categoría / Grupo:</span>
              <span style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>{activo.codGrupo?.desGrupo || '-'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Marca / Modelo:</span>
              <span style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>
                {activo.codMarca?.desMarca || 'S/M'} {activo.codModelo?.desModelo ? `(${activo.codModelo.desModelo})` : ''}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Número de Serie:</span>
              <span style={{ color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>{activo.nroSerie || 'S/N'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Condición Física:</span>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>
                {activo.codCond?.desCond || 'No especificada'}
              </span>
            </div>

            {/* Ubicación Asignada y Navegación GPS (Cómo llegar) */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#1e293b', fontWeight: 700, fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>📍</span> Ubicación Asignada
                </span>
                <span style={{
                  background: sedeInfo.esProvincia ? '#fef3c7' : '#e0f2fe',
                  color: sedeInfo.esProvincia ? '#92400e' : '#0369a1',
                  border: `1px solid ${sedeInfo.esProvincia ? '#fde68a' : '#bae6fd'}`,
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {sedeInfo.esProvincia ? '🏛️ Sede Provincial' : '🏛️ Campus Central'} • {sedeInfo.municipio}
                </span>
              </div>

              {/* Jerarquía de oficina */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '8px 10px',
                borderRadius: '6px',
                color: '#1a3c6e',
                fontWeight: 700,
                fontSize: '11.5px',
                lineHeight: '1.4'
              }}>
                {ubicacionTexto}
              </div>

              {/* Datos de dirección física */}
              <div style={{ fontSize: '11px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px', background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                <div>
                  <strong style={{ color: '#0f172a' }}>Campus / Facultad:</strong> {sedeInfo.campus}
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Municipio / Prov.:</strong> {sedeInfo.municipio} ({sedeInfo.provincia})
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Dirección / Ref.:</strong> {sedeInfo.direccion}
                </div>
              </div>

              {/* Botones de acción rápida: Cómo llegar */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(sedeInfo.searchQuery || `${sedeInfo.lat},${sedeInfo.lng}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: '#0284c7',
                    color: '#ffffff',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    boxShadow: '0 2px 4px rgba(2,132,199,0.25)',
                    textAlign: 'center'
                  }}
                >
                  🧭 ¿Cómo llegar? (GPS)
                </a>

                <button
                  type="button"
                  onClick={() => setMostrarMapa(!mostrarMapa)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: mostrarMapa ? '#e2e8f0' : '#ffffff',
                    color: '#1e293b',
                    border: '1px solid #cbd5e1',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '11.5px'
                  }}
                >
                  {mostrarMapa ? 'Ocultar Mapa' : '🗺️ Ver Mapa'}
                </button>
              </div>

              {/* Mapa embebido OpenStreetMap */}
              {mostrarMapa && (
                <div style={{ marginTop: '4px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <iframe
                    title="Ubicación Sede UAGRM"
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${sedeInfo.lng - 0.007}%2C${sedeInfo.lat - 0.005}%2C${sedeInfo.lng + 0.007}%2C${sedeInfo.lat + 0.005}&layer=mapnik&marker=${sedeInfo.lat}%2C${sedeInfo.lng}`}
                  />
                  <div style={{ background: '#f1f5f9', padding: '6px 10px', fontSize: '10px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📍 Coords: {sedeInfo.lat}, {sedeInfo.lng}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${sedeInfo.lat},${sedeInfo.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
                    >
                      Abrir en Google Maps ↗
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Custodio / Encargado Legal y Trazabilidad */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.3px' }}>
                    Custodio / Responsable Actual:
                  </span>
                  <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '13px', display: 'block', marginTop: '2px' }}>
                    {responsable ? `${responsable.nombre} ${responsable.apellido}` : 'Sin custodio individual'}
                  </span>
                  {responsable?.cargo && (
                    <span style={{ color: '#0284c7', fontSize: '11px', fontWeight: 600, display: 'block' }}>
                      {responsable.cargo}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                  <span style={{
                    background: '#dcfce7',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '12px'
                  }}>
                    🟢 Vigente
                  </span>
                  {tieneHistorialPrevio && (
                    <span style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '8px'
                    }}>
                      🔄 Bien Reasignado
                    </span>
                  )}
                </div>
              </div>

              {/* Historial de custodios / reasignaciones (Trazabilidad) */}
              {historialAsignaciones.length > 0 && (
                <div style={{ marginTop: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setMostrarHistorialCustodia(!mostrarHistorialCustodia)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1a3c6e',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '2px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'underline'
                    }}
                  >
                    <span>📜</span>
                    {mostrarHistorialCustodia
                      ? 'Ocultar historial de custodios'
                      : `Ver historial de custodios (${historialAsignaciones.length} registro${historialAsignaciones.length > 1 ? 's' : ''}${tieneHistorialPrevio ? ' · Ver custodio anterior' : ''})`}
                  </button>

                  {mostrarHistorialCustodia && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {historialAsignaciones.map((det: any, idx: number) => {
                        const asig = det.codAsig;
                        const emp = asig?.empleadoResponsable;
                        const esActual = idx === 0;
                        const ofi = asig?.codOfic;
                        return (
                          <div
                            key={idx}
                            style={{
                              background: esActual ? '#f0fdf4' : '#fffbeb',
                              border: `1px solid ${esActual ? '#86efac' : '#fde68a'}`,
                              borderRadius: '6px',
                              padding: '8px 10px',
                              fontSize: '11px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                              <strong style={{ color: esActual ? '#166534' : '#92400e' }}>
                                {esActual ? '🟢 Custodio Actual:' : '⚪ Custodio Anterior:'} {emp ? `${emp.nombre} ${emp.apellido}` : 'Responsable general'}
                              </strong>
                              <span style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: esActual ? '#bbf7d0' : '#fef3c7',
                                color: esActual ? '#14532d' : '#b45309'
                              }}>
                                {esActual ? 'Vigente' : 'Histórico'}
                              </span>
                            </div>
                            <div style={{ color: '#475569', fontSize: '10.5px' }}>
                              <span><strong>Cargo:</strong> {emp?.cargo || 'No registrado'}</span>
                              {asig?.tipoAsig?.des && (
                                <span style={{ marginLeft: '6px', color: '#64748b' }}>• {asig.tipoAsig.des}</span>
                              )}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '10px', marginTop: '3px' }}>
                              <span><strong>Ubicación:</strong> {ofi?.desDpto || 'Sin oficina'}</span> • <span><strong>Fecha Asig.:</strong> {asig?.fechaAsig || 'S/F'}</span>
                              {asig?.fechaFin && (
                                <span style={{ marginLeft: '4px', color: '#b45309' }}>• <strong>Hasta:</strong> {asig.fechaFin}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DATOS EXCLUSIVOS DE VEHÍCULO (Solo si el activo es un vehículo) */}
            {vehiculo && (
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', marginTop: '4px', marginBottom: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                  ESPECIFICACIONES TÉCNICAS DEL VEHÍCULO
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>PLACA:</span>
                    <strong style={{ color: '#1e293b', fontFamily: 'monospace', fontSize: '12px' }}>{vehiculo.placa || 'S/P'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>AÑO / COLOR:</span>
                    <strong style={{ color: '#1e293b' }}>{vehiculo.anio || '-'} {vehiculo.color ? `(${vehiculo.color})` : ''}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>N° MOTOR:</span>
                    <strong style={{ color: '#1e293b', fontFamily: 'monospace' }}>{vehiculo.motor || 'S/N'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>N° CHASIS:</span>
                    <strong style={{ color: '#1e293b', fontFamily: 'monospace' }}>{vehiculo.chasis || 'S/N'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>CONDUCTOR OFICIAL:</span>
                    <strong style={{ color: '#1a3c6e' }}>{vehiculo.nombreChofer || 'Sin conductor asignado'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>LICENCIA / CONTACTO:</span>
                    <strong style={{ color: '#1e293b' }}>{vehiculo.licenciaConducir || '-'} {vehiculo.telefonoChofer ? `(Cel. ${vehiculo.telefonoChofer})` : ''}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>KILOMETRAJE:</span>
                    <strong style={{ color: '#1e293b' }}>{vehiculo.kilometrajeActual != null ? `${Number(vehiculo.kilometrajeActual).toLocaleString('es-BO')} km` : '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>ESTADO MECÁNICO:</span>
                    <strong style={{ color: vehiculo.estadoMecanico === 'OPERATIVO' ? '#166534' : '#991b1b' }}>{vehiculo.estadoMecanico || 'OPERATIVO'}</strong>
                  </div>
                </div>
                {vehiculo.fechaVencimientoSoat && (
                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Seguro SOAT:</span>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: new Date(vehiculo.fechaVencimientoSoat) >= new Date() ? '#dcfce7' : '#fee2e2',
                      color: new Date(vehiculo.fechaVencimientoSoat) >= new Date() ? '#166534' : '#991b1b'
                    }}>
                      {new Date(vehiculo.fechaVencimientoSoat) >= new Date() ? `Vigente (${vehiculo.fechaVencimientoSoat})` : `Vencido (${vehiculo.fechaVencimientoSoat})`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* SECCIÓN EXCLUSIVA MODO AUDITOR / ADMINISTRADOR */}
            {esAuditorOAdmin && (
              <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#166534', fontWeight: 800, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  PANEL DE CONTROL DE AUDITORÍA
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4b5563' }}>Valor de Adquisición:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {activo.monto ? `Bs. ${parseFloat(activo.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : 'S/M'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4b5563' }}>Fecha de Adquisición:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{activo.fecAdqui || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4b5563' }}>Vida Útil del Grupo:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {activo.codGrupo?.vidaUtilDefault ? `${activo.codGrupo.vidaUtilDefault} años` : '-'}
                    </span>
                  </div>
                </div>

                {/* Actualizar Condición en Campo */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#374151', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Verificar Estado Físico:
                  </label>
                  <select
                    value={nuevaCondicion !== null ? nuevaCondicion : (activo.codCond?.codCond || '')}
                    onChange={(e) => setNuevaCondicion(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', background: 'white', fontWeight: 600 }}
                  >
                    {condiciones.map((c: any) => (
                      <option key={c.codCond} value={c.codCond}>{c.desCond}</option>
                    ))}
                  </select>
                </div>

                {mensajeAudit && (
                  <div style={{ background: '#bbf7d0', color: '#166534', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center', marginBottom: '10px' }}>
                    {mensajeAudit}
                  </div>
                )}

                <button
                  onClick={handleAuditarConfirmar}
                  disabled={guardandoCond}
                  style={{
                    width: '100%',
                    background: '#16a34a',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {guardandoCond ? 'Registrando...' : 'Confirmar Verificación de Auditoría'}
                </button>
              </div>
            )}

          </div>

          {/* Pie de página con sello oficial */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              SISTEMA DE ADMINISTRACIÓN DE ACTIVOS FIJOS — UAGRM
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
