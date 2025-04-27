import React from 'react'
import { useTwin } from '../context/TwinContext'
import FeatureMatrix from '../components/domain/FeatureMatrix'

export default function FeaturesPage() {
  const { state, dispatch } = useTwin()
  const upd = (idx, key, val) => {
    const f = [...state.features]
    f[idx] = { ...f[idx], [key]: val }
    dispatch({ type:'SET_FEATURES', payload:f })
  }
  return <FeatureMatrix features={state.features} updateFeature={upd}/>
}
