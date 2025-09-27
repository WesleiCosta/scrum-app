# 🔬 METODOLOGIA SCRUM-MARKOV - ESPECIFICAÇÃO CIENTÍFICA

## 📖 Fundamentação Teórica

### Cadeias de Markov Aplicadas ao Scrum

A **Metodologia Scrum-Markov** é uma abordagem científica que aplica teorias de **Cadeias de Markov** para análise preditiva de projetos ágeis. O modelo trata estados de sprint como variáveis aleatórias discretas em tempo discreto, permitindo previsões estatisticamente fundamentadas sobre a evolução futura do projeto.

#### Base Matemática

```mathematical
Seja X = {X₀, X₁, X₂, ...} uma sequência de sprints onde:
- Xₙ ∈ S = {Saudável, Em Risco, Crítico} representa o estado na sprint n
- P(Xₙ₊₁ = j | X₀ = i₀, X₁ = i₁, ..., Xₙ = i) = P(Xₙ₊₁ = j | Xₙ = i)

Propriedade de Markov: O estado futuro depende apenas do estado atual
```

## 🎯 Mapeamento de Estados

### Estados Originais vs Estados Unificados

O sistema opera com uma transformação de 5 estados originais para 3 estados unificados, otimizando a matriz de transição:

```
Estados Originais (Granulares):    Estados Unificados (Markov):
┌─────────────────┐               ┌─────────────────┐
│ EXCELENTE       │ ─────────────→│ SAUDÁVEL        │
│ BOM             │ ─────────────→│                 │
├─────────────────┤               ├─────────────────┤
│ ESTÁVEL         │ ─────────────→│ EM RISCO        │
│ RISCO           │ ─────────────→│                 │
├─────────────────┤               ├─────────────────┤
│ CRÍTICO         │ ─────────────→│ CRÍTICO         │
└─────────────────┘               └─────────────────┘
```

### Critérios de Mapeamento

#### Algoritmo de Classificação:
```typescript
function mapToUnifiedState(
  originalState: ProjectState, 
  metrics?: PerformanceMetrics
): UnifiedState {
  // Mapeamento base
  const baseMapping = {
    'EXCELENTE': 'Saudável',
    'BOM': 'Saudável',
    'ESTÁVEL': 'Em Risco', 
    'RISCO': 'Em Risco',
    'CRÍTICO': 'Crítico'
  };
  
  let unifiedState = baseMapping[originalState];
  
  // Ajuste por métricas quantitativas
  if (metrics) {
    const riskScore = calculateRiskScore(metrics);
    
    if (riskScore > 0.8) unifiedState = 'Crítico';
    else if (riskScore < 0.3) unifiedState = 'Saudável';
    else unifiedState = 'Em Risco';
  }
  
  return unifiedState;
}

function calculateRiskScore(metrics: PerformanceMetrics): number {
  const {
    velocity,           // 0-1 (performance da equipe)
    burndownAdherence,  // 0-1 (aderência ao burndown)
    impedimentCount,    // 0-N (número de impedimentos)
    teamSatisfaction    // 1-5 (satisfação da equipe)
  } = metrics;
  
  // Função de risco ponderada
  const velocityRisk = 1 - velocity; // Baixa velocity = alto risco
  const burndownRisk = 1 - burndownAdherence;
  const impedimentRisk = Math.min(impedimentCount / 5, 1); // Normalizado
  const satisfactionRisk = (5 - teamSatisfaction) / 4; // Normalizado
  
  // Pesos baseados em evidência empírica
  const riskScore = (
    velocityRisk * 0.3 +
    burndownRisk * 0.25 +
    impedimentRisk * 0.25 + 
    satisfactionRisk * 0.2
  );
  
  return Math.min(Math.max(riskScore, 0), 1);
}
```

## 📊 Matriz de Transição

### Construção da Matriz

A matriz de transição P é uma matriz estocástica 3×3 onde P[i][j] representa a probabilidade de transição do estado i para o estado j.

#### Algoritmo de Construção:

```mathematical
1. Coleta de dados históricos: H = {s₁, s₂, ..., sₙ}
2. Aplicação da janela deslizante: Hᵥ = últimos W estados
3. Contagem de transições: nᵢⱼ = contador(sᵢ → sⱼ)
4. Normalização estocástica: Pᵢⱼ = nᵢⱼ / Σₖ(nᵢₖ)

Onde:
- W = tamanho da janela (windowSize)
- nᵢⱼ = número de transições observadas de i para j
- Σₖ(nᵢₖ) = total de transições saindo do estado i
```

