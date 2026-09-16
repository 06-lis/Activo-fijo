import { gql } from '@apollo/client';

// ==================== BAJAS ====================
export const CREAR_BAJA_ACT = gql`
  mutation CrearBajaAct(
    $nroActivo: Int!
    $codAsig: Int
    $tipoPerAut: Int!
    $codEmpAut: Int!
    $documento: String
    $fechaBajaTe: Date!
    $fechaBajaEf: Date
    $motivo: String!
    $observacion: String
    $tipoPerResp: Int
    $codEmpResp: Int
    $valorFinal: Float
  ) {
    crearBajaAct(
      nroActivo: $nroActivo
      codAsig: $codAsig
      tipoPerAut: $tipoPerAut
      codEmpAut: $codEmpAut
      documento: $documento
      fechaBajaTe: $fechaBajaTe
      fechaBajaEf: $fechaBajaEf
      motivo: $motivo
      observacion: $observacion
      tipoPerResp: $tipoPerResp
      codEmpResp: $codEmpResp
      valorFinal: $valorFinal
    ) {
      baja {
        nro
        fechaBajaTe
        valorFinal
        nroActivo {
          nroActivo
          codActivo
          descripcion
          aB
        }
      }
    }
  }
`;

export const CREAR_MOTIVO_BAJA = gql`
  mutation CrearMotivoBaja($motivo: Int!, $descripcion: String!) {
    crearMotivoBaja(motivo: $motivo, descripcion: $descripcion) {
      motivoObj {
        motivo
        descripcion
      }
    }
  }
`;

export const EDITAR_MOTIVO_BAJA = gql`
  mutation EditarMotivoBaja($motivo: Int!, $descripcion: String!) {
    editarMotivoBaja(motivo: $motivo, descripcion: $descripcion) {
      motivoObj {
        motivo
        descripcion
      }
    }
  }
`;

export const ELIMINAR_MOTIVO_BAJA = gql`
  mutation EliminarMotivoBaja($motivo: Int!) {
    eliminarMotivoBaja(motivo: $motivo) {
      success
    }
  }
`;


// ==================== UFVS ====================
export const GUARDAR_TASA_REV = gql`
  mutation GuardarTasaRev($nro: Int, $fecha: Date!, $ufv: Float!) {
    guardarTasaRev(nro: $nro, fecha: $fecha, ufv: $ufv) {
      tasaRev {
        nro
        fecha
        ufv
      }
    }
  }
`;

// ==================== DEPRECIACIONES ====================
export const CALCULAR_DEP_MASIVA = gql`
  mutation CalcularDepreciacionMasiva($gestion: Int!, $periodo: Int!) {
    calcularDepreciacionMasiva(gestion: $gestion, periodo: $periodo) {
      procesados
      omitidos
      errores
    }
  }
`;

// ==================== GRUPOS ====================
export const CREAR_GRUPO = gql`
  mutation CrearGrupo($codHijo: String!, $desGrupo: String, $codGest: Int!, $codPadre: Int, $vidaUtilDefault: Int, $codigoContable: String) {
    crearGrupo(codHijo: $codHijo, desGrupo: $desGrupo, codGest: $codGest, codPadre: $codPadre, vidaUtilDefault: $vidaUtilDefault, codigoContable: $codigoContable) {
      grupo {
        codGrupo
        desGrupo
      }
    }
  }
`;

export const EDITAR_GRUPO = gql`
  mutation EditarGrupo($codGrupo: Int!, $codHijo: String, $desGrupo: String, $codPadre: Int, $vidaUtilDefault: Int, $codigoContable: String) {
    editarGrupo(codGrupo: $codGrupo, codHijo: $codHijo, desGrupo: $desGrupo, codPadre: $codPadre, vidaUtilDefault: $vidaUtilDefault, codigoContable: $codigoContable) {
      grupo {
        codGrupo
        desGrupo
      }
    }
  }
`;

export const ELIMINAR_GRUPO = gql`
  mutation DarDeBajaGrupo($codGrupo: Int!) {
    darDeBajaGrupo(codGrupo: $codGrupo) {
      grupo {
        codGrupo
        aB
      }
    }
  }
`;

// ==================== OFICINAS ====================
export const CREAR_OFIC = gql`
  mutation CrearOficina($codDpto: String!, $desDpto: String!, $codGest: Int!, $codPadre: Int) {
    crearOficina(codDpto: $codDpto, desDpto: $desDpto, codGest: $codGest, codPadre: $codPadre) {
      oficina {
        codOfic
        desDpto
      }
    }
  }
`;

export const ELIMINAR_OFIC = gql`
  mutation DarDeBajaOficina($codOfic: Int!) {
    darDeBajaOficina(codOfic: $codOfic) {
      oficina {
        codOfic
        aB
      }
    }
  }
`;

// ==================== REVALUOS ====================
export const CREAR_REVALUO = gql`
  mutation CrearRevaluo($tipoReval: Int!, $documento: String, $fechaIni: Date!) {
    crearRevaluo(tipoReval: $tipoReval, documento: $documento, fechaIni: $fechaIni) {
      revaluo {
        codReval
        tipoReval
        fechaIni
        estado
      }
    }
  }
`;

export const EDITAR_REVALUO = gql`
  mutation EditarRevaluo($codReval: Int!, $documento: String, $fechaFin: Date, $estado: String) {
    editarRevaluo(codReval: $codReval, documento: $documento, fechaFin: $fechaFin, estado: $estado) {
      revaluo {
        codReval
        documento
        estado
      }
    }
  }
`;

export const ANULAR_REVALUO = gql`
  mutation AnularRevaluo($codReval: Int!) {
    anularRevaluo(codReval: $codReval) {
      revaluo {
        codReval
        estado
      }
    }
  }
`;

