// src/pages/FeaturesPage.jsx
import React, { useEffect, useState } from 'react';
import { useTwin } from '../context/TwinContext';
import { supabase } from '../lib/supabaseClient';
import FeatureMatrix from '../components/domain/FeatureMatrix';

export default function FeaturesPage() {
  const { state: { suggestions }, dispatch } = useTwin();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1) Alle echten Features laden
  useEffect(() => {
    fetchFeatures();
  }, []);

  async function fetchFeatures() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('devDate', { ascending: true });
      if (error) throw error;
      setFeatures(data || []);
    } catch (err) {
      console.error('Fehler beim Laden der Features:', err);
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }

  // 2) GPT-Vorschlag übernehmen: in `features` verschieben, dann Proposal löschen
  async function acceptProposal(suggestion) {
    const { entityType, data, id } = suggestion;
    const table = entityType === 'feature' ? 'features' : 'systemComponents';
    try {
      const { error: insertErr } = await supabase.from(table).insert([data]);
      if (insertErr) throw insertErr;
      const { error: deleteErr } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', id);
      if (deleteErr) throw deleteErr;
      dispatch({ type: 'REMOVE_SUGGESTION', payload: id });
      await fetchFeatures();
    } catch (err) {
      console.error('Fehler beim Übernehmen des Vorschlags:', err);
    }
  }

  // 3) GPT-Vorschlag verwerfen: Proposal löschen
  async function rejectProposal(id) {
    try {
      const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      dispatch({ type: 'REMOVE_SUGGESTION', payload: id });
    } catch (err) {
      console.error('Fehler beim Verwerfen des Vorschlags:', err);
    }
  }

  // 4) Kombiniere echte Features + offene GPT-Vorschläge
  const items = [
    ...suggestions.map(s => ({
      ...s.data,
      _tempId: s.id,
      isSuggestion: true,
      suggestionId: s.id
    })),
    ...features.map(f => ({ ...f, isSuggestion: false })),
  ];

  return (
    <div>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <FeatureMatrix
          items={items}
          updateFeature={(idx, key, value) => {
            const item = items[idx];
            if (item.isSuggestion) return; // GPT-Vorschläge werden nicht editiert
            const updated = { ...item, [key]: value };
            supabase
              .from('features')
              .upsert(updated)
              .then(({ error }) => {
                if (error) console.error('Update-Fehler:', error);
                else fetchFeatures();
              });
          }}
          onAcceptProposal={acceptProposal}
          onRejectProposal={rejectProposal}
        />
      )}
    </div>
  );
}
