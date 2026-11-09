import { gql } from '@apollo/client';

// ==================== ACTIVO ====================
export const GET_ACTIVOS_VIGENTES = gql`
  query GetActivosVigentes {
    todosActivos(soloActivos: true) {
      nroActivo
      codActivo
      descripcion
      monto
    }
  }
`;

// ==================== BAJAS ====================
export const GET_BAJAS_DATA = gql`
  query GetBajasData {
    todasBajasDetalladas {
      nro
      codAsig
      documento
      fechaBajaTe
      fechaBajaEf
      motivo
      observacion
      valorFinal
      unidadTecnica
      nroInforme
      fechaInforme
      destinoFinal
      nroActivo {
        nroActivo
        codActivo
        descripcion
        monto
      }
      codEmpAut
    }
    todosEmpleados {
      idEmpleado
      nombre
      apellido
      cargo
    }
    todosMotivos {
      motivo
      descripcion
    }
    todosActivos(soloActivos: false) {
      nroActivo
      codActivo
      descripcion
      aB
      monto
    }
  }
`;

// ==================== DEPRECIACIONES ====================
export const GET_DEPRECIACIONES_DATA = gql`
  query GetDepreciacionesData {
    todosActivos(soloActivos: true) {
      nroActivo
      codActivo
      descripcion
      monto
      fecAdqui
      codGrupo {
        codGrupo
        desGrupo
        tasaDepreciacion
        vidaUtilDefault
      }
    }
    ultimasDepreciaciones {
      nroSerie
      nroActivo {
        nroActivo
        codActivo
        descripcion
        monto
        codGrupo {
          desGrupo
        }
      }
      depresiacion
      acumulada
      valorActual
      valorRevaluo
    }
  }
`;

export const GET_DEP_ACUMULADA = gql`
  query GetDepAcumulada($nroActivo: Int!) {
    depAcumuladaPorActivo(nroActivo: $nroActivo) {
      nroSerie
      depresiacion
      acumulada
      valorActual
      valorRevaluo
    }
  }
`;

// ==================== UFVS ====================
export const GET_UFVS = gql`
  query GetUfvs {
    todasTasasRev {
      nro
      fecha
      ufv
    }
  }
`;

// ==================== GRUPOS ====================
export const GET_GRUPOS = gql`
  query GetGrupos {
    todosGrupos {
      codGrupo
      codHijo
      desGrupo
      nivel
      aB
      vidaUtilDefault
      codigoContable
      codPadre {
        codGrupo
        desGrupo
        codHijo
        codPadre {
          codGrupo
          desGrupo
          codHijo
          codPadre {
            codGrupo
            desGrupo
            codHijo
            codPadre {
              codGrupo
              desGrupo
              codHijo
              codPadre {
                codGrupo
                desGrupo
                codHijo
              }
            }
          }
        }
      }
    }
  }
`;

// ==================== OFICINAS ====================
export const GET_OFICINAS = gql`
  query GetOficinas {
    todasOficinas {
      codOfic
      codDpto
      desDpto
      nivel
      aB
      codPadre {
        codOfic
        desDpto
        codDpto
        codPadre {
          codOfic
          desDpto
          codDpto
          codPadre {
            codOfic
            desDpto
            codDpto
            codPadre {
              codOfic
              desDpto
              codDpto
              codPadre {
                codOfic
                desDpto
                codDpto
              }
            }
          }
        }
      }
    }
  }
`;

// ==================== REVALUOS ====================
export const GET_REVALUOS = gql`
  query GetRevaluos {
    todosRevaluos {
      codReval
      tipoReval
      documento
      fechaIni
      fechaFin
      estado
      inDetRevalSet {
        vidaUtilMes
        vidaUtilAno
        costo
        fechaReval
        estado
        nroActivo {
          nroActivo
          codActivo
          descripcion
          monto
        }
      }
    }
  }
`;

