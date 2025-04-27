import { NavLink } from 'react-router-dom';

export default function Tabs() {
  const link = (to, label) => (
    <NavLink to={to}
      className={({isActive})=>isActive?'underline':''}>{label}</NavLink>);
  return (
    <div className="flex gap-3 text-sm">
      {link('/chat','💬 Chat')}
      {link('/system','🧭 System')}
      {link('/features','🧩 Features')}
      {link('/testing','🧪 Testing')}
      {link('/changelog','📜 Changelog')}
    </div>
  );
}
