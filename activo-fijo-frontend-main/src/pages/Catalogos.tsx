import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '../components/ui/PageLayout';
import Condiciones from './Condiciones';
import Estados from './Estados';
import Marcas from './Marcas';
import Materiales from './Materiales';
import Partes from './Partes';
import Unidades from './Unidades';
import Tipos from './Tipos';
import Atributos from './Atributos';
import Gestiones from './Gestiones';
import Funciones from './Funciones';

interface SubCatalog {
  id: string;
  label: string;
  description: string;
  component: React.ReactElement;
}

interface CatalogGroup {
  id: string;
  label: string;
  badge: string;
  description: string;
  catalogs: SubCatalog[];
}

export default function Catalogos() {
  const [searchParams, setSearchParams] = useSearchParams();

  const groups: CatalogGroup[] = [
    {
      id: 'estados_condiciones',
      label: 'Estados y Condiciones',
      badge: '2 Catálogos',
      description: 'Definición de la situación operativa y el grado de desgaste físico de los activos según normativa UAGRM.',
      catalogs: [
        {
          id: 'condiciones',
          label: 'Condición Física (Desgaste)',
          description: 'Clasificación física del bien (Nuevo, Bueno, Regular, Malo).',
          component: <Condiciones embedded={true} />,
        },
        {
          id: 'estados',
          label: 'Estado Operativo (Administrativo)',
          description: 'Situación operativa del bien (Activo, En Almacén, En Mantenimiento, Dado de Baja).',
          component: <Estados embedded={true} />,
        },
      ],
    },
    {
      id: 'especificaciones',
      label: 'Especificaciones Físicas',
      badge: '4 Catálogos',
      description: 'Componentes constructivos, unidades de medida y fabricantes de los activos fijos.',
      catalogs: [
        {
          id: 'marcas',
          label: 'Marcas y Modelos',
          description: 'Catálogo de marcas registradas y modelos de fábrica.',
          component: <Marcas embedded={true} />,
        },
        {
          id: 'materiales',
          label: 'Materiales Predominantes',
          description: 'Madera, Melamina, Metal, Vidrio, Plástico, etc.',
          component: <Materiales embedded={true} />,
        },
        {
          id: 'partes',
          label: 'Partes y Componentes',
          description: 'CPU, Teclado, Monitor, Parlantes, Motor, Chasis, etc.',
          component: <Partes embedded={true} />,
        },
        {
          id: 'unidades',
          label: 'Unidades de Medida',
          description: 'Pieza, Juego, Global, Metro, etc.',
          component: <Unidades embedded={true} />,
        },
      ],
    },
    {
      id: 'clasificacion',
      label: 'Clasificación y Atributos',
      badge: '2 Catálogos',
      description: 'Tipificación formal y parámetros técnicos específicos por rubro.',
      catalogs: [
        {
          id: 'tipos',
          label: 'Tipos de Activo',
          description: 'Clasificación de rubros y tipos de bienes institucionales.',
          component: <Tipos embedded={true} />,
        },
        {
          id: 'atributos',
          label: 'Atributos Técnicos por Grupo',
          description: 'Campos dinámicos personalizados por categoría de activo (Placa, RAM, Color, etc.).',
          component: <Atributos embedded={true} />,
        },
      ],
    },
    {
      id: 'sistema',
      label: 'Parámetros del Sistema',
      badge: '2 Catálogos',
      description: 'Vigencias anuales institucionales y funciones de la estructura administrativa UAGRM.',
      catalogs: [
        {
          id: 'gestiones',
          label: 'Gestiones Fiscales',
          description: 'Periodos anuales de vigencia contable y fiscal.',
          component: <Gestiones embedded={true} />,
        },
        {
          id: 'funciones',
          label: 'Funciones Administrativas',
          description: 'Estructura programática y funciones de dependencias universitarias.',
          component: <Funciones embedded={true} />,
        },
      ],
    },
  ];

  // Read active group & subcatalog from URL query params or defaults
  const activeGroupId = searchParams.get('seccion') || groups[0].id;
  const currentGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  const activeCatalogId = searchParams.get('cat') || currentGroup.catalogs[0].id;
  const currentCatalog = currentGroup.catalogs.find(c => c.id === activeCatalogId) || currentGroup.catalogs[0];

  const handleSelectGroup = (groupId: string) => {
    const selectedGroup = groups.find(g => g.id === groupId) || groups[0];
    setSearchParams({
      seccion: selectedGroup.id,
      cat: selectedGroup.catalogs[0].id,
    });
  };

  const handleSelectCatalog = (catalogId: string) => {
    setSearchParams({
      seccion: currentGroup.id,
      cat: catalogId,
    });
  };

  return (
    <PageLayout
      title="Catálogos y Parámetros del Sistema"
      subtitle="Administración consolidada de especificaciones técnicas, estados y clasificaciones UAGRM"
    >
      {/* ── BARRA DE PESTAÑAS PRINCIPALES (GRUPOS POR RELACIÓN) ── */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '3px solid #1a3c6e',
        marginBottom: '1rem',
        overflowX: 'auto',
        paddingBottom: '2px',
      }}>
        {groups.map(group => {
          const isActive = group.id === currentGroup.id;
          return (
            <button
              key={group.id}
              onClick={() => handleSelectGroup(group.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                border: '1px solid #cbd5e1',
                borderBottom: 'none',
                borderRadius: '5px 5px 0 0',
                background: isActive ? '#1a3c6e' : '#f1f5f9',
                color: isActive ? '#ffffff' : '#334155',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{group.label}</span>
              <span style={{
                fontSize: '0.70rem',
                padding: '2px 7px',
                borderRadius: '10px',
                background: isActive ? '#ffffff' : '#e2e8f0',
                color: isActive ? '#1a3c6e' : '#64748b',
                fontWeight: 700,
              }}>
                {group.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── BARRA DE SELECCIÓN DE SUB-CATÁLOGOS DENTRO DEL GRUPO ── */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginRight: '6px' }}>
            Seleccionar Catálogo:
          </span>
          {currentGroup.catalogs.map(cat => {
            const isSelected = cat.id === currentCatalog.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCatalog(cat.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #1a3c6e' : '1px solid #cbd5e1',
                  background: isSelected ? '#1a3c6e' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#334155',
                  boxShadow: isSelected ? '0 1px 3px rgba(26,60,110,0.2)' : 'none',
                  transition: 'all 0.12s ease',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
          {currentCatalog.description}
        </div>
      </div>

      {/* ── CONTENIDO DEL CATÁLOGO SELECCIONADO ── */}
      <div className="catalog-tab-content">
        {currentCatalog.component}
      </div>
    </PageLayout>
  );
}