export const GET_CATALOGOS = gql`
  query GetCatalogos {
    todosActivos {
      nroActivo
      codActivo
      descripcion
      monto
    }
  }
`;

export const GET_ACTIVOS = gql`
  query GetActivos {
    todosActivos {
      nroActivo
      codActivo
      descripcion
      monto
      fecAdqui
      nroSerie
      organismoFinanciador
      codRube
      nroConvenio
      estadoRegistro
      aB
      codEstado {
        codEstado
        desEstado
      }
      codGrupo {
        codGrupo
        desGrupo
        nivel
        codHijo
        codPadre {
          codGrupo
          codHijo
          nivel
          codPadre {
            codGrupo
            codHijo
            nivel
            codPadre {
              codGrupo
              codHijo
              nivel
              codPadre {
                codGrupo
                codHijo
                nivel
              }
            }
          }
        }
      }
      codMarca {
        codMarca
        desMarca
      }
      codModelo {
        codModelo
        desModelo
      }
      codCond {
        codCond
        desCond
      }
      codProve {
        codProv
        nombre
      }
      nroIngreso {
        nroIngreso
        glosa
      }
    }
  }
`;

export const GET_CATALOGOS_ACTIVOS = gql`
  query GetCatalogosActivos {
    todosEstados {
      codEstado
      desEstado
    }
    todosGrupos {
      codGrupo
      codHijo
      desGrupo
      nivel
      codPadre {
        codGrupo
        codHijo
        desGrupo
        nivel
        codPadre {
          codGrupo
          codHijo
          desGrupo
          nivel
          codPadre {
            codGrupo
            codHijo
            desGrupo
            nivel
            codPadre {
              codGrupo
              codHijo
              desGrupo
              nivel
            }
          }
        }
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
    todosIngresos {
      nroIngreso
      glosa
      gestion
      codOficDest {
        codOfic
        codDpto
        nivel
        codPadre {
          codOfic
          codDpto
          nivel
          codPadre {
            codOfic
            codDpto
            nivel
            codPadre {
              codOfic
              codDpto
              nivel
              codPadre {
                codOfic
                codDpto
                nivel
              }
            }
          }
        }
      }
    }
    todasGestiones {
      codGest
      gestIni
    }
    todasCondiciones {
      codCond
      desCond
    }
    todosProvedores {
      codProv
      nombre
    }
    todasUnidades {
      codUnidad
      desUnidad
    }
    todosActivos(soloActivos: false) {
      codActivo
    }
  }
`;

// ==================== PAGINATED QUERIES ====================

export const GET_ACTIVOS_PAGINADOS = gql`
  query GetActivosPaginados($limit: Int, $offset: Int, $search: String, $soloActivos: Boolean, $soloAprobados: Boolean, $soloPendientes: Boolean) {
    todosActivosPaginados(limit: $limit, offset: $offset, search: $search, soloActivos: $soloActivos, soloAprobados: $soloAprobados, soloPendientes: $soloPendientes) {
      totalCount
      results {
        nroActivo
        codActivo
        descripcion
        monto
        fecAdqui
        nroSerie
        organismoFinanciador
        codRube
        nroConvenio
        estadoRegistro
        aB
        codEstado {
          codEstado
          desEstado
        }
        codGrupo {
          codGrupo
          desGrupo
          nivel
          codHijo
          vidaUtilDefault
          codPadre {
            codGrupo
            codHijo
            nivel
            codPadre {
              codGrupo
              codHijo
              nivel
              codPadre {
                codGrupo
                codHijo
                nivel
                codPadre {
                  codGrupo
                  codHijo
                  nivel
                }
              }
            }
          }
        }
        codMarca {
          codMarca
          desMarca
        }
        codModelo {
          codModelo
          desModelo
        }
        codCond {
          codCond
          desCond
        }
        codProve {
          codProv
          nombre
        }
        nroIngreso {
          nroIngreso
          glosa
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
            fechaAsig
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
        inDetRevalSet {
          vidaUtilAno
          vidaUtilMes
          estado
          fechaReval
        }
        inDepAcumuladaSet {
          nroSerie
          depresiacion
          acumulada
          valorActual
        }
      }
    }
  }
`;

