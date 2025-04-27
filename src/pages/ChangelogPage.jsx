import React from 'react'
import { useTwin } from '../context/TwinContext'
import ChangelogTab from '../components/domain/ChangelogTab.jsx'

export default function ChangelogPage() {
  const { state } = useTwin()
  return <ChangelogTab changelog={state.changelog}/>
}
