'use client'

import { Fragment } from "@prisma/client"
import { useState, useMemo } from "react"
import { 
  DatabaseIcon, 
  BarChart3Icon,
  PieChartIcon,
  TrendingUpIcon,
  InfoIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  FileTextIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Props {
  data: Fragment
}

interface DatasetStats {
  totalSamples: number
  features: number
  targetClasses: string[]
  missingValues: number
  dataTypes: Record<string, number>
  splitRatios: {
    train: number
    validation: number
    test: number
  }
}

function parseJson<T>(value: unknown): T | null {
  if (!value) return null
  if (typeof value === "object") return value as T
  try {
    return JSON.parse(value as string)
  } catch {
    return null
  }
}

export function DataIntelligenceDashboard({ data }: Props) {
  // Mock dataset statistics - in real implementation, this would come from the agent
  const [datasetStats] = useState<DatasetStats>({
    totalSamples: 150,
    features: 4,
    targetClasses: ["setosa", "versicolor", "virginica"],
    missingValues: 0,
    dataTypes: {
      numerical: 4,
      categorical: 1
    },
    splitRatios: {
      train: 0.7,
      validation: 0.15,
      test: 0.15
    }
  })

  // Feature name mapping for real Iris dataset feature names
  const featureNameMap: Record<string, string> = {
    'feature_1': 'sepal length (cm)',
    'feature_2': 'sepal width (cm)',
    'feature_3': 'petal length (cm)',
    'feature_4': 'petal width (cm)'
  }

  // Get display name for feature
  const getFeatureDisplayName = (feature: string) => {
    return featureNameMap[feature] || feature.replace(/_/g, ' ')
  }

  // Mock descriptive statistics
  const [descriptiveStats] = useState({
    feature_1: {
      mean: 5.843,
      std: 0.828,
      min: 4.3,
      max: 7.9,
      q25: 5.1,
      q50: 5.8,
      q75: 6.4
    },
    feature_2: {
      mean: 3.057,
      std: 0.435,
      min: 2.0,
      max: 4.4,
      q25: 2.8,
      q50: 3.0,
      q75: 3.3
    },
    feature_3: {
      mean: 3.758,
      std: 1.764,
      min: 1.0,
      max: 6.9,
      q25: 1.6,
      q50: 4.35,
      q75: 5.1
    },
    feature_4: {
      mean: 1.199,
      std: 0.762,
      min: 0.1,
      max: 2.5,
      q25: 0.3,
      q50: 1.3,
      q75: 1.8
    }
  })

  // Mock preprocessing summary
  const [preprocessingSteps] = useState([
    {
      step: "Data Cleaning",
      description: "Removed missing values and outliers",
      status: "completed",
      impact: "High"
    },
    {
      step: "Feature Scaling",
      description: "Applied StandardScaler to numerical features",
      status: "completed",
      impact: "High"
    },
    {
      step: "Label Encoding",
      description: "Converted categorical target to numerical labels",
      status: "completed",
      impact: "Medium"
    },
    {
      step: "Train-Test Split",
      description: "Split data into 70% train, 15% validation, 15% test",
      status: "completed",
      impact: "High"
    }
  ])

  const getQualityScore = () => {
    let score = 100
    if (datasetStats.missingValues > 0) score -= datasetStats.missingValues * 2
    if (datasetStats.totalSamples < 100) score -= 10
    return Math.max(0, score)
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High": return "bg-green-100 text-green-800"
      case "Medium": return "bg-yellow-100 text-yellow-800"
      case "Low": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    return status === "completed" ? (
      <CheckCircle2Icon className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />
    )
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DatabaseIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Data Intelligence Dashboard</h2>
            <p className="text-sm text-muted-foreground">Dataset insights and preprocessing transparency</p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800">
          Quality Score: {getQualityScore()}%
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="splits">Data Splits</TabsTrigger>
          <TabsTrigger value="preprocessing">Preprocessing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Dataset Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DatabaseIcon className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{datasetStats.totalSamples}</p>
                    <p className="text-xs text-muted-foreground">Total Samples</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <BarChart3Icon className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{datasetStats.features}</p>
                    <p className="text-xs text-muted-foreground">Features</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{datasetStats.targetClasses.length}</p>
                    <p className="text-xs text-muted-foreground">Target Classes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{datasetStats.missingValues}</p>
                    <p className="text-xs text-muted-foreground">Missing Values</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Target Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4" />
                Target Class Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {datasetStats.targetClasses.map((className, index) => {
                  const percentage = 100 / datasetStats.targetClasses.length // Equal distribution for demo
                  return (
                    <div key={className} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{className}</span>
                        <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Data Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-4 w-4" />
                Feature Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(datasetStats.dataTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium capitalize">{type}</span>
                    <Badge className="bg-blue-400 hover:bg-blue-300" variant="secondary">{count} feature</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4" />
                Descriptive Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Feature</th>
                      <th className="text-center p-2 font-medium">Mean</th>
                      <th className="text-center p-2 font-medium">Std Dev</th>
                      <th className="text-center p-2 font-medium">Min</th>
                      <th className="text-center p-2 font-medium">25%</th>
                      <th className="text-center p-2 font-medium">50%</th>
                      <th className="text-center p-2 font-medium">75%</th>
                      <th className="text-center p-2 font-medium">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(descriptiveStats).map(([feature, stats]) => (
                      <tr key={feature} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{getFeatureDisplayName(feature)}</td>
                        <td className="text-center p-2 font-mono">{stats.mean.toFixed(3)}</td>
                        <td className="text-center p-2 font-mono">{stats.std.toFixed(3)}</td>
                        <td className="text-center p-2 font-mono">{stats.min.toFixed(3)}</td>
                        <td className="text-center p-2 font-mono">{stats.q25.toFixed(3)}</td>
                        <td className="text-center p-2 font-mono">{stats.q50.toFixed(3)}</td>
                        <td className="text-center p-2 font-mono">{stats.q75.toFixed(3)}</td>
                        <td className="text-center p-2 font-mono">{stats.max.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Splits Tab */}
        <TabsContent value="splits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4" />
                Dataset Split Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(datasetStats.splitRatios).map(([split, ratio]) => {
                  const samples = Math.floor(datasetStats.totalSamples * ratio)
                  const percentage = ratio * 100
                  
                  return (
                    <div key={split} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium capitalize">{split} Set</span>
                          <span className="text-xs text-muted-foreground ml-2">({samples} samples)</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Split Strategy</p>
                    <p>Data was split using stratified sampling to maintain class distribution across all sets. This ensures representative samples for training, validation, and testing.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preprocessing Tab */}
        <TabsContent value="preprocessing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-4 w-4" />
                Preprocessing Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {preprocessingSteps.map((step, index) => (
                  <div key={step.step} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{step.step}</h4>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(step.status)}
                          <Badge className={getImpactColor(step.impact)}>
                            {step.impact} Impact
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <CheckCircle2Icon className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800 dark:text-green-200 mb-1">Preprocessing Complete</p>
                    <p className="text-green-700 dark:text-green-300">All preprocessing steps have been successfully applied. The data is ready for model training.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
