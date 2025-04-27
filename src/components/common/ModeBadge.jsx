import { useTwin } from '../../context/TwinContext';

export default function ModeBadge() {
  const { state, dispatch } = useTwin();
  const clr = state.mode==='Dev'  ?'bg-blue-600'
           : state.mode==='Test' ?'bg-yellow-400 text-black'
           : state.mode==='UX'   ?'bg-pink-500'
           : 'bg-green-600';
  return (
    <select value={state.mode}
            onChange={e=>dispatch({type:'SET_MODE',mode:e.target.value})}
            className={`${clr} text-xs text-white px-2 py-1 rounded`}>
      {['Dev','Test','UX','Biz'].map(m=><option key={m}>{m}</option>)}
    </select>
  );
}
