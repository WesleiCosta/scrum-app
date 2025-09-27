# 🏗️ ARQUITETURA & DESIGN - SCRUM-MARKOV APP

## 🎯 Visão Arquitetural

### Padrões Arquiteturais Aplicados

O Scrum-Markov App segue uma **arquitetura em camadas** com separação clara de responsabilidades, implementando os padrões:

- **MVC (Model-View-Controller)** para separação de lógica
- **Context Pattern** para gerenciamento de estado global
- **Repository Pattern** para abstração de persistência
- **Observer Pattern** para reatividade de dados
- **Strategy Pattern** para algoritmos de predição

```
┌─────────────────────────────────────────────┐
│                 PRESENTATION                │
│  ┌─────────────┐  ┌─────────────┐  ┌──────┐│
│  │   Pages     │  │ Components  │  │ UI   ││
│  │             │  │             │  │      ││
│  └─────────────┘  └─────────────┘  └──────┘│
├─────────────────────────────────────────────┤
│                   BUSINESS                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────┐│
│  │  Contexts   │  │    Hooks    │  │Utils ││
│  │             │  │             │  │      ││
│  └─────────────┘  └─────────────┘  └──────┘│
├─────────────────────────────────────────────┤
│                    DATA                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────┐│
│  │   Storage   │  │   Types     │  │ API  ││
│  │             │  │             │  │      ││
│  └─────────────┘  └─────────────┘  └──────┘│
└─────────────────────────────────────────────┘
```

## 🎨 Design System

### Atomic Design Methodology

Seguimos a metodologia **Atomic Design** para construção de componentes:

```
Atoms (Átomos):
├── Button
├── Input
├── Label
├── Icon
└── Badge

Molecules (Moléculas):
├── FormField
├── SearchBox
├── MetricCard
├── StateIndicator
└── ProbabilityBar

Organisms (Organismos):
├── TransitionMatrix
├── PredictionTimeline
├── ProjectCard
├── SprintForm
└── Dashboard

Templates (Templates):
├── DashboardLayout
├── FormLayout
├── ListLayout
└── AuthLayout

Pages (Páginas):
├── DashboardPage
├── ProjectsPage
├── SprintLogPage
└── ConfigurationPage
```

### Design Tokens

```typescript
// design-tokens.ts
export const DesignTokens = {
  // Colors
  colors: {
    // Brand Colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a'
    },
    
    // Semantic Colors
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    
    // State Colors (Scrum-Markov específico)
    states: {
      healthy: {
        light: '#dcfce7',
        base: '#16a34a',
        dark: '#166534'
      },
      risk: {
        light: '#fef3c7',
        base: '#d97706',
        dark: '#92400e'
      },
      critical: {
        light: '#fee2e2',
        base: '#dc2626',
        dark: '#991b1b'
      }
    }
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  
  // Spacing
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem', 
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  
  // Border Radius
  borderRadius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },
  
  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
} as const;
```

## 🧩 Arquitetura de Componentes

### Component Architecture Pattern

```typescript
// Base Component Structure
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

interface ComponentState {
  loading?: boolean;
  error?: Error | null;
  data?: any;
}

// Higher-Order Component para logging
function withLogging<P extends ComponentProps>(
  WrappedComponent: React.ComponentType<P>
) {
  return function LoggingComponent(props: P) {
    React.useEffect(() => {
      console.log(`${WrappedComponent.name} mounted`);
      return () => console.log(`${WrappedComponent.name} unmounted`);
    }, []);
    
    return <WrappedComponent {...props} />;
  };
}

// Hook personalizado para estado de componente
function useComponentState<T>(initialState: T) {
  const [state, setState] = React.useState<ComponentState & T>({
    loading: false,
    error: null,
    ...initialState
  });
  
  const setLoading = (loading: boolean) => setState(prev => ({ ...prev, loading }));
  const setError = (error: Error | null) => setState(prev => ({ ...prev, error }));
  const setData = (data: any) => setState(prev => ({ ...prev, data }));
  
  return { state, setState, setLoading, setError, setData };
}
```

### Exemplo: TransitionMatrix Component

