'use client'

import { Fragment } from "@prisma/client"
import { useState, useEffect } from "react"
import { 
  BrainCircuitIcon, 
  SettingsIcon, 
  PlayIcon, 
  BarChart3Icon,
  TrophyIcon,
  InfoIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  SparklesIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  data: Fragment
}

interface ModelConfig {
  name: string
  type: string
  hyperparameters: Record<string, any>
  reasoning: string
  isBest: boolean
  performance?: Record<string, number>
}

interface TestInput {
  [key: string]: string | number
}

interface TestResult {
  prediction: any
  confidence: number
  explanation?: string
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

export function AIBrainPanel({ data }: Props) {
  const [activeTab, setActiveTab] = useState("configuration")
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null)
  const [testInputs, setTestInputs] = useState<TestInput>({})
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Parse fragment data for model information
  const metrics = parseJson<Record<string, string | number>>(data.metrics)
  const files = parseJson<Record<string, string>>(data.files)
  
  // Mock model configurations - in real implementation, this would come from the agent
  const [modelConfigs] = useState<ModelConfig[]>([
    {
      name: "RandomForestClassifier",
      type: "Ensemble",
      hyperparameters: {
        n_estimators: 100,
        max_depth: 10,
        random_state: 42
      },
      reasoning: "Chosen for its robustness and ability to handle non-linear relationships in the dataset. Provides good balance between performance and interpretability.",
      isBest: true,
      performance: {
        accuracy: 0.94,
        precision: 0.93,
        recall: 0.95,
        f1_score: 0.94
      }
    },
    {
      name: "LogisticRegression",
      type: "Linear",
      hyperparameters: {
        C: 1.0,
        random_state: 42,
        max_iter: 1000
      },
      reasoning: "Simple baseline model that provides interpretable coefficients. Good for understanding linear relationships in the data.",
      isBest: false,
      performance: {
        accuracy: 0.87,
        precision: 0.85,
        recall: 0.89,
        f1_score: 0.87
      }
    },
    {
      name: "XGBoost",
      type: "Gradient Boosting",
      hyperparameters: {
        n_estimators: 200,
        learning_rate: 0.1,
        max_depth: 6
      },
      reasoning: "Advanced gradient boosting algorithm that often provides superior performance. More computationally intensive but can capture complex patterns.",
      isBest: false,
      performance: {
        accuracy: 0.92,
        precision: 0.91,
        recall: 0.93,
        f1_score: 0.92
      }
    }
  ])

  useEffect(() => {
    const bestModel = modelConfigs.find(config => config.isBest)
    if (bestModel) {
      setSelectedModel(bestModel)
    }
  }, [modelConfigs])

  // Mock test input fields based on dataset
  const [testFields] = useState([
    { name: "feature_1", type: "number", label: "Feature 1", defaultValue: 5.2 },
    { name: "feature_2", type: "number", label: "Feature 2", defaultValue: 3.4 },
    { name: "feature_3", type: "number", label: "Feature 3", defaultValue: 1.5 },
    { name: "feature_4", type: "number", label: "Feature 4", defaultValue: 0.2 }
  ])

  useEffect(() => {
    const defaultInputs: TestInput = {}
    testFields.forEach(field => {
      defaultInputs[field.name] = field.defaultValue
    })
    setTestInputs(defaultInputs)
  }, [testFields])

