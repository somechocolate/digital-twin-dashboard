/* -------------------------------------------------- */
/* Systemübersicht                                    */
/* -------------------------------------------------- */
function SystemOverview() {
    /* Mermaid-Code als Platzhalter */
    const mermaidCode = `graph TD
      A[Frontend] -->|auth| B[Supabase]
      A --> C[Tableau Embed]
      A --> D[n8n orchestriert]
      D --> E[Apify Scraper]
      D --> F[Slack Alerts]
      B --> G[Postgres DB]`
  
    /* Baum mit Status-Emoji, letztem Update, Beschreibung  */
    const tree = [
      {
        name: 'Frontend (React)', status: '✅', last: '24.04.2025 02:00', desc: 'Tailwind + Auth + GPT-Chat',
        children: [
          { name: 'Tailwind UI', status: '✅', last: '—', desc: 'Styling-Lib' },
          { name: 'GPT-Chat Interface', status: '🟡', last: '23.04.2025 10:15', desc: 'Prompt-UI' }
        ]
      },
      {
        name: 'Backend', status: '🟡', last: '22.04.2025 02:00', desc: 'Server-Dienste',
        children: [
          {
            name: 'n8n Orchestrierung', status: '🟡', last: '22.04.2025', desc: 'Flows & Alerts',
            children: [
              { name: 'Apify Scraper', status: '🟠', last: '18.04.2025', desc: 'Actors Wettbewerber' },
              { name: 'Slack Alerts', status: '🟢', last: '23.04.2025', desc: 'Webhook OK' }
            ]
          },
          { name: 'Supabase (DB/Auth)', status: '✅', last: '20.04.2025', desc: 'Multi-Tenant + RLS' }
        ]
      },
      { name: 'Tableau Embed', status: '✅', last: '21.04.2025', desc: 'JWT-gefiltertes Dashboard' }
    ]
  
    /* Ranking-Map + Aggregations-Funktion ---------------- */
    const rank = { '🟢': 1, '✅': 1, '🟡': 2, '🟠': 3, '🔴': 4 }
    const worstStatus = (n) =>
      n.children ? [n.status, ...n.children.map(worstStatus)]
        .reduce((a, b) => (rank[a] > rank[b] ? a : b))
        : n.status
  
    /* Farbklasse ------------------------------------------------------ */
    const dotColor = (s) =>
      s === '🟢' || s === '✅' ? 'bg-green-500'
        : s === '🟡' ? 'bg-yellow-400'
          : s === '🟠' ? 'bg-orange-500'
            : 'bg-red-600'
  
    /* Rekursive Anzeige ------------------------------------------------ */
    const TreeNode = ({ node }) => {
      const agg = worstStatus(node)               // aggregated
      return (
        <details open className="ml-4">
          <summary className="cursor-pointer select-none flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-full ${dotColor(agg)}`} />
            <span>{node.name}</span>
            <span
              className="text-gray-400 text-xs ml-2"
              title={`${node.desc}\nLetztes Update: ${node.last}`}
            >
              {node.last}
            </span>
          </summary>
          {node.children?.map((c, i) => <TreeNode key={i} node={c} />)}
        </details>
      )
    }
  
    return (
      <div className="bg-white p-4 rounded shadow space-y-6">
        <h2 className="font-bold text-xl">🧭 Systemarchitektur (Mermaid)</h2>
        <pre className="bg-gray-100 text-xs p-3 rounded whitespace-pre overflow-x-auto mb-6">
          <code>{mermaidCode}</code>
        </pre>
  
        <h3 className="font-bold text-lg mb-2">🌳 Architektur-Baum mit Status</h3>
        {tree.map((n, i) => <TreeNode key={i} node={n} />)}
      </div>
    )
  }