// ==================== FICHA TÉCNICA / HOJA DE VIDA ====================
export const GET_FICHA_TECNICA_ACTIVO = gql`
  query GetFichaTecnicaActivo($nroActivo: Int!, $codGrupo: Int!) {
    activo(nroActivo: $nroActivo) {
      nroActivo
      codActivo
      descripcion
      nroSerie
      fecAdqui
      monto
      organismoFinanciador
      codRube
      nroConvenio
      estadoRegistro
      codGest {
        codGest
        gestIni
      }
      codGrupo {
        codGrupo
        codHijo
        desGrupo
        vidaUtilDefault
        codPadre {
          codHijo
          desGrupo
          codPadre {
            codHijo
            desGrupo
            codPadre {
              codHijo
              desGrupo
            }
          }
        }
      }
      codMarca {
        desMarca
      }
      codModelo {
        desModelo
      }
      codUnidad {
        codUnidad
        desUnidad
      }
      codCond {
        desCond
      }
      codEstado {
        desEstado
      }
      codProve {
        nombre
      }
      nroIngreso {
        nroIngreso
        glosa
        gestion
        fechaRecep
        fotoBien
        fotoPlaca
      }
      vehiculo {
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
        fechaVencimientoSoat
      }
      inDetAsigSet {
        cantidad
        fechaTrans
        codAsig {
          codAsig
          estado
          fechaAsig
          fechaFin
          tipoResp
          codResp
          empleadoResponsable {
            idEmpleado
            nombre
            apellido
            cargo
            numeroDocumento
          }
          codOfic {
            codOfic
            codDpto
            desDpto
            codPadre {
              codDpto
              desDpto
              codPadre {
                codDpto
                desDpto
                codPadre {
                  codDpto
                  desDpto
                }
              }
            }
          }
        }
      }
      inDetRevalSet {
        vidaUtilAno
        vidaUtilMes
        estado
        fechaReval
        costo
      }
      inDepAcumuladaSet {
        nroSerie
        depresiacion
        acumulada
        valorActual
        valorRevaluo
      }
    }
    atributosPorGrupo(codGrupo: $codGrupo, soloActivos: true) {
      codAtrib
      des
    }
    atribActivosPorActivo(nroActivo: $nroActivo) {
      ok
      valor
      codDetAtrib {
        codDetAtrib
        des
        codAtrib {
          codAtrib
          des
        }
      }
    }
    todosResponsables {
      codResp
      codEmp {
        idEmpleado
        nombre
        apellido
        cargo
        numeroDocumento
      }
    }
  }
`;

export const GET_VEHICULOS_PAGINADOS = gql`
  query GetVehiculosPaginados($limit: Int, $offset: Int, $search: String) {
    todosVehiculosPaginados(limit: $limit, offset: $offset, search: $search) {
      totalCount
      results {
        nroActivo {
          nroActivo
          codActivo
          descripcion
          monto
          fecAdqui
          nroSerie
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
  }
`;

export const GET_ASIGNACIONES_PAGINADAS = gql`
  query GetAsignacionesPaginadas($limit: Int, $offset: Int, $search: String, $estado: String) {
    todasAsignacionesPaginadas(limit: $limit, offset: $offset, search: $search, estado: $estado) {
      totalCount
      results {
        codAsig
        fechaAsig
        fechaFin
        estado
        tipoResp
        codResp
        empleadoResponsable {
          idEmpleado
          nombre
          apellido
          numeroDocumento
          cargo
        }
        tipoAsig { tipoAsig des }
        codOfic {
          codOfic
          codDpto
          desDpto
          nivel
          codPadre {
            codOfic
            codDpto
            nivel
            codPadre {
              codOfic
              codDpto
              nivel
            }
          }
        }
        inDetAsigSet {
          cantidad
          fechaTrans
          nroActivo {
            nroActivo
            codActivo
            descripcion
            monto
            codGrupo {
              desGrupo
              vidaUtilDefault
            }
            inDetRevalSet {
              vidaUtilAno
              vidaUtilMes
              estado
            }
            inDepAcumuladaSet {
              nroSerie
              depresiacion
              acumulada
              valorActual
            }
          }
        }
      }
    }
  }
`;

