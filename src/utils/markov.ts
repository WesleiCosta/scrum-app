import { ProjectState, SprintLog, StateProjection, STATE_INDEX_MAP } from '../types';

// Função para calcular a matriz de transição 5x5
export function calculateTransitionMatrix(sprintLogs: SprintLog[]): number[][] {
  // Inicializa matriz 5x5 com zeros
  const matrix: number[][] = Array(5).fill(null).map(() => Array(5).fill(0));
  
  if (sprintLogs.length < 2) {
    return matrix;
  }

  // Ordena logs por data
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

  // Conta transições
  const transitionCounts: number[][] = Array(5).fill(null).map(() => Array(5).fill(0));
  const stateCounts: number[] = Array(5).fill(0);

  for (let i = 0; i < sortedLogs.length - 1; i++) {
    const fromState = stateToIndex(sortedLogs[i].finalState);
    const toState = stateToIndex(sortedLogs[i + 1].finalState);
    
    // Validar se os índices são válidos
    if (fromState >= 0 && fromState < 5 && toState >= 0 && toState < 5) {
      transitionCounts[fromState][toState]++;
      stateCounts[fromState]++;
    } else {
      console.warn('Estado inválido encontrado nos logs:', sortedLogs[i].finalState, sortedLogs[i + 1].finalState);
    }
  }

  // Calcula probabilidades
  for (let i = 0; i < 5; i++) {
    if (stateCounts[i] > 0) {
      for (let j = 0; j < 5; j++) {
        matrix[i][j] = transitionCounts[i][j] / stateCounts[i];
      }
    }
  }

  return matrix;
}

// Função para calcular projeções futuras
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
    return Math.abs(sum - 1) < 0.0001 || sum === 0; // Tolerância para erros de ponto flutuante
  });
}