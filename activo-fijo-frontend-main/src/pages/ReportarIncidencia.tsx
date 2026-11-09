import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { MIS_ACTIVOS } from '../graphql/queries';
import { REPORTAR_INCIDENCIA } from '../graphql/mutations';
import { showToast } from '../utils/toast';

/**
 * Formulario para reportar una incidencia sobre un activo bajo la custodia del funcionario.
 */
export default function ReportarIncidencia() {
  const [form, setForm] = useState({
    nroActivo: '',
    descripcion: '',
    evidenciaFoto: '',
  });

  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null);
  const [evidenciaPreview, setEvidenciaPreview] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const [reportarIncidencia] = useMutation(REPORTAR_INCIDENCIA, {
    refetchQueries: [{ query: MIS_ACTIVOS }],
  });

  const handleEvidenciaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenciaFile(file);
    setEvidenciaPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nroActivo || !form.descripcion) {
      alert('Por favor selecciona el activo y describe la incidencia.');
      return;
    }

    setSubiendo(true);
    try {
      let evidenciaUrl = form.evidenciaFoto;
      // Si hay archivo nuevo, subirlo al backend
      if (evidenciaFile) {
        const formData = new FormData();
        formData.append('file', evidenciaFile);
        const res = await fetch('http://localhost:8000/upload_ingreso_image/', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error al subir evidencia');
        evidenciaUrl = data.filePath;
      }

      await reportarIncidencia({
        variables: {
          nroActivo: parseInt(form.nroActivo, 10),
          descripcion: form.descripcion,
          evidenciaFoto: evidenciaUrl || null,
        },
      });
      showToast('✅ Incidencia reportada correctamente', 'success');
      setForm({ nroActivo: '', descripcion: '', evidenciaFoto: '' });
      setEvidenciaFile(null);
      setEvidenciaPreview(null);
    } catch (err: any) {
      alert('Error al reportar la incidencia: ' + err.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <PageLayout title="Reportar Incidencia" subtitle="Reporta un problema sobre un activo bajo tu custodia">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '.3px' }}>
            Activo afectado *
          </label>
          <input
            type="text"
            value={form.nroActivo}
            onChange={e => setForm({ ...form, nroActivo: e.target.value })}
            placeholder="Código del activo (ej. ABC-1234)"
            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc' }}
          />
        </div>

        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '.3px' }}>
            Descripción de la incidencia *
          </label>
          <textarea
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            rows={4}
            placeholder="Describe el problema observado (daño, deterioro, robo, extravío, etc.)"
            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '.3px' }}>
            Evidencia fotográfica (opcional)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleEvidenciaChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc' }}
          />
          {evidenciaPreview && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={evidenciaPreview} alt="Evidencia" style={{ width: '60px', height: '60px', objectFit: 'cover', border: '1px solid #475569', borderRadius: '4px' }} />
              <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>Imagen seleccionada</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => {
              setForm({ nroActivo: '', descripcion: '', evidenciaFoto: '' });
              setEvidenciaFile(null);
              setEvidenciaPreview(null);
            }}
            style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={subiendo}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', background: subiendo ? '#94a3b8' : '#1a3c6e', color: '#ffffff', fontWeight: 700, cursor: subiendo ? 'not-allowed' : 'pointer' }}
          >
            {subiendo ? 'Enviando…' : 'Reportar Incidencia'}
          </button>
        </div>
      </form>

      <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
        La incidencia quedará registrada con el estado «Pendiente». El personal de Activo Fijo la revisará y le notificará la atención.
      </p>
    </PageLayout>
  );
}
