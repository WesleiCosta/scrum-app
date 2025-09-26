import { ProjectState, SprintLog, StateProjection, STATE_INDEX_MAP } from '../types';

// Tipo para informações detalhadas da matriz
export interface MatrixInfo {
  matrix: number[][];
  transitionCounts: number[][];
  stateCounts: number[];
  totalTransitions: number;
}

// Função para calcular a matriz de transição 5x5
export function calculateTransitionMatrix(sprintLogs: SprintLog[]): number[][] {
  const matrixInfo = calculateTransitionMatrixDetailed(sprintLogs);
  return matrixInfo.matrix;
}

// Função para calcular a matriz de transição com informações detalhadas (RF-04)
export function calculateTransitionMatrixDetailed(sprintLogs: SprintLog[]): MatrixInfo {
  // Inicializa estruturas de dados
  const matrix: number[][] = Array(5).fill(null).map(() => Array(5).fill(0));
  const transitionCounts: number[][] = Array(5).fill(null).map(() => Array(5).fill(0));
  const stateCounts: number[] = Array(5).fill(0);
  let totalTransitions = 0;
  
  if (sprintLogs.length < 2) {
    return { matrix, transitionCounts, stateCounts, totalTransitions };
  }

  // Ordena logs por data para garantir sequência correta
  const sortedLogs = [...sprintLogs].sort((a, b) => 
    new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  );

  // Mapeia estados para índices usando constante do tipo
  const stateToIndex = (state: ProjectState): number => {
    const index = STATE_INDEX_MAP[state];
    if (index === undefined) {
      console.warn('Estado desconhecido:', state);
      return -1; // Índice inválido
    }
    return index;
  };

  // RF-04: Conta todas as transições observadas
  for (let i = 0; i < sortedLogs.length - 1; i++) {
    const fromState = stateToIndex(sortedLogs[i].finalState);
    const toState = stateToIndex(sortedLogs[i + 1].finalState);
    
    // Validar se os índices são válidos
    if (fromState >= 0 && fromState < 5 && toState >= 0 && toState < 5) {
      transitionCounts[fromState][toState]++;
      stateCounts[fromState]++;
      totalTransitions++;
    } else {
      console.warn('Estado inválido encontrado nos logs:', sortedLogs[i].finalState, sortedLogs[i + 1].finalState);
    }
  }

  // RF-04: Calcula probabilidades usando a fórmula Pij = (transições i→j) / (total de transições de i)
  for (let i = 0; i < 5; i++) {
    if (stateCounts[i] > 0) {
      for (let j = 0; j < 5; j++) {
        matrix[i][j] = transitionCounts[i][j] / stateCounts[i];
      }
    }
    // RF-04: Se um estado nunca ocorreu, probabilidade é 0 (divisão por zero tratada)
  }

  return { matrix, transitionCounts, stateCounts, totalTransitions };
}

// RF-05: Função para calcular projeções de 3 sprints usando fórmula Sn+1 = Sn × P
export function calculateProjections(
  currentState: ProjectState, 
  transitionMatrix: number[][], 
  numSprints: number = 3
): StateProjection[] {
  const projections: StateProjection[] = [];
  
  // Validações de entrada
  if (!currentState || !transitionMatrix || numSprints <= 0) {
    return projections;
  }
  
  // Verificar se a matriz tem o tamanho correto
  if (transitionMatrix.length !== 5 || !transitionMatrix.every(row => row.length === 5)) {
    console.warn('Matriz de transição com dimensões incorretas');
    return projections;
  }
  
  // Vetor de estado atual (one-hot encoding)
  let currentVector: number[] = Array(5).fill(0);
  const currentIndex = STATE_INDEX_MAP[currentState];
  
  // Validar se o estado atual é válido
  if (currentIndex === undefined || currentIndex < 0 || currentIndex >= 5) {
    console.warn('Estado atual inválido:', currentState);
    return projections;
  }
  
  currentVector[currentIndex] = 1;

  for (let sprint = 1; sprint <= numSprints; sprint++) {
    // Multiplica vetor atual pela matriz de transição
    const nextVector: number[] = Array(5).fill(0);
    
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        nextVector[j] += currentVector[i] * transitionMatrix[i][j];
      }
    }

    // Cria projeção para este sprint
    const projection: StateProjection = {
      sprint: `S+${sprint}`,
      probabilities: {
        EXCELENTE: nextVector[0],
        BOM: nextVector[1],
        ESTÁVEL: nextVector[2],
        RISCO: nextVector[3],
        CRÍTICO: nextVector[4]
      }
    };

    projections.push(projection);
    currentVector = nextVector;
  }

  return projections;
}

