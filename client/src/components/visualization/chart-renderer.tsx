import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ChartConfig, ChartDataPoint } from "./chart-factory";

interface ChartRendererProps {
  config: ChartConfig;
  className?: string;
}

const MetricCardsRenderer = ({ data, colors, title, description }: ChartConfig) => {
  const isFinancialDashboard = title === 'Financial Key Metrics';
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((item, index) => {
          const isDataAvailable = item.description !== 'Data not available';
          
          return (
            <Card key={item.name} className={`text-center ${!isDataAvailable ? 'opacity-60' : ''}`}>
              <CardContent className="pt-6">
                <div 
                  className="text-3xl font-bold mb-2" 
                  style={{ color: isDataAvailable ? colors[index % colors.length] : '#9ca3af' }}
                >
                  {isFinancialDashboard && isDataAvailable ? item.description : (isDataAvailable ? item.value : 'N/A')}
                </div>
                <div className="text-sm font-medium mb-1">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {isFinancialDashboard && !isDataAvailable ? item.description : 
                   isFinancialDashboard ? 'From annual report' : item.description}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const PieChartRenderer = ({ data, colors, title, description }: ChartConfig) => {
  const chartConfig = data.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: colors[index % colors.length]
    };
    return acc;
  }, {} as any);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px]">
        <PieChart>
          <ChartTooltip 
            cursor={false} 
            content={<ChartTooltipContent />} 
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ChartContainer>
    </div>
  );
};

const BarChartRenderer = ({ data, colors, title, description }: ChartConfig) => {
  const chartConfig = {
    value: {
      label: "Value",
      color: colors[0]
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChartContainer config={chartConfig} className="min-h-[350px]">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar 
            dataKey="value" 
            fill={colors[0]}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
};

const LineChartRenderer = ({ data, colors, title, description }: ChartConfig) => {
  const chartConfig = {
    value: {
      label: "Value",
      color: colors[0]
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChartContainer config={chartConfig} className="min-h-[350px]">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={colors[0]} 
            strokeWidth={3}
            dot={{ fill: colors[0], strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
};

const RadarChartRenderer = ({ data, colors, title, description }: ChartConfig) => {
  const chartConfig = {
    value: {
      label: "Priority Score",
      color: colors[0]
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[400px]">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Radar
            name="Priority Score"
            dataKey="value"
            stroke={colors[0]}
            fill={colors[0]}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ChartContainer>
    </div>
  );
};

export default function ChartRenderer({ config, className }: ChartRendererProps) {
  const { type } = config;

  const renderChart = () => {
    switch (type) {
      case 'metric-cards':
        return <MetricCardsRenderer {...config} />;
      case 'pie':
        return <PieChartRenderer {...config} />;
      case 'bar':
        return <BarChartRenderer {...config} />;
      case 'line':
        return <LineChartRenderer {...config} />;
      case 'radar':
        return <RadarChartRenderer {...config} />;
      default:
        return <MetricCardsRenderer {...config} />;
    }
  };

  return (
    <div className={className}>
      {renderChart()}
      
      {/* Related Insights */}
      {config.insights.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Related Insights ({config.insights.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {config.insights.slice(0, 3).map((insight, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {insight.dataPoint.substring(0, 50)}...
              </Badge>
            ))}
            {config.insights.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{config.insights.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}