#### Implementação Otimizada:

```typescript
class MarkovChainBuilder {
  private readonly STATES: UnifiedState[] = ['Saudável', 'Em Risco', 'Crítico'];
  
  buildTransitionMatrix(
    stateHistory: UnifiedState[], 
    windowSize: number
  ): TransitionMatrix {
    // Aplicar janela deslizante
    const recentStates = this.applyWindow(stateHistory, windowSize);
    
    // Inicializar matriz de contagem
    const countMatrix = this.initializeMatrix(3, 3, 0);
    const transitions: StateTransition[] = [];
    
    // Contar transições
    for (let i = 0; i < recentStates.length - 1; i++) {
      const fromIndex = this.getStateIndex(recentStates[i]);
      const toIndex = this.getStateIndex(recentStates[i + 1]);
      
      countMatrix[fromIndex][toIndex]++;
      transitions.push({
        from: recentStates[i],
        to: recentStates[i + 1],
        timestamp: new Date(),
        sprintNumber: i + 1
      });
    }
    
    // Normalizar para matriz estocástica
    const probabilityMatrix = this.normalizeMatrix(countMatrix);
    
    // Calcular nível de confiança
    const confidence = this.calculateConfidence(recentStates.length, windowSize);
    
    return {
      states: this.STATES,
      matrix: probabilityMatrix,
      transitions,
      confidence,
      windowSize,
      sampleSize: recentStates.length
    };
  }
  
  private normalizeMatrix(countMatrix: number[][]): number[][] {
    const normalized = this.initializeMatrix(3, 3, 0);
    
    for (let i = 0; i < 3; i++) {
      const rowSum = countMatrix[i].reduce((sum, val) => sum + val, 0);
      
      if (rowSum > 0) {
        for (let j = 0; j < 3; j++) {
          normalized[i][j] = countMatrix[i][j] / rowSum;
        }
      } else {
        // Estado sem transições observadas - distribuição uniforme
        for (let j = 0; j < 3; j++) {
          normalized[i][j] = 1/3;
        }
      }
    }
    
    return normalized;
  }
  
  private calculateConfidence(sampleSize: number, windowSize: number): ConfidenceLevel {
    const completeness = sampleSize / windowSize;
    
    if (completeness >= 1 && sampleSize >= 12) return 'Alta';
    else if (completeness >= 0.6 && sampleSize >= 6) return 'Média';
    else return 'Baixa';
  }
}
```

### Propriedades Matemáticas

#### Verificações de Integridade:

```typescript
class MatrixValidator {
  validateStochasticProperties(matrix: number[][]): ValidationResult {
    const issues: string[] = [];
    
    // 1. Verificar somas das linhas = 1
    for (let i = 0; i < matrix.length; i++) {
      const rowSum = matrix[i].reduce((sum, val) => sum + val, 0);
      if (Math.abs(rowSum - 1) > 1e-10) {
        issues.push(`Linha ${i}: soma = ${rowSum.toFixed(6)} ≠ 1`);
      }
    }
    
    // 2. Verificar valores não-negativos
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j] < 0) {
          issues.push(`P[${i}][${j}] = ${matrix[i][j]} < 0`);
        }
      }
    }
    
    // 3. Verificar irredutibilidade (todos os estados são alcançáveis)
    const isIrreducible = this.checkIrreducibility(matrix);
    if (!isIrreducible) {
      issues.push('Matriz não é irredutível - alguns estados são inacessíveis');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      properties: {
        isStochastic: issues.filter(i => i.includes('soma')).length === 0,
        isNonNegative: issues.filter(i => i.includes('<')).length === 0,
        isIrreducible
      }
    };
  }
  
  private checkIrreducibility(matrix: number[][]): boolean {
    // Implementa busca em grafo para verificar conectividade
    const n = matrix.length;
    const reachable = Array(n).fill(false).map(() => Array(n).fill(false));
    
    // Calcular matriz de alcançabilidade
    for (let i = 0; i < n; i++) {
      this.dfsReachability(matrix, i, reachable[i]);
    }
    
    // Verificar se todos os estados são mutuamente alcançáveis
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (!reachable[i][j]) return false;
      }
    }
    
    return true;
  }
}
```