  const handleTestModel = async () => {
    if (!selectedModel) return
    
    setIsTesting(true)
    setTestResult(null) // Clear previous results to prevent caching
    
    // Simulate model testing based on actual input values
    setTimeout(() => {
      // Create dynamic prediction based on input values
      const f1 = testInputs.feature_1 as number || 0
      const f2 = testInputs.feature_2 as number || 0
      const f3 = testInputs.feature_3 as number || 0
      const f4 = testInputs.feature_4 as number || 0
      
      // Iris species prediction logic based on actual dataset characteristics
      let prediction = "setosa"
      let confidence = 0.85
      let explanation = ""
      
      // Setosa: small petal length and width
      if (f3 < 2.0 && f4 < 0.6) {
        prediction = "setosa"
        confidence = 0.95
        explanation = `Small petal length (${f3.toFixed(1)} cm) and width (${f4.toFixed(1)} cm) indicate ${prediction} iris.`
      }
      // Virginica: large petal length and width
      else if (f3 > 5.0 && f4 > 1.7) {
        prediction = "virginica"
        confidence = 0.92
        explanation = `Large petal length (${f3.toFixed(1)} cm) and width (${f4.toFixed(1)} cm) suggest ${prediction} iris.`
      }
      // Versicolor: medium measurements
      else if (f3 >= 2.0 && f3 <= 5.0 && f4 >= 0.6 && f4 <= 1.7) {
        prediction = "versicolor"
        confidence = 0.88
        explanation = `Medium petal measurements (${f3.toFixed(1)} cm length, ${f4.toFixed(1)} cm width) indicate ${prediction} iris.`
      }
      // Edge cases with confidence adjustment
      else if (f3 >= 2.0 && f3 <= 2.5 && f4 >= 0.6 && f4 <= 0.8) {
        prediction = "versicolor"
        confidence = 0.75
        explanation = `Measurements near setosa-versicolor boundary (${f3.toFixed(1)} cm, ${f4.toFixed(1)} cm) suggest ${prediction} iris with moderate confidence.`
      }
      else if (f3 >= 4.8 && f3 <= 5.2 && f4 >= 1.6 && f4 <= 1.8) {
        prediction = "virginica"
        confidence = 0.78
        explanation = `Measurements near versicolor-virginica boundary (${f3.toFixed(1)} cm, ${f4.toFixed(1)} cm) suggest ${prediction} iris with moderate confidence.`
      }
      else {
        // Default case based on overall pattern
        if (f3 < 3.0) {
          prediction = "setosa"
          confidence = 0.70
        } else if (f3 < 4.5) {
          prediction = "versicolor"
          confidence = 0.70
        } else {
          prediction = "virginica"
          confidence = 0.70
        }
        explanation = `Based on input values (sepal: ${f1.toFixed(1)}×${f2.toFixed(1)}, petal: ${f3.toFixed(1)}×${f4.toFixed(1)}), model predicts ${prediction} with moderate confidence.`
      }
      
      const mockResult: TestResult = {
        prediction,
        confidence,
        explanation
      }
      
      setTestResult(mockResult)
      setIsTesting(false)
    }, 1500)
  }

  const handleGenerateSampleInput = () => {
    // Generate edge case sample inputs for testing
    const sampleInputs = [
      // Setosa edge case
      { feature_1: 5.1, feature_2: 3.5, feature_3: 1.4, feature_4: 0.2 },
      // Versicolor edge case
      { feature_1: 6.0, feature_2: 2.7, feature_3: 4.5, feature_4: 1.5 },
      // Virginica edge case
      { feature_1: 7.2, feature_2: 3.2, feature_3: 6.0, feature_4: 2.5 },
      // Boundary case (setosa/versicolor)
      { feature_1: 5.5, feature_2: 3.0, feature_3: 2.2, feature_4: 0.7 },
      // Boundary case (versicolor/virginica)
      { feature_1: 6.5, feature_2: 3.0, feature_3: 5.0, feature_4: 1.7 },
      // Outlier case
      { feature_1: 8.0, feature_2: 4.0, feature_3: 6.5, feature_4: 3.0 }
    ]
    
    // Select random sample input
    const randomSample = sampleInputs[Math.floor(Math.random() * sampleInputs.length)]
    setTestInputs(randomSample)
    setTestResult(null) // Clear previous results
  }

