export const ROUTES = {
  MONITORING: [
    {
      name: 'Health',
      route: '/monitoring/health',
    },
    {
      name: 'Workers',
      route: '/monitoring/workers',
    },
  ],
  ANALYTICS: (projectId: string) => [
    {
      name: 'Latency History',
      route: `/analytics/projects/${projectId}/latency`,
    },
    {
      name: 'Uptime Stats',
      route: `/analytics/projects/${projectId}/uptime`,
    },
    {
      name: 'Downtime History',
      route: `/analytics/projects/${projectId}/downtime-history`,
    },
    {
      name: 'Uptime History',
      route: `/analytics/projects/${projectId}/uptime-history`,
    },
    {
      name: 'Timing Breakdown',
      route: `/analytics/projects/${projectId}/timing-breakdown`,
    },
  ],
  SIMULATION: (projectId: string) => [
    {
      name: 'Latency Comparison',
      route: `/simulation/projects/${projectId}/latency-comparison`,
    },
  ]
}