export const AGREGAR_DET_REVAL = gql`
  mutation AgregarDetRevalConDepreciacion(
    $codReval: Int!,
    $nroActivo: Int!,
    $vidaUtilMes: Int!,
    $vidaUtilAno: Int!,
    $costo: Decimal!,
    $fechaReval: Date!,
    $nroSerie: Int!
  ) {
    agregarDetRevalConDepreciacion(
      codReval: $codReval,
      nroActivo: $nroActivo,
      vidaUtilMes: $vidaUtilMes,
      vidaUtilAno: $vidaUtilAno,
      costo: $costo,
      fechaReval: $fechaReval,
      nroSerie: $nroSerie
    ) {
      detReval {
        vidaUtilAno
        costo
        fechaReval
      }
      depAcumulada {
        depresiacion
        acumulada
        valorActual
      }
    }
  }
`;

export const ANULAR_DET_REVAL = gql`
  mutation AnularDetReval($codReval: Int!, $nroActivo: Int!) {
    anularDetReval(codReval: $codReval, nroActivo: $nroActivo) {
      detReval {
        estado
      }
    }
  }
`;

// ==================== ACTIVO ====================
export const CREAR_ACTIVO = gql`
  mutation CrearActivo(
    $codGest: Int!,
    $codActivo: String!,
    $codGrupo: Int!,
    $descripcion: String!,
    $codEstado: Int!,
    $nroIngreso: Int!,
    $monto: Float,
    $fecAdqui: Date,
    $nroSerie: String,
    $codMarca: Int,
    $codModelo: Int,
    $codProve: Int,
    $codCond: Int,
    $codUnidad: Int,
    $organismoFinanciador: Int,
    $codRube: String,
    $nroConvenio: String
  ) {
    crearActivo(
      codGest: $codGest,
      codActivo: $codActivo,
      codGrupo: $codGrupo,
      descripcion: $descripcion,
      codEstado: $codEstado,
      nroIngreso: $nroIngreso,
      monto: $monto,
      fecAdqui: $fecAdqui,
      nroSerie: $nroSerie,
      codMarca: $codMarca,
      codModelo: $codModelo,
      codProve: $codProve,
      codCond: $codCond,
      codUnidad: $codUnidad,
      organismoFinanciador: $organismoFinanciador,
      codRube: $codRube,
      nroConvenio: $nroConvenio
    ) {
      activo {
        nroActivo
        codActivo
        descripcion
      }
    }
  }
`;

export const EDITAR_ACTIVO = gql`
  mutation EditarActivo(
    $nroActivo: Int!,
    $descripcion: String,
    $codEstado: Int,
    $codGrupo: Int,
    $codMarca: Int,
    $codModelo: Int,
    $codCond: Int,
    $codUnidad: Int,
    $monto: Float,
    $nroSerie: String,
    $fecAdqui: Date,
    $organismoFinanciador: Int,
    $codRube: String,
    $nroConvenio: String
  ) {
    editarActivo(
      nroActivo: $nroActivo,
      descripcion: $descripcion,
      codEstado: $codEstado,
      codGrupo: $codGrupo,
      codMarca: $codMarca,
      codModelo: $codModelo,
      codCond: $codCond,
      codUnidad: $codUnidad,
      monto: $monto,
      nroSerie: $nroSerie,
      fecAdqui: $fecAdqui,
      organismoFinanciador: $organismoFinanciador,
      codRube: $codRube,
      nroConvenio: $nroConvenio
    ) {
      activo {
        nroActivo
        codActivo
        descripcion
      }
    }
  }
`;

export const DAR_DE_BAJA_ACTIVO = gql`
  mutation DarDeBajaActivo($nroActivo: Int!) {
    darDeBajaActivo(nroActivo: $nroActivo) {
      activo {
        nroActivo
      }
    }
  }
`;

export const APROBAR_ACTIVO = gql`
  mutation AprobarActivo($nroActivo: Int!) {
    aprobarActivo(nroActivo: $nroActivo) {
      activo {
        nroActivo
        estadoRegistro
      }
    }
  }
`;

// ==================== USUARIOS / EMPLEADOS ====================
export const REGISTRAR_EMPLEADO_USUARIO = gql`
  mutation RegistrarEmpleadoUsuario(
    $nombre: String!,
    $apellido: String!,
    $numeroDocumento: String!,
    $tipoDocumento: String!,
    $fechaIngreso: Date!,
    $salario: Decimal!,
    $correo: String!,
    $contrasena: String!,
    $procedencia: String,
    $cargo: String
  ) {
    registrarEmpleadoUsuario(
      nombre: $nombre,
      apellido: $apellido,
      numeroDocumento: $numeroDocumento,
      tipoDocumento: $tipoDocumento,
      fechaIngreso: $fechaIngreso,
      salario: $salario,
      correo: $correo,
      contrasena: $contrasena,
      procedencia: $procedencia,
      cargo: $cargo
    ) {
      usuario {
        idUsuario
        correo
        idEmpleado {
          idEmpleado
          nombre
          apellido
          procedencia
        }
      }
    }
  }
`;

// ==================== 2FA / OTP ====================
export const OBTENER_PRECONFIGURACION_2FA = gql`
  mutation ObtenerPreconfiguracion2FA {
    obtenerPreconfiguracion2fa {
      secret
      qrUri
    }
  }
`;

export const ACTIVAR_2FA = gql`
  mutation Activar2FA($code: String!) {
    activar2fa(code: $code) {
      success
    }
  }
`;

export const DESACTIVAR_2FA = gql`
  mutation Desactivar2FA {
    desactivar2fa {
      success
    }
  }
`;

