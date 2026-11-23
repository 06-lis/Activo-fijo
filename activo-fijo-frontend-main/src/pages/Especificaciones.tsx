import React, { useState } from 'react';
import PageLayout from '../components/ui/PageLayout';
import Materiales from './Materiales';
import Partes from './Partes';
import Unidades from './Unidades';

export default function Especificaciones() {
  const [activeTab, setActiveTab] = useState<'materiales' | 'partes' | 'unidades'>('materiales');

  return (
    <PageLayout
      title="Materiales, Partes y Unidades"
      subtitle="Administración de tipos de material, componentes físicos y unidades de medida"
    >
      <div className="tabs" style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('materiales')}
          className={`tab-btn ${activeTab === 'materiales' ? 'active' : ''}`}
        >
          Tipos de Material
        </button>
        <button
          onClick={() => setActiveTab('partes')}
          className={`tab-btn ${activeTab === 'partes' ? 'active' : ''}`}
        >
          Partes y Componentes
        </button>
        <button
          onClick={() => setActiveTab('unidades')}
          className={`tab-btn ${activeTab === 'unidades' ? 'active' : ''}`}
        >
          Unidades de Medida
        </button>
      </div>

      {activeTab === 'materiales' && <Materiales embedded={true} />}
      {activeTab === 'partes' && <Partes embedded={true} />}
      {activeTab === 'unidades' && <Unidades embedded={true} />}
    </PageLayout>
  );
}
