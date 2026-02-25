'use client'

import { Fragment } from "@prisma/client"
import { useState, useMemo } from "react"
import { 
  FileTextIcon, 
  LightbulbIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  CodeIcon,
  BrainCircuitIcon,
  BarChart3Icon,
  PlayIcon,
  ClockIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Props {
  data: Fragment
}

interface PipelineStep {
  id: string
  title: string
  type: 'data' | 'preprocessing' | 'modeling' | 'evaluation' | 'deployment'
  status: 'completed' | 'running' | 'pending'
  duration?: string
  description: string
  reasoning: string
  code?: string
  output?: string
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

export function PipelineNarrative({ data }: Props) {
  // Mock pipeline steps - in real implementation, this would come from the agent
  const [pipelineSteps] = useState<PipelineStep[]>([
    {
      id: "1",
      title: "Data Loading and Initial Exploration",
      type: "data",
      status: "completed",
      duration: "2.3s",
      description: "Loaded the Iris dataset and performed initial data exploration",
      reasoning: "Started with the classic Iris dataset as it's well-understood and perfect for demonstrating classification workflows. The dataset has 150 samples with 4 numerical features and 3 target classes, making it ideal for multi-class classification.",
      code: `# Load the dataset
import pandas as pd
from sklearn.datasets import load_iris

# Load Iris dataset
iris = load_iris()
X = pd.DataFrame(iris.data, columns=iris.feature_names)
y = pd.Series(iris.target)

print(f"Dataset shape: {X.shape}")
print(f"Target classes: {iris.target_names}")
print(f"Features: {iris.feature_names}")`,
      output: "Dataset shape: (150, 4)\nTarget classes: ['setosa' 'versicolor' 'virginica']\nFeatures: ['sepal length (cm)', 'sepal width (cm)', 'petal length (cm)', 'petal width (cm)']"
    },
    {
      id: "2",
      title: "Data Quality Assessment",
      type: "data",
      status: "completed",
      duration: "1.1s",
      description: "Assessed data quality, checked for missing values and outliers",
      reasoning: "Data quality is crucial for model performance. I checked for missing values, duplicates, and potential outliers. The Iris dataset is known to be clean, but this step is essential for real-world datasets.",
      code: `# Check data quality
print("Missing values:")
print(X.isnull().sum())

print("\\nData types:")
print(X.dtypes)

print("\\nBasic statistics:")
print(X.describe())`,
      output: "Missing values:\nsepal length (cm)    0\nsepal width (cm)     0\npetal length (cm)    0\npetal width (cm)     0\ndtype: int64\n\nData types:\nsepal length (cm)    float64\nsepal width (cm)     float64\npetal length (cm)    float64\npetal width (cm)     float64\ndtype: object"
    },
    {
      id: "3",
      title: "Feature Scaling and Preprocessing",
      type: "preprocessing",
      status: "completed",
      duration: "0.8s",
      description: "Applied StandardScaler to normalize numerical features",
      reasoning: "Feature scaling is important for algorithms that are sensitive to feature magnitudes, such as SVM and k-NN. StandardScaler transforms features to have zero mean and unit variance, which helps these algorithms perform better.",
      code: `from sklearn.preprocessing import StandardScaler

# Initialize scaler
scaler = StandardScaler()

# Fit and transform features
X_scaled = scaler.fit_transform(X)

# Convert back to DataFrame
X_scaled = pd.DataFrame(X_scaled, columns=X.columns)

print("Scaled features summary:")
print(X_scaled.describe())`,
      output: "Scaled features summary:\n       sepal length (cm)  sepal width (cm)  petal length (cm)  petal width (cm)\ncount         150.000000        150.000000        150.000000       150.000000\nmean            0.000000          0.000000          0.000000         0.000000\nstd             1.000000          1.000000          1.000000         1.000000"
    },
    {
      id: "4",
      title: "Train-Test Split",
      type: "preprocessing",
      status: "completed",
      duration: "0.2s",
      description: "Split data into training (70%), validation (15%), and test (15%) sets",
      reasoning: "Proper data splitting prevents overfitting and provides unbiased evaluation. I used stratified sampling to maintain class distribution across all sets, which is important for imbalanced datasets.",
      code: `from sklearn.model_selection import train_test_split

# First split: separate test set
X_temp, X_test, y_temp, y_test = train_test_split(
    X_scaled, y, test_size=0.15, random_state=42, stratify=y
)

# Second split: separate train and validation
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.176, random_state=42, stratify=y_temp
)

print(f"Training set: {X_train.shape[0]} samples")
print(f"Validation set: {X_val.shape[0]} samples") 
print(f"Test set: {X_test.shape[0]} samples")`,
      output: "Training set: 105 samples\nValidation set: 22 samples\nTest set: 23 samples"
    },
    {
      id: "5",
      title: "Model Selection and Training",
      type: "modeling",
      status: "completed",
      duration: "3.2s",
      description: "Trained multiple models and selected the best performer",
      reasoning: "I evaluated several classification algorithms to find the best performer for this dataset. Random Forest was chosen as the best model due to its high accuracy and robustness to overfitting.",
      code: `from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression

# Initialize models
models = {
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'SVM': SVC(random_state=42),
    'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000)
}

# Train models
trained_models = {}
for name, model in models.items():
    model.fit(X_train, y_train)
    trained_models[name] = model
    print(f"Trained {name}")`,
      output: "Trained Random Forest\nTrained SVM\nTrained Logistic Regression"
    },
    {
      id: "6",
      title: "Model Evaluation",
      type: "evaluation",
      status: "completed",
      duration: "1.5s",
      description: "Evaluated models using accuracy, precision, recall, and F1-score",
      reasoning: "Comprehensive evaluation using multiple metrics provides a complete picture of model performance. Accuracy alone can be misleading, especially for imbalanced datasets.",
      code: `from sklearn.metrics import classification_report, accuracy_score

# Evaluate models on validation set
for name, model in trained_models.items():
    y_pred = model.predict(X_val)
    accuracy = accuracy_score(y_val, y_pred)
    print(f"\\n{name} - Accuracy: {accuracy:.4f}")
    print(classification_report(y_val, y_pred, target_names=iris.target_names))`,
      output: "Random Forest - Accuracy: 0.9545\n              precision    recall  f1-score   support\n\n      setosa       1.00      1.00      1.00         8\n  versicolor       0.89      1.00      0.94         8\n   virginica       1.00      0.83      0.91         6\n\n    accuracy                           0.95        22\n   macro avg       0.96      0.94      0.95        22\nweighted avg       0.96      0.95      0.95        22"
    },
    {
      id: "7",
      title: "Final Model Training",
      type: "modeling",
      status: "completed",
      duration: "2.1s",
      description: "Retrained the best model on combined training and validation data",
      reasoning: "To maximize performance, I retrained the Random Forest on the combined training and validation data before final evaluation on the test set. This approach uses all available data for training while maintaining an unbiased test set.",
      code: `# Combine train and validation data
X_train_full = pd.concat([X_train, X_val])
y_train_full = pd.concat([y_train, y_val])

# Train final model
final_model = RandomForestClassifier(n_estimators=100, random_state=42)
final_model.fit(X_train_full, y_train_full)

print(f"Final model trained on {X_train_full.shape[0]} samples")`,
      output: "Final model trained on 127 samples"
    },
    {
      id: "8",
      title: "Final Evaluation",
      type: "evaluation",
      status: "completed",
      duration: "0.9s",
      description: "Final evaluation on the held-out test set",
      reasoning: "The final evaluation on the test set provides an unbiased estimate of the model's performance on unseen data. This is the true measure of how well the model will perform in production.",
      code: `# Final evaluation on test set
y_test_pred = final_model.predict(X_test)
test_accuracy = accuracy_score(y_test, y_test_pred)

print(f"Final Test Accuracy: {test_accuracy:.4f}")
print("\\nClassification Report:")
print(classification_report(y_test, y_test_pred, target_names=iris.target_names))`,
      output: "Final Test Accuracy: 0.9565\n\nClassification Report:\n              precision    recall  f1-score   support\n\n      setosa       1.00      1.00      1.00         8\n  versicolor       0.89      1.00      0.94         8\n   virginica       1.00      0.86      0.92         7\n\n    accuracy                           0.96        23\n   macro avg       0.96      0.95      0.95        23\nweighted avg       0.96      0.96      0.96        23"
    }
  ])

  const getStepIcon = (type: string) => {
    switch (type) {
      case "data": return <DatabaseIcon className="h-4 w-4" />
      case "preprocessing": return <CodeIcon className="h-4 w-4" />
      case "modeling": return <BrainCircuitIcon className="h-4 w-4" />
      case "evaluation": return <BarChart3Icon className="h-4 w-4" />
      case "deployment": return <PlayIcon className="h-4 w-4" />
      default: return <FileTextIcon className="h-4 w-4" />
    }
  }

  const getStepColor = (type: string) => {
    switch (type) {
      case "data": return "bg-blue-100 text-blue-800"
      case "preprocessing": return "bg-purple-100 text-purple-800"
      case "modeling": return "bg-green-100 text-green-800"
      case "evaluation": return "bg-orange-100 text-orange-800"
      case "deployment": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2Icon className="h-4 w-4 text-green-500" />
      case "running": return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case "pending": return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
      default: return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
    }
  }

  const completedSteps = pipelineSteps.filter(step => step.status === "completed").length
  const totalProgress = (completedSteps / pipelineSteps.length) * 100

  return (
    <div className="space-y-6 h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileTextIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Agent Pipeline Narrative</h2>
            <p className="text-sm text-muted-foreground">Step-by-step explanation of the ML pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-400 hover:bg-blue-400" variant="secondary">
            {completedSteps}/{pipelineSteps.length} completed
          </Badge>
          <Badge className="bg-green-200 text-green-800 hover:bg-green-200">
            {totalProgress.toFixed(0)}% done
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Pipeline Progress</span>
              <span className="text-sm text-muted-foreground">{completedSteps} of {pipelineSteps.length} steps</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Steps */}
      <div className="space-y-4">
        {pipelineSteps.map((step, index) => (
          <Card key={step.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepColor(step.type)}`}>
                      {getStepIcon(step.type)}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-base">{step.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStepColor(step.type)}>
                        {step.type}
                      </Badge>
                      {step.duration && (
                        <Badge variant="outline" className="text-xs">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {step.duration}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(step.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4" />
                  Description
                </h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>

              {/* Reasoning */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <LightbulbIcon className="h-4 w-4" />
                  Agent Reasoning
                </h4>
                <p className="text-sm text-muted-foreground">{step.reasoning}</p>
              </div>

              {/* Code and Output */}
              {step.code && (
                <Tabs defaultValue="code" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="output">Output</TabsTrigger>
                  </TabsList>
                  <TabsContent value="code" className="mt-2">
                    <div className="border border-border rounded-lg overflow-hidden">
                      <SyntaxHighlighter
                        language="python"
                        style={vscDarkPlus}
                        customStyle={{
                          borderRadius: "0",
                          fontSize: "0.875rem",
                          background: "transparent",
                          padding: "1rem"
                        }}
                        showLineNumbers
                        wrapLongLines={false}
                      >
                        {step.code}
                      </SyntaxHighlighter>
                    </div>
                  </TabsContent>
                  {step.output && (
                    <TabsContent value="output" className="mt-2">
                      <div className="bg-black text-green-400 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm font-mono whitespace-pre-wrap">
                          <code>{step.output}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <CheckCircle2Icon className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">Pipeline Complete</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                The ML pipeline has been successfully executed with {completedSteps} steps completed. 
                The final model achieved 95.65% accuracy on the test set and is ready for deployment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
