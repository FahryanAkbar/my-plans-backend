const createServiceBuilder = (servicePrefix: string) => {
  return (subPath: string) => `${servicePrefix}/${subPath}`
}

const monitoringService = createServiceBuilder('/monitoring')
const analyticsService = createServiceBuilder('/analytics')
const simulationService = createServiceBuilder('/simulation')

export const API_ENDPOINTS = {
  PROJECTS: {
    ROOT: '/projects',
  },
  MONITORING: {
    HEALTH: monitoringService('health'),
    WORKERS: monitoringService('workers'),
  }
}

export const getProjectEndpoints = (projectId: string) => ({
  DETAIL: `/projects/${projectId}`,
  MONITORING: {
    ROOT: `/projects/${projectId}/monitoring`,
    DETAIL: (configId: string) => `/projects/${projectId}/monitoring/${configId}`,
  },
  ANALYTICS: {
    LATENCY: analyticsService(`projects/${projectId}/latency`),
    UPTIME: analyticsService(`projects/${projectId}/uptime`),
    DOWNTIME_HISTORY: analyticsService(`projects/${projectId}/downtime-history`),
    UPTIME_HISTORY: analyticsService(`projects/${projectId}/uptime-history`),
    TIMING_BREAKDOWN: analyticsService(`projects/${projectId}/timing-breakdown`),
  },
  SIMULATION: {
    LATENCY_COMPARISON: simulationService(`projects/${projectId}/latency-comparison`),
  }
})

