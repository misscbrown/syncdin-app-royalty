export interface Metric {
  title: string;
  value: number;
}

export interface PlaybackDataPoint {
  month: string;
  streams: number;
}

export interface MetadataStatPoint {
  category: string;
  count: number;
}

export interface RoyaltyGapPoint {
  month: string;
  expected: number;
  actual: number;
}

export interface ChartData {
  playbackFrequency: PlaybackDataPoint[];
  missingMetadataStats: MetadataStatPoint[];
  royaltyGapEstimation: RoyaltyGapPoint[];
}

export interface MetricsData {
  metrics: Metric[];
  charts: ChartData;
}

export interface FormattedMetric {
  title: string;
  value: string;
  rawValue: number;
}

const DEFAULT_METRICS: Metric[] = [];

const DEFAULT_CHARTS: ChartData = {
  playbackFrequency: [],
  missingMetadataStats: [],
  royaltyGapEstimation: [],
};

function formatMetricValue(title: string, value: number): string {
  if (title.toLowerCase().includes("royalties earned")) {
    return `$${value.toLocaleString()}`;
  }
  if (title.toLowerCase().includes("streams")) {
    return value.toLocaleString();
  }
  return value.toString();
}

export async function fetchMetricsData(): Promise<MetricsData> {
  try {
    const response = await fetch("/mock_data.json");
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      metrics: data.metrics || DEFAULT_METRICS,
      charts: {
        playbackFrequency: data.charts?.playbackFrequency || DEFAULT_CHARTS.playbackFrequency,
        missingMetadataStats: data.charts?.missingMetadataStats || DEFAULT_CHARTS.missingMetadataStats,
        royaltyGapEstimation: data.charts?.royaltyGapEstimation || DEFAULT_CHARTS.royaltyGapEstimation,
      },
    };
  } catch (error) {
    console.error("Error fetching metrics data:", error);
    return {
      metrics: DEFAULT_METRICS,
      charts: DEFAULT_CHARTS,
    };
  }
}

export async function getFormattedMetrics(): Promise<FormattedMetric[]> {
  const data = await fetchMetricsData();
  
  return data.metrics.map((metric) => ({
    title: metric.title,
    value: formatMetricValue(metric.title, metric.value),
    rawValue: metric.value,
  }));
}

export async function getChartData(): Promise<ChartData> {
  const data = await fetchMetricsData();
  return data.charts;
}

export async function getDashboardData(): Promise<{
  metrics: FormattedMetric[];
  charts: ChartData;
}> {
  const data = await fetchMetricsData();
  
  return {
    metrics: data.metrics.map((metric) => ({
      title: metric.title,
      value: formatMetricValue(metric.title, metric.value),
      rawValue: metric.value,
    })),
    charts: data.charts,
  };
}