## 🔮 Sistema Preditivo

### Previsões Multi-Step

O sistema gera previsões para múltiplas sprints futuras usando multiplicação iterativa de matrizes:

```mathematical
Previsão para k steps:
S(n+k) = S(n) × P^k

Onde:
- S(n) = vetor de estado atual [1,0,0] ou [0,1,0] ou [0,0,1]
- P^k = matriz de transição elevada à k-ésima potência
- S(n+k) = distribuição de probabilidade após k steps
```

#### Implementação Eficiente:

```typescript
class MarkovPredictor {
  generatePredictions(
    currentState: UnifiedState,
    transitionMatrix: number[][],
    maxSteps: number = 10
  ): MarkovPrediction[] {
    const stateVector = this.createStateVector(currentState);
    const predictions: MarkovPrediction[] = [];
    
    let currentVector = [...stateVector];
    
    for (let step = 1; step <= maxSteps; step++) {
      // Multiplicação matriz-vetor: v(n+1) = v(n) × P
      currentVector = this.matrixVectorMultiply(currentVector, transitionMatrix);
      
      const prediction: MarkovPrediction = {
        step,
        probabilities: [...currentVector] as [number, number, number],
        mostLikelyState: this.getMostLikelyState(currentVector),
        confidence: Math.max(...currentVector),
        entropy: this.calculateEntropy(currentVector),
        convergenceRate: this.calculateConvergenceRate(currentVector, step)
      };
      
      predictions.push(prediction);
      
      // Critério de parada por convergência
      if (step > 1 && this.hasConverged(predictions[step-2], prediction)) {
        break;
      }
    }
    
    return predictions;
  }
  
  private matrixVectorMultiply(vector: number[], matrix: number[][]): number[] {
    const result = Array(matrix[0].length).fill(0);
    
    for (let j = 0; j < matrix[0].length; j++) {
      for (let i = 0; i < vector.length; i++) {
        result[j] += vector[i] * matrix[i][j];
      }
    }
    
    return result;
  }
  
  private calculateEntropy(probabilities: number[]): number {
    // Entropia de Shannon: H = -Σ(p × log₂(p))
    return probabilities.reduce((entropy, p) => {
      return p > 0 ? entropy - p * Math.log2(p) : entropy;
    }, 0);
  }
  
  private calculateConvergenceRate(probabilities: number[], step: number): number {
    // Taxa de convergência baseada na variância das probabilidades
    const mean = probabilities.reduce((sum, p) => sum + p, 0) / probabilities.length;
    const variance = probabilities.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / probabilities.length;
    
    return Math.exp(-variance * step); // Exponential decay
  }
}
```

### Distribuição de Estado Estacionário

Para projetos de longa duração, o sistema calcula a distribuição estacionária:

```mathematical
π = πP, onde Σπᵢ = 1

Solução: autovetor da transposta de P associado ao autovalor 1
```

```typescript
class StationaryDistributionCalculator {
  calculateSteadyState(transitionMatrix: number[][]): number[] {
    const n = transitionMatrix.length;
    
    // Criar sistema linear: (P^T - I)π = 0
    const A = this.createAugmentedMatrix(transitionMatrix);
    
    // Resolver usando eliminação gaussiana
    const solution = this.gaussianElimination(A);
    
    // Normalizar para que a soma seja 1
    const sum = solution.reduce((acc, val) => acc + val, 0);
    return solution.map(val => val / sum);
  }
  
  private createAugmentedMatrix(P: number[][]): number[][] {
    const n = P.length;
    const A = Array(n + 1).fill(0).map(() => Array(n + 1).fill(0));
    
    // (P^T - I) = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        A[i][j] = P[j][i] - (i === j ? 1 : 0);
      }
    }
    
    // Condição de normalização: Σπᵢ = 1
    for (let j = 0; j < n; j++) {
      A[n][j] = 1;
    }
    A[n][n] = 1;
    
    return A;
  }
}
```

## 🎛️ Análise What-If

### Simulação de Cenários

A análise What-If permite aos usuários modificar a matriz de transição para simular diferentes cenários:

