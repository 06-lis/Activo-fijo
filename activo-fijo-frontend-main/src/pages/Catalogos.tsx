import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '../components/ui/PageLayout';
import Condiciones from './Condiciones';
import Estados from './Estados';
import Tipos from './Tipos';
import Atributos from './Atributos';
import Gestiones from './Gestiones';
import Funciones from './Funciones';

const CATALOGOS_ITEMS = [
  { id: 'condiciones', label: 'Condición Física', component: <Condiciones embedded={true} /> },
  { id: 'estados',     label: 'Estado Operativo', component: <Estados embedded={true} /> },
  { id: 'tipos',       label: 'Tipos de Activo',  component: <Tipos embedded={true} /> },
  { id: 'atributos',   label: 'Atributos Técnicos', component: <Atributos embedded={true} /> },
  { id: 'gestiones',   label: 'Gestiones Fiscales', component: <Gestiones embedded={true} /> },
  { id: 'funciones',   label: 'Funciones Adm.',   component: <Funciones embedded={true} /> },
];

export default function Catalogos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('cat') || CATALOGOS_ITEMS[0].id;
  const current = CATALOGOS_ITEMS.find(c => c.id === activeId) || CATALOGOS_ITEMS[0];

  return (
    <PageLayout
      title="Otros Catálogos y Parámetros"
      subtitle="Administración directa de estados, condiciones, atributos técnicos y parámetros institucionales"
    >
      <div className="tabs" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
        {CATALOGOS_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setSearchParams({ cat: item.id })}
            className={`tab-btn ${current.id === item.id ? 'active' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {current.component}
    </PageLayout>
  );
}
