# 🧪 GUIA DE TESTES - SCRUM-MARKOV APP

## 🎯 Estratégia de Testes

### Pirâmide de Testes

```
        ┌─────────────────┐
        │   E2E Tests     │ ← Poucos, mas críticos
        │    (10%)        │
        ├─────────────────┤
        │ Integration     │ ← Testes de integração
        │   Tests (20%)   │   entre componentes
        ├─────────────────┤
        │   Unit Tests    │ ← Maioria dos testes
        │    (70%)        │   Funções e hooks
        └─────────────────┘
```

### Cobertura de Testes Target

- **Unit Tests**: 85%+ cobertura de código
- **Integration Tests**: 70%+ fluxos principais
- **E2E Tests**: 100% user journeys críticos

## ⚙️ Configuração do Ambiente de Testes

### Vitest Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 85,
          statements: 85
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@test': path.resolve(__dirname, './src/test')
    }
  }
});
```

### Test Setup

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Cleanup após cada teste
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock console para testes limpos
beforeAll(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});
```

### Test Utilities

```typescript
// src/test/utils.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { SprintProvider } from '@/contexts/SprintContext';

// Provider personalizado para testes
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <SprintProvider>
            {children}
          </SprintProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Render customizado com providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock factories
export const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'test-project-1',
  name: 'Test Project',
  description: 'A test project for unit tests',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  sprints: [],
  teamSize: 5,
  ...overrides,
});

export const createMockSprint = (overrides: Partial<Sprint> = {}): Sprint => ({
  id: 'test-sprint-1',
  projectId: 'test-project-1',
  name: 'Sprint 1',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-14'),
  plannedPoints: 50,
  completedPoints: 40,
  state: UnifiedState.HEALTHY,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockMarkovAnalysis = (overrides: Partial<MarkovAnalysis> = {}): MarkovAnalysis => ({
  transitionMatrix: [
    [0.7, 0.2, 0.1],
    [0.3, 0.5, 0.2],
    [0.1, 0.3, 0.6]
  ],
  steadyStateDistribution: [0.4, 0.35, 0.25],
  predictions: {
    next3Sprints: [UnifiedState.HEALTHY, UnifiedState.HEALTHY, UnifiedState.AT_RISK],
    riskProbability: 0.25,
    healthProbability: 0.4,
    criticalProbability: 0.35
  },
  confidence: 0.85,
  ...overrides,
});

// Test data generators
export const generateSprintHistory = (count: number): Sprint[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockSprint({
      id: `sprint-${i + 1}`,
      name: `Sprint ${i + 1}`,
      startDate: new Date(2024, 0, 1 + (i * 14)),
      endDate: new Date(2024, 0, 14 + (i * 14)),
      state: i % 3 === 0 ? UnifiedState.AT_RISK : UnifiedState.HEALTHY
    })
  );
};

// Re-export tudo do testing-library
export * from '@testing-library/react';
export { customRender as render };
export { vi } from 'vitest';
```

## 🧩 Unit Tests

### Testing React Components

```typescript
// src/components/StateIndicator/StateIndicator.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@test/utils';
import { StateIndicator } from './StateIndicator';
import { UnifiedState } from '@types/index';

describe('StateIndicator', () => {
  it('renders healthy state correctly', () => {
    render(<StateIndicator state={UnifiedState.HEALTHY} />);
    
    const indicator = screen.getByTestId('state-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('bg-green-100', 'text-green-800');
    expect(screen.getByText('Saudável')).toBeInTheDocument();
  });

  it('renders at-risk state correctly', () => {
    render(<StateIndicator state={UnifiedState.AT_RISK} />);
    
    const indicator = screen.getByTestId('state-indicator');
    expect(indicator).toHaveClass('bg-yellow-100', 'text-yellow-800');
    expect(screen.getByText('Em Risco')).toBeInTheDocument();
  });

  it('renders critical state correctly', () => {
    render(<StateIndicator state={UnifiedState.CRITICAL} />);
    
    const indicator = screen.getByTestId('state-indicator');
    expect(indicator).toHaveClass('bg-red-100', 'text-red-800');
    expect(screen.getByText('Crítico')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(
      <StateIndicator 
        state={UnifiedState.HEALTHY} 
        className="custom-class" 
      />
    );
    
    const indicator = screen.getByTestId('state-indicator');
    expect(indicator).toHaveClass('custom-class');
  });

  it('shows tooltip on hover when showTooltip is true', async () => {
    const { user } = render(
      <StateIndicator 
        state={UnifiedState.HEALTHY} 
        showTooltip={true} 
      />
    );
    
    const indicator = screen.getByTestId('state-indicator');
    await user.hover(indicator);
    
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
  });
});
```