```typescript
// components/TransitionMatrix/TransitionMatrix.tsx
interface TransitionMatrixProps {
  matrix: number[][];
  states: UnifiedState[];
  onCellChange?: (i: number, j: number, value: number) => void;
  readOnly?: boolean;
  colorScheme?: 'default' | 'heatmap' | 'semantic';
  showLabels?: boolean;
  className?: string;
}

export const TransitionMatrix: React.FC<TransitionMatrixProps> = ({
  matrix,
  states,
  onCellChange,
  readOnly = false,
  colorScheme = 'default',
  showLabels = true,
  className
}) => {
  const { state, setError } = useComponentState({});
  const theme = useTheme();
  
  // Validação de propriedades
  React.useEffect(() => {
    if (matrix.length !== states.length) {
      setError(new Error('Matrix dimensions must match states array length'));
    }
  }, [matrix, states, setError]);
  
  const getCellColor = React.useCallback((
    value: number,
    fromState: UnifiedState,
    toState: UnifiedState
  ) => {
    switch (colorScheme) {
      case 'heatmap':
        return `rgba(59, 130, 246, ${value})`;
      case 'semantic':
        return getSemanticColor(fromState, toState, value);
      default:
        return theme.colors.gray[100];
    }
  }, [colorScheme, theme]);
  
  const handleCellChange = React.useCallback((
    i: number,
    j: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0 && value <= 1) {
      onCellChange?.(i, j, value);
    }
  }, [onCellChange]);
  
  if (state.error) {
    return <ErrorBoundary error={state.error} />;
  }
  
  return (
    <div className={cn('transition-matrix', className)}>
      {showLabels && (
        <div className="matrix-header">
          <h3 className="text-lg font-semibold mb-4">
            Matriz de Transição de Estados
          </h3>
        </div>
      )}
      
      <div className="matrix-grid grid grid-cols-4 gap-2">
        {/* Header row */}
        <div className="cell header"></div>
        {states.map(state => (
          <div key={`header-${state}`} className="cell header">
            <StateLabel state={state} />
          </div>
        ))}
        
        {/* Matrix rows */}
        {matrix.map((row, i) => (
          <React.Fragment key={`row-${i}`}>
            <div className="cell header">
              <StateLabel state={states[i]} />
            </div>
            {row.map((value, j) => (
              <MatrixCell
                key={`cell-${i}-${j}`}
                value={value}
                backgroundColor={getCellColor(value, states[i], states[j])}
                onChange={(newValue) => handleCellChange(i, j, { target: { value: newValue.toString() } } as any)}
                readOnly={readOnly}
                testId={`matrix-cell-${i}-${j}`}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
```

## 🔄 Gerenciamento de Estado

### Context Architecture

```typescript
// contexts/ProjectContext.tsx
interface ProjectContextState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
}

interface ProjectContextActions {
  // CRUD Operations
  createProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  
  // Bulk Operations
  importProjects: (projects: Project[]) => Promise<void>;
  exportProjects: () => Project[];
  
  // Filtering & Search
  searchProjects: (query: string) => Project[];
  filterProjects: (filter: ProjectFilter) => Project[];
}

type ProjectContextValue = ProjectContextState & ProjectContextActions;

const ProjectContext = React.createContext<ProjectContextValue | null>(null);

// Custom hook com validação
export function useProjects(): ProjectContextValue {
  const context = React.useContext(ProjectContext);
  
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  
  return context;
}

// Provider com reducer pattern
export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = React.useReducer(projectReducer, initialState);
  
  // Actions implementation
  const actions = React.useMemo(() => ({
    createProject: async (project: Omit<Project, 'id'>) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const newProject = { ...project, id: generateId() };
        await StorageService.saveProject(newProject);
        dispatch({ type: 'ADD_PROJECT', payload: newProject });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    
    updateProject: async (id: string, updates: Partial<Project>) => {
      // Implementation...
    },
    
    deleteProject: async (id: string) => {
      // Implementation...
    }
    
    // ... other actions
  }), []);
  
  const value = React.useMemo(() => ({
    ...state,
    ...actions
  }), [state, actions]);
  
  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

// Reducer para gerenciamento de estado
function projectReducer(
  state: ProjectContextState, 
  action: ProjectAction
): ProjectContextState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
      
    case 'ADD_PROJECT':
      return { 
        ...state, 
        projects: [...state.projects, action.payload] 
      };
      
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        )
      };
      
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload)
      };
      
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
      
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    default:
      return state;
  }
}
```

