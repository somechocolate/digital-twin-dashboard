import { createContext, useContext, useReducer } from 'react'
import { initialFeatures, initialTests, initialChangelog } from '../data' // siehe Schritt 2

const TwinContext = createContext()
export const useTwin = () => useContext(TwinContext)

const initial = {
  mode: 'Dev',
  features: initialFeatures,
  tests: initialTests,
  changelog: initialChangelog,
  chat: [],
  uploading: null,
  pendingDelta: null
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload }
    case 'SET_FEATURES':
      return { ...state, features: action.payload }
    case 'SET_TESTS':
      return { ...state, tests: action.payload }
    case 'SET_CHANGELOG':
      return { ...state, changelog: action.payload }
    case 'PUSH_CHAT':
      return { ...state, chat: [...state.chat, action.payload] }
    case 'SET_UPLOAD':
      return { ...state, uploading: action.payload }
    case 'SET_PENDING_DELTA':
      return { ...state, pendingDelta: action.payload }
    default:
      return state
  }
}

export function TwinProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial)
  return (
    <TwinContext.Provider value={{ state, dispatch }}>
      {children}
    </TwinContext.Provider>
  )
}