```typescript
class ScenarioAnalyzer {
  compareScenarios(
    baseMatrix: number[][],
    whatIfMatrix: number[][],
    currentState: UnifiedState,
    horizon: number = 10
  ): ScenarioComparison {
    
    const basePredictions = this.predictor.generatePredictions(
      currentState, baseMatrix, horizon
    );
    
    const whatIfPredictions = this.predictor.generatePredictions(
      currentState, whatIfMatrix, horizon
    );
    
    return {
      basePredictions,
      whatIfPredictions,
      improvements: this.identifyImprovements(basePredictions, whatIfPredictions),
      risks: this.identifyRisks(basePredictions, whatIfPredictions),
      metrics: this.calculateComparisonMetrics(basePredictions, whatIfPredictions)
    };
  }
  
  private calculateComparisonMetrics(
    base: MarkovPrediction[], 
    whatIf: MarkovPrediction[]
  ): ComparisonMetrics {
    
    const healthyImprovement = whatIf.reduce((sum, pred, i) => 
      sum + (pred.probabilities[0] - base[i].probabilities[0]), 0
    ) / whatIf.length;
    
    const criticalReduction = whatIf.reduce((sum, pred, i) => 
      sum + (base[i].probabilities[2] - pred.probabilities[2]), 0
    ) / whatIf.length;
    
    const overallRiskReduction = (healthyImprovement + criticalReduction) / 2;
    
    return {
      healthyImprovement: healthyImprovement * 100, // Percentual
      criticalReduction: criticalReduction * 100,
      overallRiskReduction: overallRiskReduction * 100,
      significanceLevel: this.calculateSignificance(base, whatIf)
    };
  }
  
  private calculateSignificance(
    base: MarkovPrediction[], 
    whatIf: MarkovPrediction[]
  ): 'Alto' | 'Médio' | 'Baixo' {
    // Teste t para amostras pareadas
    const differences = base.map((pred, i) => 
      whatIf[i].probabilities[0] - pred.probabilities[0]
    );
    
    const mean = differences.reduce((sum, d) => sum + d, 0) / differences.length;
    const variance = differences.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / differences.length;
    const tStatistic = Math.abs(mean) / Math.sqrt(variance / differences.length);
    
    if (tStatistic > 2.58) return 'Alto';    // p < 0.01
    else if (tStatistic > 1.96) return 'Médio'; // p < 0.05
    else return 'Baixo';                         // p >= 0.05
  }
}
```

## 🚨 Sistema de Alertas

### Algoritmo de Detecção de Anomalias

```typescript
class AnomalyDetector {
  detectAnomalies(
    currentPrediction: MarkovPrediction[],
    historicalBaseline: MarkovPrediction[],
    thresholds: AnomalyThresholds
  ): Alert[] {
    const alerts: Alert[] = [];
    
    // 1. Alerta de Degradação Abrupta
    if (this.detectAbruptDegradation(currentPrediction, thresholds.degradationRate)) {
      alerts.push({
        type: 'CRITICAL_DEGRADATION',
        severity: 'HIGH',
        message: 'Degradação abrupta detectada nas próximas sprints',
        recommendation: 'Implementar ações corretivas imediatas',
        confidence: 0.95
      });
    }
    
    // 2. Alerta de Oscilação Excessiva
    if (this.detectExcessiveOscillation(currentPrediction, thresholds.oscillationThreshold)) {
      alerts.push({
        type: 'UNSTABLE_PATTERN',
        severity: 'MEDIUM',
        message: 'Padrão instável de estados detectado',
        recommendation: 'Revisar processos de gestão de sprint',
        confidence: 0.87
      });
    }
    
    // 3. Alerta de Tendência de Longo Prazo
    const trend = this.calculateTrend(currentPrediction);
    if (trend.slope < -thresholds.trendThreshold) {
      alerts.push({
        type: 'NEGATIVE_TREND',
        severity: 'MEDIUM',
        message: `Tendência negativa detectada (slope: ${trend.slope.toFixed(3)})`,
        recommendation: 'Revisar estratégia de projeto a médio prazo',
        confidence: trend.confidence
      });
    }
    
    return alerts;
  }
  
  private detectAbruptDegradation(
    predictions: MarkovPrediction[], 
    threshold: number
  ): boolean {
    for (let i = 1; i < predictions.length; i++) {
      const prevHealthy = predictions[i-1].probabilities[0];
      const currHealthy = predictions[i].probabilities[0];
      const degradation = (prevHealthy - currHealthy) / prevHealthy;
      
      if (degradation > threshold) return true;
    }
    return false;
  }
  
  private calculateTrend(predictions: MarkovPrediction[]): TrendAnalysis {
    const x = predictions.map((_, i) => i + 1);
    const y = predictions.map(p => p.probabilities[0]); // Foco no estado "Saudável"
    
    // Regressão linear: y = ax + b
    const n = predictions.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Coeficiente de determinação (R²)
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    return {
      slope,
      intercept,
      rSquared,
      confidence: Math.min(rSquared * 1.2, 1) // Ajustar confiança baseado em R²
    };
  }
}
```

