import React from 'react'
import { useTwin } from '../context/TwinContext'
import TestingTab from '../components/domain/TestingTab'

export default function TestingPage() {
  const { state, dispatch } = useTwin()
  const setTests = (t) => dispatch({ type:'SET_TESTS', payload:t })
  return <TestingTab tests={state.tests} setTests={setTests}/>
}