### Optimistic Updates

```typescript
// hooks/useOptimisticUpdates.ts
export function useOptimisticUpdates<T extends { id: string }>(
  items: T[],
  updateFn: (id: string, updates: Partial<T>) => Promise<void>
) {
  const [optimisticItems, setOptimisticItems] = React.useState(items);
  
  React.useEffect(() => {
    setOptimisticItems(items);
  }, [items]);
  
  const optimisticUpdate = React.useCallback(async (
    id: string,
    updates: Partial<T>
  ) => {
    // Atualização otimista imediata
    setOptimisticItems(current => 
      current.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
    
    try {
      // Atualização real no servidor/storage
      await updateFn(id, updates);
    } catch (error) {
      // Rollback em caso de erro
      setOptimisticItems(items);
      throw error;
    }
  }, [items, updateFn]);
  
  return { optimisticItems, optimisticUpdate };
}
```

## 🎭 Performance & Otimização

### React Performance Patterns

```typescript
// Memoization strategies
const MemoizedTransitionMatrix = React.memo(TransitionMatrix, (prevProps, nextProps) => {
  // Custom comparison para arrays aninhados
  return (
    JSON.stringify(prevProps.matrix) === JSON.stringify(nextProps.matrix) &&
    prevProps.states.join() === nextProps.states.join()
  );
});

// Virtual scrolling para listas grandes
const VirtualizedProjectList = React.memo(({ projects }: { projects: Project[] }) => {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 10 });
  
  const itemHeight = 80;
  const containerHeight = 400;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  
  const handleScroll = React.useCallback((e: React.UIEvent) => {
    const scrollTop = e.currentTarget.scrollTop;
    const start = Math.floor(scrollTop / itemHeight);
    const end = start + visibleCount;
    
    setVisibleRange({ start, end });
  }, [itemHeight, visibleCount]);
  
  const visibleProjects = projects.slice(visibleRange.start, visibleRange.end);
  
  return (
    <div
      ref={listRef}
      className="virtual-list"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: projects.length * itemHeight, position: 'relative' }}>
        {visibleProjects.map((project, index) => (
          <div
            key={project.id}
            style={{
              position: 'absolute',
              top: (visibleRange.start + index) * itemHeight,
              height: itemHeight
            }}
          >
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    </div>
  );
});

// Debouncing para inputs de busca
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
```

### Code Splitting & Lazy Loading

```typescript
// Route-based code splitting
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage'));
const SprintLogPage = React.lazy(() => import('./pages/SprintLogPage'));

// Component-based code splitting
const HeavyChart = React.lazy(() => import('./components/HeavyChart'));

// Suspense wrapper com fallback personalizado
const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Suspense fallback={<LoadingSpinner />}>
    {children}
  </React.Suspense>
);

// Preloading de rotas
const preloadRoute = (routeComponent: () => Promise<any>) => {
  const componentImport = routeComponent();
  return componentImport;
};

// Uso em eventos de hover
const NavLink: React.FC<{ to: string; preload?: () => Promise<any> }> = ({ 
  to, 
  preload, 
  children 
}) => (
  <Link
    to={to}
    onMouseEnter={() => preload?.()}
  >
    {children}
  </Link>
);
```

## 🛡️ Tratamento de Erros

### Error Boundary System

```typescript
// components/ErrorBoundary/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to monitoring service
    ErrorReportingService.reportError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
        />
      );
    }
    
    return this.props.children;
  }
}

// Hook para tratamento de erros assíncronos
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  
  const handleError = React.useCallback((error: Error) => {
    setError(error);
    ErrorReportingService.reportError(error);
  }, []);
  
  const clearError = React.useCallback(() => {
    setError(null);
  }, []);
  
  React.useEffect(() => {
    if (error) {
      // Auto-clear error after 5 seconds
      const timeout = setTimeout(clearError, 5000);
      return () => clearTimeout(timeout);
    }
  }, [error, clearError]);
  
  return { error, handleError, clearError };
}
```

### Graceful Degradation