## 📐 Validação Estatística

### Testes de Qualidade do Modelo

```typescript
class ModelValidator {
  validateModel(
    historicalData: UnifiedState[],
    transitionMatrix: number[][],
    validationSize: number = 5
  ): ValidationResults {
    
    // Dividir dados em treino e teste
    const trainData = historicalData.slice(0, -validationSize);
    const testData = historicalData.slice(-validationSize);
    
    // Gerar previsões para dados de teste
    const predictions = this.generateValidationPredictions(trainData, testData, transitionMatrix);
    
    // Calcular métricas de performance
    const accuracy = this.calculateAccuracy(predictions, testData);
    const logLikelihood = this.calculateLogLikelihood(predictions, testData);
    const aicScore = this.calculateAIC(logLikelihood, this.getParameterCount(transitionMatrix));
    
    return {
      accuracy,
      logLikelihood,
      aicScore,
      crossValidationScore: this.performCrossValidation(historicalData, 5),
      goodnessOfFit: this.chiSquareTest(predictions, testData)
    };
  }
  
  private calculateLogLikelihood(
    predictions: PredictionWithActual[], 
    actualData: UnifiedState[]
  ): number {
    let logLikelihood = 0;
    
    predictions.forEach((pred, i) => {
      const actualStateIndex = this.getStateIndex(actualData[i]);
      const predictedProbability = pred.probabilities[actualStateIndex];
      
      // Evitar log(0) com smoothing
      const smoothedProbability = Math.max(predictedProbability, 1e-10);
      logLikelihood += Math.log(smoothedProbability);
    });
    
    return logLikelihood;
  }
  
  private calculateAIC(logLikelihood: number, parameterCount: number): number {
    // Akaike Information Criterion: AIC = 2k - 2ln(L)
    return 2 * parameterCount - 2 * logLikelihood;
  }
  
  private performCrossValidation(data: UnifiedState[], folds: number): number {
    const foldSize = Math.floor(data.length / folds);
    let totalAccuracy = 0;
    
    for (let fold = 0; fold < folds; fold++) {
      const testStart = fold * foldSize;
      const testEnd = Math.min(testStart + foldSize, data.length);
      
      const trainData = [
        ...data.slice(0, testStart),
        ...data.slice(testEnd)
      ];
      const testData = data.slice(testStart, testEnd);
      
      if (trainData.length > 3 && testData.length > 0) {
        const foldMatrix = this.buildTransitionMatrix(trainData, trainData.length);
        const foldAccuracy = this.evaluateFold(foldMatrix, testData);
        totalAccuracy += foldAccuracy;
      }
    }
    
    return totalAccuracy / folds;
  }
}
```

## 🔍 Métricas de Performance

### KPIs do Sistema