### Testing Custom Hooks

```typescript
// src/hooks/useMarkovAnalysis/useMarkovAnalysis.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMarkovAnalysis } from './useMarkovAnalysis';
import { generateSprintHistory, createMockProject } from '@test/utils';
import * as markovUtils from '@utils/markov';

// Mock markov utilities
vi.mock('@utils/markov');

describe('useMarkovAnalysis', () => {
  const mockMarkovUtils = vi.mocked(markovUtils);
  const mockProject = createMockProject();
  const mockSprintHistory = generateSprintHistory(10);

  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkovUtils.calculateTransitionMatrix.mockReturnValue([
      [0.7, 0.2, 0.1],
      [0.3, 0.5, 0.2],
      [0.1, 0.3, 0.6]
    ]);
    mockMarkovUtils.calculateSteadyState.mockReturnValue([0.4, 0.35, 0.25]);
    mockMarkovUtils.predictNextStates.mockReturnValue({
      next3Sprints: [UnifiedState.HEALTHY, UnifiedState.HEALTHY, UnifiedState.AT_RISK],
      riskProbability: 0.25,
      healthProbability: 0.4,
      criticalProbability: 0.35
    });
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => 
      useMarkovAnalysis(mockProject, mockSprintHistory)
    );

    expect(result.current.analysis).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('performs analysis when analyze is called', async () => {
    const { result } = renderHook(() => 
      useMarkovAnalysis(mockProject, mockSprintHistory)
    );

    result.current.analyze();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analysis).not.toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockMarkovUtils.calculateTransitionMatrix).toHaveBeenCalledWith(mockSprintHistory);
  });

  it('handles errors during analysis', async () => {
    mockMarkovUtils.calculateTransitionMatrix.mockImplementation(() => {
      throw new Error('Analysis failed');
    });

    const { result } = renderHook(() => 
      useMarkovAnalysis(mockProject, mockSprintHistory)
    );

    result.current.analyze();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analysis).toBeNull();
    expect(result.current.error).toBe('Analysis failed');
  });

  it('does not analyze with insufficient data', async () => {
    const shortHistory = generateSprintHistory(2);
    
    const { result } = renderHook(() => 
      useMarkovAnalysis(mockProject, shortHistory)
    );

    result.current.analyze();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Histórico insuficiente para análise (mínimo: 3 sprints)');
  });

  it('clears analysis when clearAnalysis is called', async () => {
    const { result } = renderHook(() => 
      useMarkovAnalysis(mockProject, mockSprintHistory)
    );

    // Perform analysis first
    result.current.analyze();
    await waitFor(() => expect(result.current.analysis).not.toBeNull());

    // Clear analysis
    result.current.clearAnalysis();

    expect(result.current.analysis).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
```

### Testing Utility Functions