```typescript
// hooks/useFeatureFlag.ts
export function useFeatureFlag(flagName: string): boolean {
  const [isEnabled, setIsEnabled] = React.useState(false);
  
  React.useEffect(() => {
    // Check feature flag from config or remote
    const checkFlag = async () => {
      try {
        const config = await ConfigService.getFeatureFlags();
        setIsEnabled(config[flagName] ?? false);
      } catch (error) {
        // Graceful degradation - default to false
        setIsEnabled(false);
      }
    };
    
    checkFlag();
  }, [flagName]);
  
  return isEnabled;
}

// Componente com fallback gracioso
const AdvancedChart: React.FC<ChartProps> = (props) => {
  const isAdvancedChartsEnabled = useFeatureFlag('advancedCharts');
  const [hasWebGL, setHasWebGL] = React.useState(false);
  
  React.useEffect(() => {
    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    setHasWebGL(!!gl);
  }, []);
  
  if (isAdvancedChartsEnabled && hasWebGL) {
    return <WebGLChart {...props} />;
  }
  
  if (isAdvancedChartsEnabled) {
    return <CanvasChart {...props} />;
  }
  
  return <SimpleChart {...props} />;
};
```

## 🔐 Segurança Arquitetural

### Input Validation & Sanitization

```typescript
// utils/validation.ts
export class ValidationService {
  private static readonly PATTERNS = {
    projectName: /^[a-zA-Z0-9\s\-_]{3,50}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    number: /^\d+(\.\d+)?$/,
    percentage: /^(100(\.0{1,2})?|[1-9]?\d(\.\d{1,2})?)$/
  };
  
  static validateInput<T extends keyof typeof ValidationService.PATTERNS>(
    type: T,
    value: string
  ): ValidationResult {
    const pattern = ValidationService.PATTERNS[type];
    const isValid = pattern.test(value);
    
    return {
      isValid,
      sanitizedValue: isValid ? value.trim() : null,
      errors: isValid ? [] : [`Invalid ${type} format`]
    };
  }
  
  static sanitizeHTML(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  static validateMatrixValue(value: number): boolean {
    return !isNaN(value) && value >= 0 && value <= 1;
  }
}

// Higher-order component para validação automática
function withInputValidation<P extends { value?: string; onChange?: (value: string) => void }>(
  WrappedComponent: React.ComponentType<P>,
  validationType: keyof typeof ValidationService.PATTERNS
) {
  return function ValidatedInput(props: P) {
    const [validationState, setValidationState] = React.useState<ValidationResult>({
      isValid: true,
      sanitizedValue: props.value || '',
      errors: []
    });
    
    const handleChange = (value: string) => {
      const validation = ValidationService.validateInput(validationType, value);
      setValidationState(validation);
      
      if (validation.isValid && validation.sanitizedValue) {
        props.onChange?.(validation.sanitizedValue);
      }
    };
    
    return (
      <div className="validated-input">
        <WrappedComponent
          {...props}
          onChange={handleChange}
          className={cn(
            props.className,
            !validationState.isValid && 'border-red-500'
          )}
        />
        {!validationState.isValid && (
          <div className="text-red-500 text-sm mt-1">
            {validationState.errors.join(', ')}
          </div>
        )}
      </div>
    );
  };
}
```

### CSP (Content Security Policy)

```typescript
// security/csp.ts
export const ContentSecurityPolicy = {
  // Desenvolvimento
  development: {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-eval' 'unsafe-inline'",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: blob:",
    'connect-src': "'self' ws: wss:",
    'font-src': "'self'",
    'object-src': "'none'",
    'media-src': "'self'",
    'frame-src': "'none'"
  },
  
  // Produção
  production: {
    'default-src': "'self'",
    'script-src': "'self'",
    'style-src': "'self' 'unsafe-inline'", // Tailwind CSS inline styles
    'img-src': "'self' data:",
    'connect-src': "'self'",
    'font-src': "'self'",
    'object-src': "'none'",
    'media-src': "'self'",
    'frame-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'"
  }
};

// Geração do header CSP
export function generateCSPHeader(environment: 'development' | 'production'): string {
  const policy = ContentSecurityPolicy[environment];
  return Object.entries(policy)
    .map(([directive, sources]) => `${directive} ${Array.isArray(sources) ? sources.join(' ') : sources}`)
    .join('; ');
}
```

