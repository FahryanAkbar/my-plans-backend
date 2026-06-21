"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Cpu,
  Clock,
  ExternalLink,
  Globe,
  RefreshCw,
  Shield,
  Wifi,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Badge,
  Typography,
} from "@/components/atoms";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/molecules";
import {
  LatencyCharts,
  DowntimeHistory,
  TimingBreakdown,
  UptimeCharts,
  UptimeHistoryCharts,
  LatencyComparison,
} from "@/components/organisms";
import { useProjectConfigs } from "@/hooks";
import { ENV_BADGE, ENV_LABEL, NETWORK_LABEL } from "@/lib";
import type { AnalyticsRange } from "@/types/features";

export interface MonitoringWebsitesTemplateProps {
  projectId: string;
  configId?: string;
  className?: string;
}

const RANGES: { label: string; value: AnalyticsRange; description: string }[] = [
  { label: "1 Hour", value: "1h", description: "1 jam terakhir" },
  { label: "6 Hours", value: "6h", description: "6 jam terakhir" },
  { label: "12 Hours", value: "12h", description: "12 jam terakhir" },
  { label: "24 Hours", value: "24h", description: "24 jam terakhir" },
  { label: "7 Days", value: "7d", description: "7 hari terakhir" },
  { label: "30 Days", value: "30d", description: "30 hari terakhir" },
];

export function MonitoringWebsitesTemplate({
  projectId,
  configId,
  className,
}: MonitoringWebsitesTemplateProps) {
  const [range, setRange] = React.useState<AnalyticsRange>("24h");
  const { configs, isLoading } = useProjectConfigs(projectId);
  const activeConfig = React.useMemo(() => {
    if (!configs || configs.length === 0) return null;
    return configId ? configs.find((c) => c.id === configId) : configs[0];
  }, [configs, configId]);

  if (isLoading) {
    return (
      <div className={cn("w-full flex flex-col gap-6 animate-pulse", className)}>
        {/* Top Header Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-4 w-48 bg-muted rounded-md" />
          <div className="h-9 w-32 bg-muted rounded-xl" />
        </div>
        {/* Header Card Skeleton */}
        <div className="h-48 w-full rounded-2xl bg-muted/40 border border-border/30" />
        {/* Charts Skeletons */}
        <div className="h-80 w-full rounded-2xl bg-muted/40 border border-border/30" />
      </div>
    );
  }

  if (!activeConfig) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/50 bg-muted/10 rounded-2xl gap-4", className)}>
        <Globe className="h-10 w-10 text-muted-foreground/50" />
        <div className="space-y-1">
          <Typography variant="h5" className="font-semibold text-foreground/80">Config Not Found</Typography>
          <Typography variant="caption" className="text-xs text-muted-foreground/60">
            The requested monitoring configuration does not exist or has been deleted.
          </Typography>
        </div>
        <Link href={`/project/${projectId}?tab=monitoring`} passHref legacyBehavior>
          <Button size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Monitoring Configurations
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
        className,
      )}
    >
      {/* Top Bar: Back Link & Global Date Range Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/project/${projectId}?tab=monitoring`}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Monitoring Configurations
        </Link>

        <div className="flex items-center gap-3">
          <Typography variant="caption" className="text-xs text-muted-foreground/60 hidden sm:inline">
            Range:
          </Typography>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9 rounded-xl border-border/80 shadow-xs bg-card hover:bg-muted/50 cursor-pointer">
                <Calendar className="h-4 w-4 text-muted-foreground/75" />
                <span className="font-semibold text-xs">
                  {RANGES.find((r) => r.value === range)?.label ?? "24 Hours"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border border-border/80 shadow-md">
              {RANGES.map((item) => (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => setRange(item.value)}
                  className={cn(
                    "cursor-pointer font-medium text-xs",
                    range === item.value && "bg-muted text-foreground font-semibold"
                  )}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Target Details Card */}
      <Card className="border border-border/40 shadow-sm bg-card rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <CardContent className="p-6 space-y-6">
          {/* Main info row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/10">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Typography variant="h4" className="font-bold text-foreground">
                      {activeConfig.name}
                    </Typography>
                    <Badge
                      className={cn(
                        "text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider shrink-0",
                        ENV_BADGE[activeConfig.environment],
                      )}
                    >
                      {ENV_LABEL[activeConfig.environment] ?? activeConfig.environment}
                    </Badge>
                  </div>
                  <a
                    href={activeConfig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground/80 hover:text-primary transition-colors hover:underline font-medium"
                  >
                    {activeConfig.url}
                    <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>
            </div>

            {/* Status Switch or Status Pulse Info */}
            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-muted/20 border border-border/30 px-4 py-2.5 rounded-xl">
              <div className="relative flex h-3.5 w-3.5">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  activeConfig.enabled ? "bg-emerald-400" : "bg-amber-400"
                )} />
                <span className={cn(
                  "relative inline-flex rounded-full h-3.5 w-3.5",
                  activeConfig.enabled ? "bg-emerald-500" : "bg-amber-500"
                )} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider block">
                  Status
                </span>
                <span className="text-xs font-bold text-foreground block">
                  {activeConfig.enabled ? "Active (Monitoring)" : "Paused"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick config specs grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {[
              {
                icon: Shield,
                label: "SSL Verification",
                value: activeConfig.checkSsl ? "Enabled (HTTPS)" : "Disabled",
                color: activeConfig.checkSsl ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-muted-foreground/60 bg-muted/40 border-border/50",
              },
              {
                icon: Clock,
                label: "Timeout Threshold",
                value: `${activeConfig.timeout.toLocaleString("id-ID")} ms`,
                color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
              },
              {
                icon: RefreshCw,
                label: "Check Interval",
                value: `Every ${activeConfig.interval / 1000 / 60} min`,
                color: "text-indigo-500 bg-indigo-50/10 dark:bg-indigo-500/10 border-indigo-500/20",
              },
              {
                icon: Wifi,
                label: "Network Profile",
                value: NETWORK_LABEL[activeConfig.networkProfile] ?? activeConfig.networkProfile,
                color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
              },
            ].map((spec, index) => {
              const Icon = spec.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3 hover:bg-muted/10 transition-colors"
                >
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", spec.color)}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider block">
                      {spec.label}
                    </span>
                    <span className="text-xs font-semibold text-foreground/80 block truncate">
                      {spec.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Footer note: engine details */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground/60">
            <Cpu className="h-3.5 w-3.5" />
            <span>
              Engine: <strong className="font-semibold text-foreground/75">{activeConfig.engine}</strong> · Target expected status code: <strong className="font-semibold text-foreground/75">{activeConfig.expectedStatus}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Analytics components with dynamic range prop */}
      <LatencyCharts projectId={projectId} configId={configId} range={range} />
      <TimingBreakdown projectId={projectId} configId={configId} range={range} />
      <UptimeCharts projectId={projectId} configId={configId} range={range} />
      <DowntimeHistory projectId={projectId} configId={configId} range={range} />
      <UptimeHistoryCharts projectId={projectId} configId={configId} range={range} />
      <LatencyComparison projectId={projectId} configId={configId} range={range} />
    </div>
  );
}