```typescript
// src/utils/markov/markov.test.ts
import { describe, it, expect } from 'vitest';
import { 
  calculateTransitionMatrix, 
  calculateSteadyState,
  predictNextStates,
  validateTransitionMatrix 
} from './markov';
import { UnifiedState } from '@types/index';
import { generateSprintHistory } from '@test/utils';

describe('Markov Analysis Utilities', () => {
  describe('calculateTransitionMatrix', () => {
    it('calculates correct transition matrix for simple case', () => {
      const sprints = [
        { state: UnifiedState.HEALTHY },
        { state: UnifiedState.HEALTHY },
        { state: UnifiedState.AT_RISK },
        { state: UnifiedState.HEALTHY }
      ] as Sprint[];

      const matrix = calculateTransitionMatrix(sprints);

      // From HEALTHY to HEALTHY: 1/2 = 0.5
      // From HEALTHY to AT_RISK: 1/2 = 0.5
      // From AT_RISK to HEALTHY: 1/1 = 1.0
      expect(matrix[0][0]).toBeCloseTo(0.5, 2);
      expect(matrix[0][1]).toBeCloseTo(0.5, 2);
      expect(matrix[1][0]).toBeCloseTo(1.0, 2);
    });

    it('handles edge case with single state', () => {
      const sprints = [
        { state: UnifiedState.HEALTHY },
        { state: UnifiedState.HEALTHY },
        { state: UnifiedState.HEALTHY }
      ] as Sprint[];

      const matrix = calculateTransitionMatrix(sprints);

      expect(matrix[0][0]).toBe(1.0);
      expect(matrix[0][1]).toBe(0.0);
      expect(matrix[0][2]).toBe(0.0);
    });

    it('normalizes rows to sum to 1', () => {
      const sprints = generateSprintHistory(20);
      const matrix = calculateTransitionMatrix(sprints);

      matrix.forEach(row => {
        const sum = row.reduce((acc, val) => acc + val, 0);
        expect(sum).toBeCloseTo(1.0, 5);
      });
    });

    it('throws error for insufficient data', () => {
      const sprints = [{ state: UnifiedState.HEALTHY }] as Sprint[];
      
      expect(() => calculateTransitionMatrix(sprints))
        .toThrow('Histórico insuficiente');
    });
  });

  describe('calculateSteadyState', () => {
    it('calculates steady state for simple matrix', () => {
      const matrix = [
        [0.5, 0.5, 0.0],
        [0.25, 0.5, 0.25],
        [0.0, 0.5, 0.5]
      ];

      const steadyState = calculateSteadyState(matrix);

      // Verificar que soma para 1
      const sum = steadyState.reduce((acc, val) => acc + val, 0);
      expect(sum).toBeCloseTo(1.0, 5);

      // Verificar propriedade de estado estacionário: π = πP
      const result = [0, 1, 2].map(i => 
        steadyState.reduce((sum, prob, j) => sum + prob * matrix[j][i], 0)
      );
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(steadyState[i], 3);
      });
    });

    it('handles identity matrix', () => {
      const matrix = [
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0]
      ];

      const steadyState = calculateSteadyState(matrix);
      
      // Para matriz identidade, distribuição estacionária é uniforme
      expect(steadyState[0]).toBeCloseTo(0.333, 2);
      expect(steadyState[1]).toBeCloseTo(0.333, 2);
      expect(steadyState[2]).toBeCloseTo(0.333, 2);
    });
  });

  describe('predictNextStates', () => {
    it('predicts states based on current distribution', () => {
      const matrix = [
        [0.8, 0.15, 0.05],
        [0.3, 0.5, 0.2],
        [0.1, 0.3, 0.6]
      ];

      const currentDistribution = [0.6, 0.3, 0.1];
      const predictions = predictNextStates(matrix, currentDistribution, 3);

      expect(predictions.next3Sprints).toHaveLength(3);
      expect(predictions.riskProbability).toBeGreaterThanOrEqual(0);
      expect(predictions.riskProbability).toBeLessThanOrEqual(1);
      expect(predictions.healthProbability).toBeGreaterThanOrEqual(0);
      expect(predictions.criticalProbability).toBeGreaterThanOrEqual(0);

      // Soma das probabilidades deve ser 1
      const totalProb = predictions.riskProbability + 
                       predictions.healthProbability + 
                       predictions.criticalProbability;
      expect(totalProb).toBeCloseTo(1.0, 5);
    });

    it('handles zero steps prediction', () => {
      const matrix = [[1.0, 0.0], [0.0, 1.0]];
      const currentDistribution = [0.5, 0.5];
      
      const predictions = predictNextStates(matrix, currentDistribution, 0);
      
      expect(predictions.next3Sprints).toHaveLength(0);
    });
  });

  describe('validateTransitionMatrix', () => {
    it('validates correct transition matrix', () => {
      const validMatrix = [
        [0.5, 0.3, 0.2],
        [0.25, 0.5, 0.25],
        [0.1, 0.4, 0.5]
      ];

      expect(() => validateTransitionMatrix(validMatrix)).not.toThrow();
    });

    it('throws error for non-square matrix', () => {
      const invalidMatrix = [
        [0.5, 0.5],
        [0.3, 0.3, 0.4]
      ];

      expect(() => validateTransitionMatrix(invalidMatrix))
        .toThrow('Matriz deve ser quadrada');
    });

    it('throws error for rows not summing to 1', () => {
      const invalidMatrix = [
        [0.5, 0.3],
        [0.25, 0.5]
      ];

      expect(() => validateTransitionMatrix(invalidMatrix))
        .toThrow('Cada linha deve somar 1');
    });

    it('throws error for negative probabilities', () => {
      const invalidMatrix = [
        [0.6, -0.1, 0.5],
        [0.3, 0.4, 0.3],
        [0.2, 0.3, 0.5]
      ];

      expect(() => validateTransitionMatrix(invalidMatrix))
        .toThrow('Probabilidades devem ser não-negativas');
    });
  });
});
```