```typescript
interface SystemMetrics {
  // Métricas Estatísticas
  matrixStability: number;        // Variação da matriz ao longo do tempo
  predictionAccuracy: number;     // Precisão das previsões
  modelConfidence: number;        // Confiança geral do modelo
  
  // Métricas de Negócio
  riskReduction: number;          // Redução de risco através de ações
  decisionSupport: number;        // Suporte à tomada de decisão
  preventiveMeasures: number;     // Eficácia das medidas preventivas
  
  // Métricas Técnicas
  computationTime: number;        // Tempo de cálculo das previsões
  memoryUsage: number;           // Uso de memória do sistema
  dataQuality: number;           // Qualidade dos dados históricos
}

class MetricsCalculator {
  calculateSystemMetrics(
    project: Project,
    historicalMatrices: TransitionMatrix[],
    performance: PerformanceData
  ): SystemMetrics {
    
    return {
      matrixStability: this.calculateMatrixStability(historicalMatrices),
      predictionAccuracy: this.calculatePredictionAccuracy(performance.predictions),
      modelConfidence: this.calculateModelConfidence(project, historicalMatrices),
      
      riskReduction: this.calculateRiskReduction(performance.interventions),
      decisionSupport: this.calculateDecisionSupport(performance.decisions),
      preventiveMeasures: this.calculatePreventiveEffectiveness(performance.measures),
      
      computationTime: performance.computationTime,
      memoryUsage: performance.memoryUsage,
      dataQuality: this.calculateDataQuality(project.sprintLogs)
    };
  }
  
  private calculateMatrixStability(matrices: TransitionMatrix[]): number {
    if (matrices.length < 2) return 1;
    
    let totalVariation = 0;
    for (let i = 1; i < matrices.length; i++) {
      const variation = this.matrixFrobeniusDistance(
        matrices[i-1].matrix, 
        matrices[i].matrix
      );
      totalVariation += variation;
    }
    
    const avgVariation = totalVariation / (matrices.length - 1);
    return Math.max(0, 1 - avgVariation); // Estabilidade = 1 - variação
  }
  
  private matrixFrobeniusDistance(A: number[][], B: number[][]): number {
    let sum = 0;
    for (let i = 0; i < A.length; i++) {
      for (let j = 0; j < A[i].length; j++) {
        sum += Math.pow(A[i][j] - B[i][j], 2);
      }
    }
    return Math.sqrt(sum);
  }
}
```

## 📊 Relatórios Científicos

### Geração de Relatórios Técnicos

```typescript
class ScientificReportGenerator {
  generateTechnicalReport(project: Project): ScientificReport {
    const analysis = this.performComprehensiveAnalysis(project);
    
    return {
      executiveSummary: this.generateExecutiveSummary(analysis),
      methodologySection: this.generateMethodologySection(),
      statisticalAnalysis: this.generateStatisticalAnalysis(analysis),
      findings: this.generateFindings(analysis),
      recommendations: this.generateRecommendations(analysis),
      appendices: {
        rawData: analysis.rawData,
        matrixCalculations: analysis.matrices,
        validationResults: analysis.validation
      }
    };
  }
  
  private generateStatisticalAnalysis(analysis: ComprehensiveAnalysis): StatisticalSection {
    return {
      sampleSize: analysis.sampleSize,
      confidenceIntervals: this.calculateConfidenceIntervals(analysis),
      hypothesisTests: this.performHypothesisTests(analysis),
      correlationAnalysis: this.performCorrelationAnalysis(analysis),
      regressionAnalysis: this.performRegressionAnalysis(analysis)
    };
  }
  
  private calculateConfidenceIntervals(analysis: ComprehensiveAnalysis): ConfidenceInterval[] {
    return analysis.predictions.map((pred, step) => {
      const se = this.calculateStandardError(pred, analysis.sampleSize);
      const margin = 1.96 * se; // 95% CI
      
      return {
        step: step + 1,
        state: 'Saudável',
        pointEstimate: pred.probabilities[0],
        lowerBound: Math.max(0, pred.probabilities[0] - margin),
        upperBound: Math.min(1, pred.probabilities[0] + margin),
        confidenceLevel: 0.95
      };
    });
  }
}
```

---

## 📚 Bibliografia & Referências

### Fundamentação Acadêmica

1. **Norris, J.R.** (1997). *Markov Chains*. Cambridge University Press.
2. **Ross, S.M.** (2014). *Introduction to Probability Models*. Academic Press.
3. **Stewart, W.J.** (1994). *Introduction to the Numerical Solution of Markov Chains*. Princeton University Press.

### Aplicações em Engenharia de Software

4. **Goseva-Popstojanova, K.** (2003). "Architecture-based approach to reliability assessment of software systems." *Performance Evaluation*, 45(2-3), 179-204.
5. **Trivedi, K.S.** (2001). *Probability and Statistics with Reliability, Queuing, and Computer Science Applications*. John Wiley & Sons.

### Metodologias Ágeis

6. **Beck, K. et al.** (2001). *Manifesto for Agile Software Development*.
7. **Schwaber, K. & Sutherland, J.** (2020). *The Scrum Guide*.

---

**Desenvolvido com rigor científico pela equipe Scrum-Markov**  
**Baseado em evidências empíricas e fundamentação matemática sólida**  
**Versão da Metodologia:** 1.0  
**Data:** 27 de Setembro de 2025