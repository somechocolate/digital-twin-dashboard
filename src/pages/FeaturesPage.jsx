// src/pages/FeaturesPage.jsx
import { useEffect, useState } from 'react'
import { supabase }  from '../lib/supabaseClient'
import FeatureMatrix from '../components/domain/FeatureMatrix'

export default function FeaturesPage() {
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)

  // 1) Initial Load
  useEffect(() => {
    fetchFeatures()
  }, [])

  async function fetchFeatures() {
    setLoading(true)
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .order('devDate', { ascending: true })
    if (error) console.error(error)
    else        setFeatures(data)
    setLoading(false)
  }

  // 2) Create / Update / Delete
  async function handleUpsertFeature(feature) {
    const { data, error } = await supabase
      .from('features')
      .upsert({
        id: feature.id,            // existiert bei Update
        title: feature.title,
        status: feature.status,
        prio: feature.prio,
        risk: feature.risk,
        complexity: feature.complexity,
        devDate: feature.devDate,
        prodDate: feature.prodDate,
        componentId: feature.componentId
      })
      .select()
    if (error) console.error(error)
    else        setFeatures(prev => {
                  // Replace oder anhängen
                  const idx = prev.findIndex(f => f.id === data[0].id)
                  if (idx > -1) prev[idx] = data[0]
                  else          prev.push(data[0])
                  return [...prev]
                })
  }

  async function handleDeleteFeature(id) {
    const { error } = await supabase
      .from('features')
      .delete()
      .eq('id', id)
    if (error) console.error(error)
    else        setFeatures(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div>
      {loading 
        ? <p>Loading…</p>
        : <FeatureMatrix
            features={features}
            onSave={handleUpsertFeature}
            onDelete={handleDeleteFeature}
          />}
    </div>
  )
}