export const GET_LOGS_ACTIVOS_PAGINADOS = gql`
  query GetLogsActivosPaginados($limit: Int, $offset: Int, $search: String) {
    todosLogsActivosPaginados(limit: $limit, offset: $offset, search: $search) {
      totalCount
      results {
        id
        nroActivo
        codActivo
        descripcion
        monto
        fecAdqui
        nroSerie
        fechaTrans
        tipoActual
      }
    }
  }
`;

export const GET_LOGS_INGRESOS_PAGINADOS = gql`
  query GetLogsIngresosPaginados($limit: Int, $offset: Int, $search: String) {
    todosLogsIngresosPaginados(limit: $limit, offset: $offset, search: $search) {
      totalCount
      results {
        id
        nroIngreso
        gestion
        fechaRecep
        glosa
        fechaTrans
        estado
        tipoME
      }
    }
  }
`;

export const GET_LOGS_ASIGNADOS_PAGINADOS = gql`
  query GetLogsAsignadosPaginados($limit: Int, $offset: Int, $search: String) {
    todosLogsAsignadosPaginados(limit: $limit, offset: $offset, search: $search) {
      totalCount
      results {
        id
        codAsig
        codResp
        codOfic
        fechaAsig
        obs
        fechaAct
        tipoLog
      }
    }
  }
`;

export const GET_LOGS_DET_ASIG_PAGINADOS = gql`
  query GetLogsDetAsigPaginados($limit: Int, $offset: Int, $search: String) {
    todosLogsDetAsigPaginados(limit: $limit, offset: $offset, search: $search) {
      totalCount
      results {
        id
        codAsig
        nroActivo
        cantidad
        fechaTrans
        fechaTransAct
        tipoActual
      }
    }
  }
`;

export const GET_LOGS_OFICINA_PAGINADOS = gql`
  query GetLogsOficinaPaginados($limit: Int, $offset: Int, $search: String) {
    todosLogsOficinaPaginados(limit: $limit, offset: $offset, search: $search) {
      totalCount
      results {
        id
        codOfic
        codDpto
        desDpto
        codPadre
        nivel
        aB
        fechaMe
        tipoMe
      }
    }
  }
`;

export const GET_LOGS_DET_REVAL_PAGINADOS = gql`
  query GetLogsDetRevalPaginados($limit: Int, $offset: Int, $search: String) {
    todosLogsDetRevalPaginados(limit: $limit, offset: $offset, search: $search) {
      totalCount
      results {
        id
        codReval
        nroActivo
        vidaUtilMes
        vidaUtilAno
        costo
        fechaReval
        fechaActual
        tipoActual
      }
    }
  }
`;

export const GET_LOGS_BAJA_ACT_PAGINADOS = gql`
  query GetLogsBajaActPaginados($limit: Int, $offset: Int, $search: String) {
    todosLogsBajaActPaginados(limit: $limit, offset: $offset, search: $search) {
      totalCount
      results {
        id
        nro
        codAsig
        nroActivo
        codEmpAut
        fechaBajaTe
        fechaBajaEf
        motivo
        observacion
        fechaTrans
        valorFinal
      }
    }
  }
`;