  const getPerformanceColor = (value: number) => {
    if (value >= 0.9) return "text-green-500"
    if (value >= 0.8) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BrainCircuitIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Brain & Model Control</h2>
            <p className="text-sm text-muted-foreground">Model configuration, testing, and performance analysis</p>
          </div>
        </div>
        {selectedModel?.isBest && (
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <TrophyIcon className="h-3 w-3 mr-1" />
            Best Model
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
        <TabsList className="grid gap-10 scale-110 mb-4 grid-cols-4 bg-transparent h-auto p-0">
          <TabsTrigger value="configuration" className="bg-background ml-15 text-foreground shadow-sm border border-border rounded-md px-3 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-primary hover:bg-muted hover:shadow-md transition-all duration-200">
            <SettingsIcon className="h-4 w-4" />
            <span className="text-sm font-bold">Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="testing" className="bg-background text-foreground shadow-sm border border-border rounded-md px-3 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-primary hover:bg-muted hover:shadow-md transition-all duration-200">
            <PlayIcon className="h-4 w-4" />
            <span className="text-sm font-bold">Testing</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="bg-background text-foreground shadow-sm border border-border rounded-md px-3 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-primary hover:bg-muted hover:shadow-md transition-all duration-200">
            <BarChart3Icon className="h-4 w-4" />
            <span className="text-sm font-bold">Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="bg-background text-foreground shadow-sm border border-border rounded-md px-3 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-primary hover:bg-muted hover:shadow-md transition-all duration-200">
            <SparklesIcon className="h-4 w-4" />
            <span className="text-sm font-bold">Comparison</span>
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Model Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Select Model</h3>
                <select 
                  value={selectedModel?.name} 
                  onChange={(e) => {
                    const model = modelConfigs.find(m => m.name === e.target.value)
                    setSelectedModel(model || null)
                  }}
                  className="w-full p-3 border border-input bg-background rounded-md text-sm font-medium"
                >
                  {modelConfigs.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name} {model.isBest && '⭐'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedModel && (
                <>
                  {/* Model Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Model Type</h4>
                      <Badge className="bg-gray-600 text-white px-3 py-1">{selectedModel.type}</Badge>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Performance</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all rounded-full"
                            style={{ width: `${((selectedModel.performance?.accuracy || 0) * 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${getPerformanceColor(selectedModel.performance?.accuracy || 0)}`}>
                          {((selectedModel.performance?.accuracy || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hyperparameters */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Hyperparameters</h4>
                    <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                      {Object.entries(selectedModel.hyperparameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground font-medium">{key}</span>
                          <span className="font-mono font-semibold bg-background px-2 py-1 rounded">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-1">
                      <InfoIcon className="h-4 w-4" />
                      Agent Reasoning
                    </h4>
                    <textarea
                      value={selectedModel.reasoning}
                      readOnly
                      className="min-h-[100px] resize-none w-full p-3 border border-input bg-background rounded-md text-sm leading-relaxed"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayIcon className="h-4 w-4" />
                Model Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Inputs */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Test Input Values</h3>
                {testFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label htmlFor={field.name} className="text-sm font-medium text-foreground">
                      {field.label}
                    </label>
                    <Input
                      id={field.name}
                      type={field.type}
                      value={testInputs[field.name]?.toString() || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestInputs(prev => ({
                        ...prev,
                        [field.name]: field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
                      }))}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="p-3"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleTestModel} 
                  disabled={!selectedModel || isTesting}
                  className="flex-1 h-12 text-base font-semibold"
                >
                  {isTesting ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-3 border-2 border-current border-t-transparent rounded-full" />
                      Testing Model...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-5 w-5 mr-3" />
                      Test Model
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleGenerateSampleInput}
                  variant="outline"
                  className="flex-1 h-12 text-base font-semibold"
                >
                  <SparklesIcon className="h-5 w-5 mr-3" />
                  Generate Sample
                </Button>
              </div>

              {/* Test Results */}
              {testResult && (
                <Card className="bg-muted/20 border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <CheckCircle2Icon className="h-6 w-6 text-green-500" />
                        <h3 className="text-xl font-bold text-foreground">Prediction Result</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <h4 className="text-base font-semibold text-foreground border-b border-border pb-2">Prediction</h4>
                          <div className="bg-background rounded-lg p-4 border border-border">
                            <p className="text-2xl font-bold text-primary capitalize">{testResult.prediction}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-base font-semibold text-foreground border-b border-border pb-2">Confidence</h4>
                          <div className="bg-background rounded-lg p-4 border border-border">
                            <p className={`text-2xl font-bold ${getPerformanceColor(testResult.confidence)}`}>
                              {(testResult.confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {testResult.explanation && (
                        <div className="space-y-3">
                          <h4 className="text-base font-semibold text-foreground border-b border-border pb-2">Explanation</h4>
                          <div className="bg-background rounded-lg p-4 border border-border">
                            <p className="text-sm text-muted-foreground leading-relaxed">{testResult.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedModel?.performance ? (
                <div className="space-y-6">
                  {Object.entries(selectedModel.performance).map(([metric, value]) => (
                    <div key={metric} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-semibold text-foreground capitalize">{metric.replace(/_/g, " ")}</h4>
                        <span className={`text-lg font-bold ${getPerformanceColor(value)}`}>
                          {value.toFixed(3)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all rounded-full"
                          style={{ width: `${(value || 0) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3Icon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium">No performance metrics available</h3>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                Model Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {modelConfigs.map((model) => (
                  <div 
                    key={model.name}
                    className={`border rounded-xl p-6 transition-all ${model.isBest ? 'border-primary bg-primary/5 shadow-lg' : 'border-border hover:border-muted-foreground/20'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground">{model.name}</h3>
                        {model.isBest && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1">
                            <TrophyIcon className="h-3 w-3 mr-1" />
                            Best
                          </Badge>
                        )}
                      </div>
                      <Badge className="bg-gray-400 text-white px-3 py-1">{model.type}</Badge>
                    </div>
                    
                    {model.performance && (
                      <div className="grid grid-cols-4 gap-4">
                        {Object.entries(model.performance).map(([metric, value]) => (
                          <div key={metric} className="text-center space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground capitalize">
                              {metric.replace(/_/g, " ")}
                            </h4>
                            <div className={`text-xl font-bold ${getPerformanceColor(value)}`}>
                              {value.toFixed(3)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
