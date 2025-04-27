// src/data.js
export const initialFeatures = [
    { title:'Apify Slack Notify', status:'In Dev', prio:'Hoch',  risk:'Mittel', complexity:'Mittel',
      devDate:'2025-04-29', prodDate:'2025-04-30' },
    { title:'JWT-Tableau Embed',   status:'Abgeschlossen', prio:'Hoch', risk:'Hoch',   complexity:'Hoch',
      devDate:'2025-04-19', prodDate:'2025-04-20' },
    { title:'TikTok Ads',          status:'Geplant',      prio:'Mittel', risk:'',      complexity:'Mittel',
      devDate:'',            prodDate:'',           tags: ['n8n','scraper','supabase'] }
  ];
  
  export const initialTests = [
    {
      feature: 'JWT-basierter Tableau Embed',
      type: 'Functional',
      status: 'Pending',
      description: 'Validiert das Einbetten eines Tableau-Dashboards via JWT.',
      lastRun: null
    },
    {
      feature: 'Slack Notification bei Erfolg',
      type: 'Notification',
      status: 'Pending',
      description: 'Testet die Slack-Benachrichtigung eines n8n-Flows.',
      lastRun: null
    }
  ];
  
  export const initialChangelog = [
    { timestamp: '2025-04-24 14:00', source: 'GPT',    type: 'Feature Update', message: 'Feature „JWT-basierter Tableau Embed“ auf **Abgeschlossen** gesetzt.', relatedComponent: 'Tableau Embed' },
    { timestamp: '2025-04-23 17:30', source: 'Manuell', type: 'System Update',  message: 'Neue Apify-Scraper-Schnittstelle implementiert.',                     relatedComponent: 'Apify Scraper' }
  ];
  