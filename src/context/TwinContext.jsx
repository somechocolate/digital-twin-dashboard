// src/context/TwinContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'  // <-- ggf. Pfad anpassen

const TwinContext = createContext()
export const useTwin = () => useContext(TwinContext)

const initialState = {
  mode: 'Dev',
  systemComponents: [],
  features: [],
  tests: [],
  changelog: [],
  docsStatus: [],
  chat: [],
  uploading: null,
  pendingDelta: null
}

function reducer(state, { type, payload }) {
  switch (type) {
    case 'SET_MODE':
      return { ...state, mode: payload }

    case 'SET_SYSTEM_COMPONENTS':
      return { ...state, systemComponents: payload }
    case 'ADD_SYSTEM_COMPONENT':
      return { ...state, systemComponents: [...state.systemComponents, payload] }
    case 'UPDATE_SYSTEM_COMPONENT':
      return {
        ...state,
        systemComponents: state.systemComponents.map(c =>
          c.id === payload.id ? payload : c
        )
      }
    case 'REMOVE_SYSTEM_COMPONENT':
      return {
        ...state,
        systemComponents: state.systemComponents.filter(c => c.id !== payload)
      }

    case 'SET_FEATURES':
      return { ...state, features: payload }
    case 'ADD_FEATURE':
      return { ...state, features: [...state.features, payload] }
    case 'UPDATE_FEATURE':
      return {
        ...state,
        features: state.features.map(f =>
          f.id === payload.id ? payload : f
        )
      }
    case 'REMOVE_FEATURE':
      return {
        ...state,
        features: state.features.filter(f => f.id !== payload)
      }

    case 'SET_TESTS':
      return { ...state, tests: payload }
    case 'ADD_TEST':
      return { ...state, tests: [...state.tests, payload] }
    case 'UPDATE_TEST':
      return {
        ...state,
        tests: state.tests.map(t =>
          t.id === payload.id ? payload : t
        )
      }
    case 'REMOVE_TEST':
      return {
        ...state,
        tests: state.tests.filter(t => t.id !== payload)
      }

    case 'SET_CHANGELOG':
      return { ...state, changelog: payload }
    case 'ADD_CHANGELOG':
      return { ...state, changelog: [payload, ...state.changelog] }

    case 'SET_DOCS_STATUS':
      return { ...state, docsStatus: payload }
    case 'UPDATE_DOCS_STATUS':
      return {
        ...state,
        docsStatus: state.docsStatus.map(d =>
          d.id === payload.id ? payload : d
        )
      }

    case 'PUSH_CHAT':
      return { ...state, chat: [...state.chat, payload] }
    case 'SET_UPLOAD':
      return { ...state, uploading: payload }
    case 'SET_PENDING_DELTA':
      return { ...state, pendingDelta: payload }

    default:
      return state
  }
}

export function TwinProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Beim Mounten einmalig alle Daten laden
  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: systemComponents }, { data: features }, { data: tests },
             { data: changelog }, { data: docsStatus }] = await Promise.all([
        supabase.from('systemComponents').select('*'),
        supabase.from('features').select('*'),
        supabase.from('tests').select('*'),
        supabase.from('changes').select('*'),
        supabase.from('docsStatus').select('*')
      ])

      if (systemComponents) dispatch({ type: 'SET_SYSTEM_COMPONENTS', payload: systemComponents })
      if (features)         dispatch({ type: 'SET_FEATURES',          payload: features })
      if (tests)            dispatch({ type: 'SET_TESTS',             payload: tests })
      if (changelog)        dispatch({ type: 'SET_CHANGELOG',         payload: changelog })
      if (docsStatus)       dispatch({ type: 'SET_DOCS_STATUS',        payload: docsStatus })
    }

    fetchAll()
  }, [])

  // Hier könntest du noch weitere Helfer-Funktionen einpacken,
  // z. B. addFeature = async (feature) => { supabase ...; dispatch(...) }

  return (
    <TwinContext.Provider value={{ state, dispatch }}>
      {children}
    </TwinContext.Provider>
  )
}