// Função para multiplicar matrizes (para cálculos avançados)
export function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  const rows = a.length;
  const cols = b[0].length;
  const result: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      for (let k = 0; k < a[0].length; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return result;
}

// Função para formatar probabilidades como percentual
export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

// Função para obter o estado mais provável
export function getMostLikelyState(probabilities: StateProjection['probabilities']): ProjectState {
  if (!probabilities || typeof probabilities !== 'object') {
    return 'ESTÁVEL'; // Estado padrão se não há dados
  }

  let maxProb = -1;
  let mostLikelyState: ProjectState = 'ESTÁVEL';

  // Validar que o objeto contém pelo menos uma propriedade válida
  const validStates = ['CRÍTICO', 'RISCO', 'ESTÁVEL', 'BOM', 'EXCELENTE'];
  
  Object.entries(probabilities).forEach(([state, prob]) => {
    if (validStates.includes(state) && typeof prob === 'number' && !isNaN(prob) && prob >= 0 && prob <= 1 && prob > maxProb) {
      maxProb = prob;
      mostLikelyState = state as ProjectState;
    }
  });

  // Se não encontrou nenhuma probabilidade válida, retorna estado padrão
  if (maxProb < 0) {
    return 'ESTÁVEL';
  }

  return mostLikelyState;
}

// Função para calcular entropia (medida de incerteza)
export function calculateEntropy(probabilities: StateProjection['probabilities']): number {
  let entropy = 0;
  
  Object.values(probabilities).forEach(prob => {
    if (prob > 0) {
      entropy -= prob * Math.log2(prob);
    }
  });

  return entropy;
}

// Função para validar se a matriz é estocástica (linhas somam 1)
export function isValidTransitionMatrix(matrix: number[][]): boolean {
  return matrix.every(row => {
    const sum = row.reduce((acc, val) => acc + val, 0);
    return Math.abs(sum - 1) < 0.001 || sum === 0; // Tolerância padronizada: 0.001
  });
}

// RF-05: Função para obter nomes dos estados na ordem da matriz
export function getStateNames(): string[] {
  return ['EXCELENTE', 'BOM', 'ESTÁVEL', 'RISCO', 'CRÍTICO'];
}

// RF-05: Função para identificar estados de maior risco (P4 e P5)
export function getHighRiskStates(): string[] {
  return ['RISCO', 'CRÍTICO'];
}

// RF-05: Função para calcular as projeções completas para 3 sprints
export interface ProjectionData {
  current: { [state: string]: number };
  sprint1: { [state: string]: number };
  sprint2: { [state: string]: number };
  sprint3: { [state: string]: number };
}

export function calculateProjectionData(currentState: ProjectState, matrix: number[][]): ProjectionData {
  const states = getStateNames();
  
  // Estado atual (one-hot)
  const current: { [state: string]: number } = {};
  states.forEach(state => {
    current[state] = state === currentState ? 1 : 0;
  });
  
  // Calcular projeções usando fórmula Sn+1 = Sn × P
  let currentVector = states.map(state => current[state]);
  
  // Sprint +1
  const sprint1Vector = multiplyVectorMatrix(currentVector, matrix);
  const sprint1: { [state: string]: number } = {};
  states.forEach((state, i) => {
    sprint1[state] = sprint1Vector[i];
  });
  
  // Sprint +2
  const sprint2Vector = multiplyVectorMatrix(sprint1Vector, matrix);
  const sprint2: { [state: string]: number } = {};
  states.forEach((state, i) => {
    sprint2[state] = sprint2Vector[i];
  });
  
  // Sprint +3
  const sprint3Vector = multiplyVectorMatrix(sprint2Vector, matrix);
  const sprint3: { [state: string]: number } = {};
  states.forEach((state, i) => {
    sprint3[state] = sprint3Vector[i];
  });
  
  return { current, sprint1, sprint2, sprint3 };
}

// Função auxiliar para multiplicar vetor por matriz
function multiplyVectorMatrix(vector: number[], matrix: number[][]): number[] {
  const result = Array(5).fill(0);
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      result[j] += vector[i] * matrix[i][j];
    }
  }
  return result;
}