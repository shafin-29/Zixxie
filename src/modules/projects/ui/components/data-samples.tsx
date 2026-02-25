'use client'

import { Fragment } from "@prisma/client"
import { useState, useMemo } from "react"
import { 
  DatabaseIcon, 
  EyeIcon,
  SearchIcon,
  DownloadIcon,
  RefreshCwIcon,
  InfoIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Props {
  data: Fragment
}

interface DataSample {
  [key: string]: string | number | boolean | null
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

export function DataSamples({ data }: Props) {
  // Parse fragment data for samples
  const files = parseJson<Record<string, string>>(data.files)
  
  // Mock sample data - in real implementation, this would come from the agent
  const [sampleData] = useState<DataSample[]>([
    {
      id: 1,
      feature_1: 5.1,
      feature_2: 3.5,
      feature_3: 1.4,
      feature_4: 0.2,
      target: "setosa",
      processed_feature_1: 0.245,
      processed_feature_2: 0.312,
      processed_feature_3: -0.892,
      processed_feature_4: -1.041
    },
    {
      id: 2,
      feature_1: 4.9,
      feature_2: 3.0,
      feature_3: 1.4,
      feature_4: 0.2,
      target: "setosa",
      processed_feature_1: -0.421,
      processed_feature_2: -0.512,
      processed_feature_3: -0.892,
      processed_feature_4: -1.041
    },
    {
      id: 3,
      feature_1: 4.7,
      feature_2: 3.2,
      feature_3: 1.3,
      feature_4: 0.2,
      target: "setosa",
      processed_feature_1: -1.087,
      processed_feature_2: -0.102,
      processed_feature_3: -1.023,
      processed_feature_4: -1.041
    },
    {
      id: 4,
      feature_1: 4.6,
      feature_2: 3.1,
      feature_3: 1.5,
      feature_4: 0.2,
      target: "setosa",
      processed_feature_1: -1.753,
      processed_feature_2: -0.307,
      processed_feature_3: -0.761,
      processed_feature_4: -1.041
    },
    {
      id: 5,
      feature_1: 5.0,
      feature_2: 3.6,
      feature_3: 1.4,
      feature_4: 0.2,
      target: "setosa",
      processed_feature_1: -0.089,
      processed_feature_2: 0.517,
      processed_feature_3: -0.892,
      processed_feature_4: -1.041
    },
    {
      id: 6,
      feature_1: 7.0,
      feature_2: 3.2,
      feature_3: 4.7,
      feature_4: 1.4,
      target: "versicolor",
      processed_feature_1: 2.355,
      processed_feature_2: -0.102,
      processed_feature_3: 1.842,
      processed_feature_4: 0.321
    },
    {
      id: 7,
      feature_1: 6.4,
      feature_2: 3.2,
      feature_3: 4.5,
      feature_4: 1.5,
      target: "versicolor",
      processed_feature_1: 1.361,
      processed_feature_2: -0.102,
      processed_feature_3: 1.587,
      processed_feature_4: 0.542
    },
    {
      id: 8,
      feature_1: 6.9,
      feature_2: 3.1,
      feature_3: 4.9,
      feature_4: 1.5,
      target: "versicolor",
      processed_feature_1: 2.046,
      processed_feature_2: -0.412,
      processed_feature_3: 2.097,
      processed_feature_4: 0.542
    },
    {
      id: 9,
      feature_1: 5.5,
      feature_2: 2.3,
      feature_3: 4.0,
      feature_4: 1.3,
      target: "versicolor",
      processed_feature_1: 0.326,
      processed_feature_2: -1.548,
      processed_feature_3: 1.094,
      processed_feature_4: 0.100
    },
    {
      id: 10,
      feature_1: 6.5,
      feature_2: 2.8,
      feature_3: 4.6,
      feature_4: 1.5,
      target: "versicolor",
      processed_feature_1: 1.703,
      processed_feature_2: -0.927,
      processed_feature_3: 1.715,
      processed_feature_4: 0.542
    },
    {
      id: 11,
      feature_1: 6.3,
      feature_2: 3.3,
      feature_3: 6.0,
      feature_4: 2.5,
      target: "virginica",
      processed_feature_1: 1.191,
      processed_feature_2: 0.207,
      processed_feature_3: 3.352,
      processed_feature_4: 2.064
    },
    {
      id: 12,
      feature_1: 5.8,
      feature_2: 2.7,
      feature_3: 5.1,
      feature_4: 1.9,
      target: "virginica",
      processed_feature_1: 0.580,
      processed_feature_2: -0.717,
      processed_feature_3: 2.409,
      processed_feature_4: 1.342
    }
  ])

  // Column name mapping for real Iris dataset feature names
  const columnNameMap: Record<string, string> = {
    'feature_1': 'sepal length (cm)',
    'feature_2': 'sepal width (cm)', 
    'feature_3': 'petal length (cm)',
    'feature_4': 'petal width (cm)',
    'target': 'species',
    'processed_feature_1': 'scaled sepal length',
    'processed_feature_2': 'scaled sepal width',
    'processed_feature_3': 'scaled petal length', 
    'processed_feature_4': 'scaled petal width'
  }

  // Get display name for column
  const getDisplayName = (column: string) => {
    return columnNameMap[column] || column.replace(/_/g, ' ')
  }

  // Display all data - no filtering since pagination and search are removed
  const displayData = sampleData

  // Get column names
  const columns = useMemo(() => {
    return sampleData.length > 0 ? Object.keys(sampleData[0]) : []
  }, [sampleData])

  // Separate original and processed features
  const originalFeatures = columns.filter(col => !col.startsWith('processed_') && col !== 'id')
  const processedFeatures = columns.filter(col => col.startsWith('processed_'))

  const getColumnType = (column: string): 'numerical' | 'categorical' | 'processed' => {
    if (column === 'target') return 'categorical'
    if (column.startsWith('processed_')) return 'processed'
    return 'numerical'
  }

  const formatCellValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') {
      return value.toFixed(3)
    }
    return value.toString()
  }

  const getColumnTypeBadge = (column: string) => {
    const type = getColumnType(column)
    const variants = {
      numerical: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors',
      categorical: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors',
      processed: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-800/30 transition-colors'
    }
    return variants[type as keyof typeof variants] || 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-700 transition-colors'
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DatabaseIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sample Preprocessed Dataset</h2>
            <p className="text-sm text-muted-foreground">
              {sampleData.length} samples • {columns.length} features
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <EyeIcon className="h-4 w-4" />
              Data Preview
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <InfoIcon className="h-4 w-4" />
              Showing {displayData.length} samples
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="original" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="original">Original</TabsTrigger>
              <TabsTrigger value="processed">Processed</TabsTrigger>
            </TabsList>

            <TabsContent value="original" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b">
                      {originalFeatures.map((column) => (
                        <th key={column} className="p-3 font-medium text-center border-r border-border">
                          <div className="space-y-2">
                            <div className="font-medium text-center">
                              {getDisplayName(column)}
                            </div>
                            <Badge className={`text-xs px-2 py-1 ${getColumnTypeBadge(column)}`}>
                              {getColumnType(column) === 'numerical' ? 'num' : 
                               getColumnType(column) === 'categorical' ? 'cat' : 'proc'}
                            </Badge>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.map((row: DataSample, index: number) => (
                      <tr key={(typeof row.id === 'number' || typeof row.id === 'string') ? row.id : index} className={`border-b hover:bg-muted/50 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                        {originalFeatures.map((column) => (
                          <td key={column} className="p-3 font-mono text-xs text-center border-r border-border">
                            {formatCellValue(row[column], column)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="processed" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b">
                      {processedFeatures.map((column) => (
                        <th key={column} className="p-3 font-medium text-center border-r border-border">
                          <div className="space-y-2">
                            <div className="font-medium text-center">
                              {getDisplayName(column)}
                            </div>
                            <Badge className={`text-xs px-2 py-1 ${getColumnTypeBadge(column)}`}>
                              {getColumnType(column) === 'numerical' ? 'num' : 'proc'}
                            </Badge>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.map((row: DataSample, index: number) => (
                      <tr key={(typeof row.id === 'number' || typeof row.id === 'string') ? row.id : index} className={`border-b hover:bg-muted/50 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                        {processedFeatures.map((column) => (
                          <td key={column} className="p-3 font-mono text-xs text-center border-r border-border">
                            {formatCellValue(row[column], column)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
