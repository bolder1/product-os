export interface MetricCard {
  id: string
  label: string
  value: string
  change: number // percentage, positive = up
  sparkline: number[] // 7 data points
}

export interface DailyTraffic {
  date: string
  pageViews: number
  uniqueVisitors: number
}

export interface FunnelStep {
  name: string
  percentage: number
  dropOff: number
}

export interface TopPage {
  id: string
  name: string
  path: string
  views: number
  uniqueVisitors: number
  avgTime: string
  bounceRate: number
  sparkline: number[]
}

export interface AIInsight {
  id: string
  text: string
  severity: 'info' | 'warning' | 'success' | 'critical'
  action: string
}

export interface MockAnalyticsData {
  metrics: MetricCard[]
  dailyTraffic: DailyTraffic[]
  funnel: FunnelStep[]
  topPages: TopPage[]
  insights: AIInsight[]
}

export const mockAnalyticsData: MockAnalyticsData = {
  metrics: [
    {
      id: 'metric-users',
      label: 'Total Users',
      value: '12,847',
      change: 12.3,
      sparkline: [8200, 9100, 9800, 10400, 11200, 12100, 12847],
    },
    {
      id: 'metric-views',
      label: 'Page Views',
      value: '48,291',
      change: 8.7,
      sparkline: [38000, 40200, 42100, 44300, 45800, 47100, 48291],
    },
    {
      id: 'metric-session',
      label: 'Avg Session',
      value: '4m 32s',
      change: -2.1,
      sparkline: [5.1, 4.9, 4.8, 4.7, 4.6, 4.5, 4.53],
    },
    {
      id: 'metric-conversion',
      label: 'Conversion Rate',
      value: '3.2%',
      change: 0.4,
      sparkline: [2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2],
    },
  ],
  dailyTraffic: [
    { date: 'Mar 23', pageViews: 6200, uniqueVisitors: 3100 },
    { date: 'Mar 24', pageViews: 7100, uniqueVisitors: 3600 },
    { date: 'Mar 25', pageViews: 6800, uniqueVisitors: 3400 },
    { date: 'Mar 26', pageViews: 7500, uniqueVisitors: 3900 },
    { date: 'Mar 27', pageViews: 7200, uniqueVisitors: 3700 },
    { date: 'Mar 28', pageViews: 6900, uniqueVisitors: 3500 },
    { date: 'Mar 29', pageViews: 7600, uniqueVisitors: 4000 },
  ],
  funnel: [
    { name: 'Landing', percentage: 100, dropOff: 0 },
    { name: 'Sign Up', percentage: 42, dropOff: 58 },
    { name: 'Onboarding', percentage: 28, dropOff: 33 },
    { name: 'Active', percentage: 18, dropOff: 36 },
    { name: 'Paid', percentage: 3.2, dropOff: 82 },
  ],
  topPages: [
    { id: 'pg-1', name: 'Homepage', path: '/', views: 12480, uniqueVisitors: 8920, avgTime: '1m 45s', bounceRate: 42, sparkline: [1600, 1700, 1800, 1750, 1900, 1830, 1900] },
    { id: 'pg-2', name: 'Pricing', path: '/pricing', views: 8340, uniqueVisitors: 6120, avgTime: '3m 12s', bounceRate: 28, sparkline: [1100, 1200, 1150, 1300, 1250, 1180, 1160] },
    { id: 'pg-3', name: 'Dashboard', path: '/dashboard', views: 7210, uniqueVisitors: 4850, avgTime: '8m 04s', bounceRate: 12, sparkline: [900, 1000, 1050, 1100, 1080, 1020, 1060] },
    { id: 'pg-4', name: 'Documentation', path: '/docs', views: 5890, uniqueVisitors: 4210, avgTime: '5m 38s', bounceRate: 35, sparkline: [750, 800, 820, 870, 850, 900, 900] },
    { id: 'pg-5', name: 'Blog', path: '/blog', views: 4670, uniqueVisitors: 3890, avgTime: '2m 51s', bounceRate: 55, sparkline: [600, 650, 680, 700, 660, 690, 690] },
    { id: 'pg-6', name: 'Features', path: '/features', views: 3920, uniqueVisitors: 2840, avgTime: '2m 18s', bounceRate: 38, sparkline: [500, 540, 560, 580, 570, 550, 520] },
    { id: 'pg-7', name: 'Sign Up', path: '/signup', views: 3150, uniqueVisitors: 2980, avgTime: '1m 22s', bounceRate: 18, sparkline: [400, 430, 450, 470, 460, 440, 500] },
    { id: 'pg-8', name: 'Settings', path: '/settings', views: 2480, uniqueVisitors: 1890, avgTime: '4m 15s', bounceRate: 8, sparkline: [300, 320, 350, 370, 360, 350, 430] },
  ],
  insights: [
    {
      id: 'insight-1',
      text: 'Sign-up drop-off increased 15% on mobile devices this week',
      severity: 'critical',
      action: 'View mobile funnel',
    },
    {
      id: 'insight-2',
      text: 'Pricing page has the highest exit rate at 28%',
      severity: 'warning',
      action: 'Analyze pricing page',
    },
    {
      id: 'insight-3',
      text: 'Dashboard engagement is up 23% since last release',
      severity: 'success',
      action: 'View dashboard metrics',
    },
    {
      id: 'insight-4',
      text: 'Consider A/B testing the CTA copy on the landing page',
      severity: 'info',
      action: 'Create A/B test',
    },
  ],
}