## 🔗 Integration Tests

### Testing Context Providers

```typescript
// src/contexts/ProjectContext/ProjectContext.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ProjectProvider, useProjects } from './ProjectContext';
import { createMockProject } from '@test/utils';
import * as storage from '@utils/storage';

vi.mock('@utils/storage');

describe('ProjectContext', () => {
  const mockStorage = vi.mocked(storage);
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.loadProjects.mockResolvedValue([]);
    mockStorage.saveProject.mockResolvedValue();
    mockStorage.deleteProject.mockResolvedValue();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ProjectProvider>{children}</ProjectProvider>
  );

  it('loads projects on initialization', async () => {
    const mockProjects = [createMockProject(), createMockProject({ id: 'project-2' })];
    mockStorage.loadProjects.mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects(), { wrapper });

    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.projects).toHaveLength(2);
    expect(mockStorage.loadProjects).toHaveBeenCalledOnce();
  });

  it('creates new project successfully', async () => {
    const { result } = renderHook(() => useProjects(), { wrapper });
    
    const newProject = createMockProject({ name: 'New Project' });
    
    await act(async () => {
      await result.current.createProject(newProject);
    });

    expect(result.current.projects).toContainEqual(
      expect.objectContaining({ name: 'New Project' })
    );
    expect(mockStorage.saveProject).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Project' })
    );
  });

  it('handles project creation errors', async () => {
    mockStorage.saveProject.mockRejectedValue(new Error('Storage failed'));

    const { result } = renderHook(() => useProjects(), { wrapper });
    
    await act(async () => {
      await result.current.createProject(createMockProject());
    });

    expect(result.current.error).toBe('Storage failed');
    expect(result.current.projects).toHaveLength(0);
  });

  it('updates project correctly', async () => {
    const initialProject = createMockProject();
    mockStorage.loadProjects.mockResolvedValue([initialProject]);

    const { result } = renderHook(() => useProjects(), { wrapper });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.updateProject(initialProject.id, { name: 'Updated Name' });
    });

    const updatedProject = result.current.projects.find(p => p.id === initialProject.id);
    expect(updatedProject?.name).toBe('Updated Name');
  });

  it('deletes project correctly', async () => {
    const projectToDelete = createMockProject();
    mockStorage.loadProjects.mockResolvedValue([projectToDelete]);

    const { result } = renderHook(() => useProjects(), { wrapper });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.deleteProject(projectToDelete.id);
    });

    expect(result.current.projects).toHaveLength(0);
    expect(mockStorage.deleteProject).toHaveBeenCalledWith(projectToDelete.id);
  });

  it('searches projects correctly', async () => {
    const projects = [
      createMockProject({ name: 'Frontend Project' }),
      createMockProject({ id: 'project-2', name: 'Backend API' }),
      createMockProject({ id: 'project-3', name: 'Mobile App' })
    ];
    mockStorage.loadProjects.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects(), { wrapper });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const searchResults = result.current.searchProjects('Frontend');
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].name).toBe('Frontend Project');
  });
});
```

### Testing Component Integration

