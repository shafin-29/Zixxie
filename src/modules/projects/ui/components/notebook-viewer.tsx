'use client'

import { Fragment } from "@prisma/client"
import { useState, useMemo } from "react"
import { 
  BookOpenIcon, 
  CodeIcon,
  PlayIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  CheckIcon,
  ClockIcon,
  RotateCcwIcon,
  Trash2Icon,
  MoreVerticalIcon,
  DownloadIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface Props {
  data: Fragment
}

interface NotebookCell {
  id: string
  type: 'markdown' | 'code'
  content: string
  output?: string
  execution_time?: number
  status: 'idle' | 'running' | 'completed' | 'error'
  collapsed: boolean
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

export function NotebookViewer({ data }: Props) {
  // Mock notebook cells - in real implementation, this would come from the agent
  const [notebookCells, setNotebookCells] = useState<NotebookCell[]>([
    {
      id: "1",
      type: "markdown",
      content: `# Iris Classification Project

This notebook demonstrates the complete machine learning pipeline for classifying Iris flowers using various ML algorithms.

## Project Overview
- **Dataset**: Iris dataset (150 samples, 4 features, 3 classes)
- **Task**: Multi-class classification
- **Algorithms**: Random Forest, SVM, Logistic Regression
- **Goal**: Build an accurate and interpretable classification model

## Pipeline Steps
1. Data Loading and Exploration
2. Data Preprocessing
3. Model Training and Evaluation
4. Final Model Selection`,
      status: "completed",
      collapsed: false
    },
    {
      id: "2",
      type: "code",
      content: `# Import required libraries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

# Set random seed for reproducibility
np.random.seed(42)

print("Libraries imported successfully!")`,
      output: "Libraries imported successfully!",
      execution_time: 1.2,
      status: "completed",
      collapsed: false
    },
    {
      id: "3",
      type: "code",
      content: `# Load and explore the dataset
iris = load_iris()
X = pd.DataFrame(iris.data, columns=iris.feature_names)
y = pd.Series(iris.target)

# Display basic information about the dataset
print("Dataset Shape:", X.shape)
print("\\nFeature Names:", iris.feature_names)
print("\\nTarget Classes:", iris.target_names)
print("\\nFirst 5 rows:")
print(X.head())`,
      output: "Dataset Shape: (150, 4)\n\nFeature Names: ['sepal length (cm)', 'sepal width (cm)', 'petal length (cm)', 'petal width (cm)']\n\nTarget Classes: ['setosa' 'versicolor' 'virginica']\n\nFirst 5 rows:\n   sepal length (cm)  sepal width (cm)  petal length (cm)  petal width (cm)\n0                5.1               3.5                1.4               0.2\n1                4.9               3.0                1.4               0.2\n2                4.7               3.2                1.3               0.2\n3                4.6               3.1                1.5               0.2\n4                5.0               3.6                1.4               0.2",
      execution_time: 0.8,
      status: "completed",
      collapsed: false
    },
    {
      id: "4",
      type: "markdown",
      content: `## Data Visualization

Let's visualize the dataset to understand the relationships between features and target classes.`,
      status: "completed",
      collapsed: false
    },
    {
      id: "5",
      type: "code",
      content: `# Create visualizations
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Pair plot
sns.scatterplot(data=X, x='sepal length (cm)', y='sepal width (cm)', hue=y, palette='viridis', ax=axes[0,0])
axes[0,0].set_title('Sepal Length vs Sepal Width')
axes[0,0].legend(iris.target_names)

sns.scatterplot(data=X, x='petal length (cm)', y='petal width (cm)', hue=y, palette='viridis', ax=axes[0,1])
axes[0,1].set_title('Petal Length vs Petal Width')
axes[0,1].legend(iris.target_names)

# Distribution plots
sns.histplot(data=X, x='sepal length (cm)', hue=y, multiple='stack', palette='viridis', ax=axes[1,0])
axes[1,0].set_title('Sepal Length Distribution')

sns.histplot(data=X, x='petal length (cm)', hue=y, multiple='stack', palette='viridis', ax=axes[1,1])
axes[1,1].set_title('Petal Length Distribution')

plt.tight_layout()
plt.show()`,
      output: "[matplotlib plot displayed]",
      execution_time: 2.3,
      status: "completed",
      collapsed: false
    },
    {
      id: "6",
      type: "markdown",
      content: `## Data Preprocessing

Now we'll preprocess the data by scaling features and splitting into train/test sets.`,
      status: "completed",
      collapsed: false
    },
    {
      id: "7",
      type: "code",
      content: `# Data preprocessing
# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Scale the features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"Training set shape: {X_train_scaled.shape}")
print(f"Test set shape: {X_test_scaled.shape}")
print(f"Training set class distribution: {np.bincount(y_train)}")
print(f"Test set class distribution: {np.bincount(y_test)}")`,
      output: "Training set shape: (120, 4)\nTest set shape: (30, 4)\nTraining set class distribution: [40 40 40]\nTest set class distribution: [10 10 10]",
      execution_time: 0.5,
      status: "completed",
      collapsed: false
    },
    {
      id: "8",
      type: "code",
      content: `# Initialize models
models = {
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'SVM': SVC(random_state=42),
    'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000)
}

# Train and evaluate models
results = {}
for name, model in models.items():
    # Train the model
    model.fit(X_train_scaled, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test_scaled)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)
    
    results[name] = {
        'model': model,
        'accuracy': accuracy,
        'predictions': y_pred
    }
    
    print(f"{name} - Accuracy: {accuracy:.4f}")

# Find the best model
best_model_name = max(results.keys(), key=lambda x: results[x]['accuracy'])
best_model = results[best_model_name]['model']
print(f"\\nBest model: {best_model_name} with accuracy: {results[best_model_name]['accuracy']:.4f}")`,
      output: "Random Forest - Accuracy: 1.0000\nSVM - Accuracy: 0.9667\nLogistic Regression - Accuracy: 0.9667\n\nBest model: Random Forest with accuracy: 1.0000",
      execution_time: 1.8,
      status: "completed",
      collapsed: false
    },
    {
      id: "9",
      type: "code",
      content: `# Detailed evaluation of the best model
best_predictions = results[best_model_name]['predictions']

# Classification report
print("Classification Report:")
print(classification_report(y_test, best_predictions, target_names=iris.target_names))

# Confusion matrix
cm = confusion_matrix(y_test, best_predictions)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=iris.target_names, 
            yticklabels=iris.target_names)
plt.title('Confusion Matrix')
plt.ylabel('True Label')
plt.xlabel('Predicted Label')
plt.show()`,
      output: "Classification Report:\n              precision    recall  f1-score   support\n\n      setosa       1.00      1.00      1.00        10\n  versicolor       1.00      1.00      1.00        10\n   virginica       1.00      1.00      1.00        10\n\n    accuracy                           1.00        30\n   macro avg       1.00      1.00      1.00        30\nweighted avg       1.00      1.00      1.00        30\n\n[confusion matrix plot displayed]",
      execution_time: 1.1,
      status: "completed",
      collapsed: false
    },
    {
      id: "10",
      type: "markdown",
      content: `## Conclusion

The Random Forest classifier achieved perfect accuracy (100%) on the test set. This excellent performance is due to:

1. **Clean Dataset**: The Iris dataset is well-structured and noise-free
2. **Distinct Classes**: The three Iris species have clear separations in feature space
3. **Powerful Algorithm**: Random Forest can capture complex non-linear relationships

### Model Performance Summary
- **Random Forest**: 100% accuracy (best performer)
- **SVM**: 96.67% accuracy  
- **Logistic Regression**: 96.67% accuracy

The model is ready for deployment and can accurately classify Iris flowers based on their sepal and petal measurements.`,
      status: "completed",
      collapsed: false
    }
  ])

  const [copiedCellId, setCopiedCellId] = useState<string | null>(null)

  // Download notebook function
  const handleDownloadNotebook = () => {
    // Convert notebook cells to Jupyter notebook format
    const notebookData = {
      cells: notebookCells.map((cell: NotebookCell) => ({
        cell_type: cell.type === 'markdown' ? 'markdown' : 'code',
        source: cell.content,
        metadata: {},
        execution_count: cell.type === 'code' ? 1 : null,
        outputs: cell.type === 'code' && cell.output ? [cell.output] : []
      })),
      metadata: {
        kernelspec: {
          display_name: "Python 3",
          language: "python",
          name: "python3"
        },
        language_info: {
          name: "python",
          version: "3.8.5"
        },
        title: data.title,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        total_cells: notebookCells.length,
        completed_cells: completedCells
      },
      nbformat: 4,
      nbformat_minor: 4
    }
    
    const blob = new Blob([JSON.stringify(notebookData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${data.title.replace(/\s+/g, '_')}_notebook.ipynb`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const toggleCellCollapse = (cellId: string) => {
    setNotebookCells(prev => 
      prev.map(cell => 
        cell.id === cellId 
          ? { ...cell, collapsed: !cell.collapsed }
          : cell
      )
    )
  }

  const copyCellContent = async (cellId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedCellId(cellId)
      setTimeout(() => setCopiedCellId(null), 2000)
    } catch (err) {
      console.error('Failed to copy content:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "running": return "bg-blue-100 text-blue-800"
      case "error": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckIcon className="h-3 w-3" />
      case "running": return <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case "error": return <div className="h-3 w-3 bg-red-500 rounded-full" />
      default: return <div className="h-3 w-3 bg-gray-300 rounded-full" />
    }
  }

  const completedCells = notebookCells.filter(cell => cell.status === "completed").length
  const totalCells = notebookCells.length
  const progress = (completedCells / totalCells) * 100

  return (
    <div className="space-y-4 h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpenIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Execution Notebook</h2>
            <p className="text-sm text-muted-foreground">Interactive notebook with complete ML pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-400 hover:bg-blue-400" variant="secondary">
            {completedCells}/{totalCells} cells
          </Badge>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            {progress.toFixed(0)}% completed
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadNotebook}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download Notebook
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Notebook Progress</span>
              <span className="text-sm text-muted-foreground">{completedCells} of {totalCells} cells executed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notebook Cells */}
      <div className="space-y-4">
        {notebookCells.map((cell, index) => (
          <Card key={cell.id} className="relative">
            <CardContent className="p-0">
              {/* Cell Header */}
              <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCellCollapse(cell.id)}
                      className="p-1 h-6 w-6"
                    >
                      {cell.collapsed ? (
                        <ChevronRightIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {cell.type === "code" ? (
                      <CodeIcon className="h-4 w-4 text-blue-500" />
                    ) : (
                      <BookOpenIcon className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-sm font-medium capitalize">{cell.type}</span>
                    <Badge className={getStatusColor(cell.status)}>
                      {getStatusIcon(cell.status)}
                      <span className="ml-1">{cell.status}</span>
                    </Badge>
                    {cell.execution_time && (
                      <Badge variant="outline" className="text-xs">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {cell.execution_time}s
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cell.type === "code" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCellContent(cell.id, cell.content)}
                      className="p-1 h-6 w-6"
                    >
                      {copiedCellId === cell.id ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Cell Content */}
              {!cell.collapsed && (
                <div className="p-4 space-y-4">
                  {cell.type === "markdown" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="text-sm text-foreground leading-relaxed">
                        {cell.content.split('\n').map((line, i) => (
                          <div key={i}>
                            {line.startsWith('#') ? (
                              <div className={`font-bold ${line.startsWith('##') ? 'text-lg mt-4 mb-2' : 'text-xl mt-6 mb-3'}`}>
                                {line.replace(/#/g, '').trim()}
                              </div>
                            ) : line.startsWith('-') ? (
                              <div className="ml-4 flex items-center gap-2">
                                <span className="text-primary">•</span>
                                <span>{line.replace('-', '').trim()}</span>
                              </div>
                            ) : line.startsWith('**') ? (
                              <div className="font-semibold inline">{line.replace(/\*\*/g, '')}</div>
                            ) : (
                              <div className="mb-2">{line}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Code Cell */}
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
                          {cell.content}
                        </SyntaxHighlighter>
                      </div>
                      
                      {/* Output */}
                      {cell.output && (
                        <div className="bg-black text-green-400 p-4 rounded-lg overflow-x-auto">
                          <div className="text-xs text-gray-400 mb-2">Output:</div>
                          <pre className="text-sm font-mono whitespace-pre-wrap">
                            <code>{cell.output}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <BookOpenIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Notebook Complete</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                This notebook demonstrates a complete machine learning pipeline from data loading to model evaluation. 
                All {totalCells} cells have been successfully executed with the models achieving excellent performance on the dataset.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
