import React, { useEffect, useState } from 'react';
import { useTwin } from '../context/TwinContext';
import { supabase } from '../lib/supabaseClient';
import FeatureMatrix from '../components/domain/FeatureMatrix';

export default function FeaturesPage() {
  const { state:{ suggestions }, dispatch } = useTwin();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1) Daten laden
  useEffect(() => { fetchFeatures(); }, []);

  async function fetchFeatures() {
    setLoading(true);
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .order('dev_date',{ ascending:true });
    if (error) console.error(error);
    else       setFeatures(data);
    setLoading(false);
  }

  // 2) Akzeptieren eines Vorschlags
  async function acceptProposal(suggestion) {
    const { entityType, data, id } = suggestion;
    const table = entityType === 'feature' ? 'features' : 'system_components';
    // Insert in Features/SystemComponents
    const { error: err1 } = await supabase
      .from(table)
      .insert([data]);
    if (err1) {
      console.error(err1);
      return;
    }
    // Vorschlag löschen
    const { error: err2 } = await supabase
      .from('suggestions')
      .delete()
      .eq('id', id);
    if (err2) console.error(err2);
    else {
      dispatch({ type:'REMOVE_SUGGESTION', payload:id });
      fetchFeatures();
    }
  }

  // 3) Verwerfen eines Vorschlags
  async function rejectProposal(id) {
    const { error } = await supabase
      .from('suggestions')
      .delete()
      .eq('id', id);
    if (error) console.error(error);
    else {
      dispatch({ type:'REMOVE_SUGGESTION', payload:id });
    }
  }

  // 4) Gemeinsames Array
  const combined = [
    ...suggestions.map(s => ({
      ...s.data,
      _tempId: s.id,
      isSuggestion: true,
      suggestionId: s.id
    })),
    ...features.map(f => ({
      ...f,
      isSuggestion: false
    }))
  ];

  return (
    <div>
      {loading
        ? <p>Loading…</p>
        : (
          <FeatureMatrix
            items={combined}
            updateFeature={(idx, key, value) => {
              const f = combined[idx];
              const updated = { ...f, [key]: value };
              // direkt updaten in Supabase
              supabase.from('features').upsert(updated).then(res => {
                if (res.error) console.error(res.error);
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