```typescript
// src/pages/DashboardPage/DashboardPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@test/utils';
import { DashboardPage } from './DashboardPage';
import * as markovUtils from '@utils/markov';
import { generateSprintHistory, createMockProject } from '@test/utils';

vi.mock('@utils/markov');

describe('DashboardPage Integration', () => {
  const mockMarkovUtils = vi.mocked(markovUtils);
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockMarkovUtils.calculateTransitionMatrix.mockReturnValue([
      [0.7, 0.2, 0.1],
      [0.3, 0.5, 0.2],
      [0.1, 0.3, 0.6]
    ]);
    mockMarkovUtils.calculateSteadyState.mockReturnValue([0.4, 0.35, 0.25]);
    mockMarkovUtils.predictNextStates.mockReturnValue({
      next3Sprints: [UnifiedState.HEALTHY, UnifiedState.HEALTHY, UnifiedState.AT_RISK],
      riskProbability: 0.25,
      healthProbability: 0.4,
      criticalProbability: 0.35
    });
  });

  it('renders all dashboard sections', async () => {
    render(<DashboardPage />);

    expect(screen.getByText('Dashboard Executivo')).toBeInTheDocument();
    expect(screen.getByText('Análise Estatística')).toBeInTheDocument();
    expect(screen.getByText('Predição Inteligente')).toBeInTheDocument();
  });

  it('shows loading state when analyzing', async () => {
    render(<DashboardPage />);
    
    // Simular análise demorada
    let resolveAnalysis: () => void;
    const analysisPromise = new Promise<void>((resolve) => {
      resolveAnalysis = resolve;
    });
    
    mockMarkovUtils.calculateTransitionMatrix.mockImplementation(() => {
      analysisPromise.then(() => {});
      return [
        [0.7, 0.2, 0.1],
        [0.3, 0.5, 0.2],
        [0.1, 0.3, 0.6]
      ];
    });

    const analyzeButton = screen.getByRole('button', { name: /analisar/i });
    analyzeButton.click();

    expect(screen.getByText('Analisando...')).toBeInTheDocument();
    
    resolveAnalysis!();
    
    await waitFor(() => {
      expect(screen.queryByText('Analisando...')).not.toBeInTheDocument();
    });
  });

  it('displays analysis results correctly', async () => {
    render(<DashboardPage />);

    const analyzeButton = screen.getByRole('button', { name: /analisar/i });
    analyzeButton.click();

    await waitFor(() => {
      expect(screen.getByText('40%')).toBeInTheDocument(); // Health probability
      expect(screen.getByText('25%')).toBeInTheDocument(); // Risk probability
      expect(screen.getByText('35%')).toBeInTheDocument(); // Critical probability
    });
  });

  it('handles analysis errors gracefully', async () => {
    mockMarkovUtils.calculateTransitionMatrix.mockImplementation(() => {
      throw new Error('Analysis failed');
    });

    render(<DashboardPage />);

    const analyzeButton = screen.getByRole('button', { name: /analisar/i });
    analyzeButton.click();

    await waitFor(() => {
      expect(screen.getByText(/erro na análise/i)).toBeInTheDocument();
    });
  });

  it('updates view when switching between executive and detailed views', async () => {
    const { user } = render(<DashboardPage />);

    // Should start in executive view
    expect(screen.getByText('Visão Executiva')).toBeInTheDocument();
    
    // Switch to detailed view
    const detailedTab = screen.getByRole('tab', { name: /detalhada/i });
    await user.click(detailedTab);
    
    expect(screen.getByText('Matriz de Transição')).toBeInTheDocument();
  });
});
```

## 🌐 E2E Tests

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Critical User Journeys

```typescript
// e2e/user-journeys.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete project creation and analysis flow', async ({ page }) => {
    // Navigate to projects page
    await page.click('[data-testid="nav-projects"]');
    
    // Create new project
    await page.click('[data-testid="create-project-button"]');
    await page.fill('[data-testid="project-name-input"]', 'E2E Test Project');
    await page.fill('[data-testid="project-description-input"]', 'A project created by E2E tests');
    await page.click('[data-testid="save-project-button"]');
    
    // Verify project created
    await expect(page.locator('[data-testid="project-card"]')).toContainText('E2E Test Project');
    
    // Open project
    await page.click('[data-testid="project-card"]:has-text("E2E Test Project")');
    
    // Add sprints
    for (let i = 1; i <= 5; i++) {
      await page.click('[data-testid="add-sprint-button"]');
      await page.fill('[data-testid="sprint-name-input"]', `Sprint ${i}`);
      await page.fill('[data-testid="planned-points-input"]', '50');
      await page.fill('[data-testid="completed-points-input"]', `${40 + i * 2}`);
      await page.selectOption('[data-testid="sprint-state-select"]', i % 2 === 0 ? 'AT_RISK' : 'HEALTHY');
      await page.click('[data-testid="save-sprint-button"]');
      
      await expect(page.locator('[data-testid="sprint-list"]')).toContainText(`Sprint ${i}`);
    }
    
    // Navigate to dashboard
    await page.click('[data-testid="nav-dashboard"]');
    
    // Run Markov analysis
    await page.click('[data-testid="analyze-button"]');
    
    // Wait for analysis to complete
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    
    // Verify analysis results are displayed
    await expect(page.locator('[data-testid="health-probability"]')).toBeVisible();
    await expect(page.locator('[data-testid="risk-probability"]')).toBeVisible();
    await expect(page.locator('[data-testid="critical-probability"]')).toBeVisible();
    
    // Verify transition matrix is shown
    await page.click('[data-testid="detailed-view-tab"]');
    await expect(page.locator('[data-testid="transition-matrix"]')).toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigation should be collapsed on mobile
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
    
    // Navigate using mobile menu
    await page.click('[data-testid="mobile-nav-projects"]');
    await expect(page).toHaveURL(/\/projects/);
    
    // Cards should stack vertically on mobile
    await expect(page.locator('[data-testid="projects-grid"]')).toHaveCSS('grid-template-columns', '1fr');
  });

  test('data persistence across sessions', async ({ page, context }) => {
    // Create a project
    await page.goto('/projects');
    await page.click('[data-testid="create-project-button"]');
    await page.fill('[data-testid="project-name-input"]', 'Persistence Test');
    await page.click('[data-testid="save-project-button"]');
    
    // Verify project exists
    await expect(page.locator('[data-testid="project-card"]')).toContainText('Persistence Test');
    
    // Close and reopen browser
    await context.close();
    const newContext = await page.context().browser()?.newContext();
    const newPage = await newContext!.newPage();
    
    // Navigate to projects and verify data persisted
    await newPage.goto('/projects');
    await expect(newPage.locator('[data-testid="project-card"]')).toContainText('Persistence Test');
    
    await newContext?.close();
  });

  test('error handling and recovery', async ({ page }) => {
    // Simulate network failure during analysis
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/dashboard');
    await page.click('[data-testid="analyze-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Recovery should work when network is restored
    await page.unroute('**/api/**');
    await page.click('[data-testid="retry-button"]');
    
    // Should eventually succeed
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 10000 });
  });

  test('accessibility standards compliance', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test screen reader labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Every button should have either text or aria-label
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }
    
    // Test color contrast (basic check)
    const colorElements = page.locator('[data-testid*="state-indicator"]');
    const count = await colorElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = colorElements.nth(i);
      await expect(element).toHaveCSS('color', /.+/);
    }
  });

  test('performance benchmarks', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
    
    // Measure analysis performance
    await page.goto('/dashboard');
    
    const analysisStart = Date.now();
    await page.click('[data-testid="analyze-button"]');
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    const analysisTime = Date.now() - analysisStart;
    
    expect(analysisTime).toBeLessThan(2000); // Analysis should complete in under 2 seconds
  });
});
```