// ==================== MIS ACTIVOS / INCIDENCIAS ====================
export const MIS_ACTIVOS = gql`
  query MisActivos {
    misActivos {
      nroActivo
      codActivo
      descripcion
      monto
      fecAdqui
      nroSerie
      estadoRegistro
      codGrupo {
        codGrupo
        codHijo
        desGrupo
      }
      codMarca {
        desMarca
      }
      codModelo {
        desModelo
      }
      codCond {
        desCond
      }
      codEstado {
        desEstado
      }
      codUnidad {
        desUnidad
      }
      vehiculo {
        placa
        color
        anio
        imagen
      }
      inDetAsigSet {
        codAsig {
          codAsig
          fechaAsig
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
  }
`;

export const MIS_INCIDENCIAS = gql`
  query MisIncidencias {
    misIncidencias {
      nroIncidencia
      nroActivo {
        nroActivo
        codActivo
        descripcion
      }
      descripcion
      fechaReporte
      evidenciaFoto
      estado
      fechaResolucion
      observacionAtencion
    }
  }
`;

export const TODAS_INCIDENCIAS = gql`
  query TodasIncidencias {
    todasIncidencias {
      nroIncidencia
      nroActivo {
        nroActivo
        codActivo
        descripcion
      }
      idEmpleado {
        idEmpleado
        nombre
        apellido
        numeroDocumento
        cargo
      }
      descripcion
      fechaReporte
      evidenciaFoto
      estado
      fechaResolucion
      observacionAtencion
    }
  }
`;

// ==================== DEVOLUCIÓN Y CERTIFICADO ====================
export const TODAS_DEVOLUCIONES = gql`
  query TodasDevoluciones {
    todasDevoluciones {
      nroDevolucion
      codAsig {
        codAsig
        fechaAsig
        codOfic {
          desDpto
        }
      }
      nroActivo {
        nroActivo
        codActivo
        descripcion
      }
      idEmpleadoRecibe {
        idEmpleado
        nombre
        apellido
        numeroDocumento
      }
      fechaDevolucion
      observaciones
      estado
    }
  }
`;

export const DEVOLUCION_POR_ID = gql`
  query DevolucionPorId($nroDevolucion: Int!) {
    devolucion(nroDevolucion: $nroDevolucion) {
      nroDevolucion
      codAsig {
        codAsig
      }
      nroActivo {
        nroActivo
        codActivo
        descripcion
      }
      idEmpleadoRecibe {
        idEmpleado
        nombre
        apellido
      }
      fechaDevolucion
      observaciones
      estado
    }
  }
`;

export const TODOS_CERTIFICADOS = gql`
  query TodosCertificados {
    todasCertificados {
      nroCertificado
      idEmpleado {
        idEmpleado
        nombre
        apellido
        numeroDocumento
        cargo
      }
      fechaEmision
      idUsuarioGenera {
        correo
      }
      nroDevolucion {
        nroDevolucion
      }
      estado
    }
  }
`;

export const CERTIFICADO_POR_ID = gql`
  query CertificadoPorId($nroCertificado: Int!) {
    certificado(nroCertificado: $nroCertificado) {
      nroCertificado
      idEmpleado {
        idEmpleado
        nombre
        apellido
        numeroDocumento
        cargo
      }
      fechaEmision
      idUsuarioGenera {
        correo
      }
      nroDevolucion {
        nroDevolucion
      }
      estado
    }
  }
`;

export const VALIDAR_SOLVENCIA = gql`
  query ValidarSolvencia($idEmpleado: Int!) {
    validarSolvencia(idEmpleado: $idEmpleado)
  }
`;

export const INCIDENCIA_POR_ID = gql`
  query IncidenciaPorId($nroIncidencia: Int!) {
    incidencia(nroIncidencia: $nroIncidencia) {
      nroIncidencia
      nroActivo {
        nroActivo
        codActivo
        descripcion
      }
      idEmpleado {
        idEmpleado
        nombre
        apellido
      }
      descripcion
      fechaReporte
      evidenciaFoto
      estado
      fechaResolucion
      observacionAtencion
    }
  }
`;