## 📊 Monitoramento & Observabilidade

### Performance Monitoring

```typescript
// utils/performance.ts
export class PerformanceMonitor {
  private static metrics: Map<string, PerformanceMetric[]> = new Map();
  
  static startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }
  
  static endMeasure(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    const duration = measure.duration;
    
    // Armazenar métrica
    const metrics = this.metrics.get(name) || [];
    metrics.push({
      timestamp: Date.now(),
      duration,
      name
    });
    this.metrics.set(name, metrics.slice(-100)); // Manter apenas as 100 mais recentes
    
    // Limpar marcações
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
    
    return duration;
  }
  
  static getMetrics(name: string): PerformanceAnalysis {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p95: 0 };
    }
    
    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((acc, d) => acc + d, 0);
    
    return {
      count: metrics.length,
      avg: sum / metrics.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p95: durations[Math.floor(durations.length * 0.95)]
    };
  }
}

// Hook para monitoramento automático
export function usePerformanceMonitoring(componentName: string) {
  React.useEffect(() => {
    PerformanceMonitor.startMeasure(`${componentName}-render`);
    
    return () => {
      PerformanceMonitor.endMeasure(`${componentName}-render`);
    };
  });
  
  const measureOperation = React.useCallback((operationName: string, fn: () => void) => {
    PerformanceMonitor.startMeasure(`${componentName}-${operationName}`);
    fn();
    PerformanceMonitor.endMeasure(`${componentName}-${operationName}`);
  }, [componentName]);
  
  return { measureOperation };
}
```

### Error Tracking

```typescript
// utils/errorTracking.ts
interface ErrorContext {
  userId?: string;
  projectId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export class ErrorTrackingService {
  private static errorQueue: ErrorReport[] = [];
  private static maxQueueSize = 100;
  
  static reportError(error: Error, context?: ErrorContext): void {
    const errorReport: ErrorReport = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context?.userId || 'anonymous'
    };
    
    // Adicionar à fila
    this.errorQueue.push(errorReport);
    
    // Manter tamanho máximo da fila
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
    
    // Enviar imediatamente se for erro crítico
    if (this.isCriticalError(error)) {
      this.flushErrors();
    }
  }
  
  private static isCriticalError(error: Error): boolean {
    return (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Network Error') ||
      error.message.includes('Failed to fetch')
    );
  }
  
  static flushErrors(): void {
    if (this.errorQueue.length === 0) return;
    
    // Em um ambiente real, enviar para serviço de monitoramento
    console.group('🐛 Error Report');
    this.errorQueue.forEach(report => {
      console.error(report);
    });
    console.groupEnd();
    
    this.errorQueue = [];
  }
  
  // Flush automático a cada 30 segundos
  static {
    setInterval(() => {
      this.flushErrors();
    }, 30000);
  }
}
```

---

## 📋 Resumo Arquitetural

### Pontos Fortes da Arquitetura

1. **Separação Clara de Responsabilidades**
   - Apresentação, lógica de negócio e dados bem definidos
   - Componentes reutilizáveis e testáveis

2. **Performance Otimizada**
   - Code splitting automático
   - Memoização estratégica
   - Virtual scrolling para listas grandes

3. **Robustez & Confiabilidade**
   - Error boundaries em múltiplas camadas
   - Validação de entrada rigorosa
   - Tratamento gracioso de falhas

4. **Escalabilidade**
   - Padrões arquiteturais bem estabelecidos
   - Estrutura modular e extensível
   - Sistema de feature flags

5. **Observabilidade**
   - Monitoramento de performance integrado
   - Error tracking abrangente
   - Métricas de uso detalhadas

### Próximos Passos Arquiteturais

- [ ] Implementação de PWA (Progressive Web App)
- [ ] Sistema de cache inteligente com Service Workers
- [ ] Arquitetura de micro-frontends para escalabilidade
- [ ] Sistema de temas dinâmicos
- [ ] Internacionalização (i18n) completa

---

**Documentação Arquitetural mantida por:** Equipe de Arquitetura  
**Última revisão:** 27 de Setembro de 2025  
**Versão da Arquitetura:** 2.0