## 📊 Test Reporting & Coverage

### Jest/Vitest Coverage Configuration

```json
// package.json - test scripts
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --coverage --reporter=json --reporter=html",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:report": "playwright show-report",
    "test:all": "npm run test:ci && npm run e2e"
  }
}
```

### CI/CD Test Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:ci
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
          flags: unittests
          name: unit-test-coverage

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run e2e
      
      - name: Upload E2E report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run visual regression tests
        run: npx playwright test --project=visual-regression
      
      - name: Upload visual diffs
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-diffs
          path: test-results/
```

### Test Metrics Dashboard

```typescript
// scripts/test-metrics.ts
interface TestMetrics {
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  performance: {
    unitTestDuration: number;
    e2eTestDuration: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
  quality: {
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    technicalDebt: string;
  };
}

export async function generateTestReport(): Promise<TestMetrics> {
  // Implementation for generating comprehensive test metrics
  // This would integrate with coverage reports, performance data, etc.
}
```

---

## 📋 Test Checklist

### Pre-Commit Hooks

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🧪 Running pre-commit tests..."

# Type checking
npm run type-check || exit 1

# Linting
npm run lint || exit 1

# Unit tests
npm run test:run || exit 1

echo "✅ All pre-commit checks passed!"
```

### Definition of Done - Testing

- [ ] **Unit Tests**
  - [ ] All new functions have unit tests
  - [ ] Edge cases covered
  - [ ] Error scenarios tested
  - [ ] Mocks properly implemented

- [ ] **Integration Tests**
  - [ ] Component interactions tested
  - [ ] Context providers tested
  - [ ] API integrations tested
  - [ ] State management tested

- [ ] **E2E Tests**
  - [ ] Critical user journeys covered
  - [ ] Cross-browser compatibility verified
  - [ ] Mobile responsiveness tested
  - [ ] Accessibility compliance checked

- [ ] **Performance Tests**
  - [ ] Load time benchmarks met
  - [ ] Bundle size within limits
  - [ ] Memory usage optimized
  - [ ] CPU usage acceptable

- [ ] **Quality Gates**
  - [ ] 85%+ code coverage
  - [ ] All tests passing
  - [ ] No console errors
  - [ ] Visual regression tests passed

---

**Guia de Testes mantido por:** QA Team  
**Última atualização:** 27 de Setembro de 2025  
**Versão dos Testes:** 1.5