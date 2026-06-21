import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailySummary } from '../batch/entities/summary.entity';
import { Project } from '../projects/entities/project.entity';
import { AnalyticsInfluxRepository } from '../analytics/repositories/analytics-influx.repository';
import { TwinObject, TwinStatus } from './interfaces/twin-object.interface';
import { TwinStateDto } from './dto/twin-state.dto';

@Injectable()
export class DigitalTwinService {
  private readonly logger = new Logger(DigitalTwinService.name);

  constructor(
    @InjectRepository(DailySummary)
    private readonly dailySummaryRepo: Repository<DailySummary>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly analyticsInfluxRepo: AnalyticsInfluxRepository,
  ) {}

  async getTwinStateForProject(projectId: string): Promise<TwinStateDto> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: { monitoringConfigs: true },
    });

    if (!project) {
      return new TwinStateDto({
        projectId,
        projectName: 'Unknown',
        twins: [],
        snapshotAt: new Date().toISOString(),
      });
    }

    const realtimeMap = await this.getRealtimeMetrics(projectId);

    const today = new Date().toISOString().split('T')[0];
    const dailySummaries = await this.dailySummaryRepo.find({
      where: { projectId, date: today },
    });
    const summaryMap = new Map(dailySummaries.map((s) => [s.configId, s]));

    const twins: TwinObject[] = project.monitoringConfigs
      .filter((config) => config.enabled && !config.isArchived)
      .map((config) => {
        const rt = realtimeMap.get(config.id);
        const daily = summaryMap.get(config.id);

        const latencyMs = rt?.latencyMs ?? 0;
        const isUp = rt ? rt.isUp : null;
        const uptimePercent = daily?.uptimePercent ?? 100;
        const avgLatencyMs = daily?.avgLatencyMs ?? 0;

        const status = this.calculateStatus(isUp, latencyMs, config.timeout);
        const twinHealth = this.calculateHealth(
          uptimePercent,
          latencyMs,
          config.timeout,
        );
        const trend = this.calculateTrend(latencyMs, avgLatencyMs);

        return new TwinObject({
          configId: config.id,
          projectId,
          url: config.url,
          name: config.name,
          status,
          latencyMs,
          lastCheckedAt:
            rt?.lastCheckedAt ?? config.lastCheckedAt?.toISOString() ?? '',
          uptimePercent,
          avgLatencyMs,
          downtimeIncidents: daily?.downtimeIncidents ?? 0,
          twinHealth,
          trend,
        });
      });

    return new TwinStateDto({
      projectId,
      projectName: project.name,
      twins,
      snapshotAt: new Date().toISOString(),
    });
  }

  private async getRealtimeMetrics(
    projectId: string,
  ): Promise<
    Map<string, { latencyMs: number; isUp: boolean; lastCheckedAt: string }>
  > {
    const result = new Map<
      string,
      { latencyMs: number; isUp: boolean; lastCheckedAt: string }
    >();
    try {
      const rows =
        await this.analyticsInfluxRepo.getRealtimeMetricsForDigitalTwin(
          projectId,
        );
      for (const row of rows) {
        result.set(row.configId, {
          latencyMs: row.latency ?? 0,
          isUp: row.isUp !== undefined ? Boolean(row.isUp) : false,
          lastCheckedAt: row._time,
        });
      }
    } catch (err) {
      this.logger.warn(
        `[DigitalTwin] Failed to fetch real-time metrics: ${err}`,
      );
    }
    return result;
  }

  private calculateStatus(
    isUp: boolean | null,
    latencyMs: number,
    timeout: number,
  ): TwinStatus {
    if (isUp === null) return 'unknown';
    if (!isUp) return 'down';
    if (latencyMs > timeout * 0.8) return 'degraded';
    return 'up';
  }

  private calculateHealth(
    uptimePercent: number,
    latencyMs: number,
    timeout: number,
  ): number {
    const uptimeScore = uptimePercent;
    const latencyScore = Math.max(0, 100 - (latencyMs / timeout) * 100);
    return Math.round(uptimeScore * 0.7 + latencyScore * 0.3);
  }

  private calculateTrend(
    currentLatency: number,
    avgLatency: number,
  ): 'stable' | 'degrading' | 'recovering' {
    if (avgLatency === 0) return 'stable';
    const delta = (currentLatency - avgLatency) / avgLatency;
    if (delta > 0.2) return 'degrading';
    if (delta < -0.2) return 'recovering';
    return 'stable';
  }
}
