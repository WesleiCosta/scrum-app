// Integrações com ferramentas populares para coleta automática de métricas

// Interface para dados do Jira
export interface JiraSprintData {
  sprintId: string;
  sprintName: string;
  startDate: string;
  endDate: string;
  state: 'active' | 'closed' | 'future';
  issues: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    storyPoints: {
      total: number;
      completed: number;
    };
  };
  velocity: {
    commitment: number;
    completed: number;
  };
}

// Interface para dados do GitHub/GitLab
export interface GitData {
  repository: string;
  branch: string;
  commits: number;
  pullRequests: {
    total: number;
    merged: number;
    closed: number;
    averageTimeToMerge: number; // em horas
  };
  codeQuality: {
    coverage: number;
    complexity: number;
    duplications: number;
    bugs: number;
    vulnerabilities: number;
    codeSmells: number;
  };
}

// Interface para dados de ferramentas de CI/CD
export interface CICDData {
  builds: {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number; // em minutos
  };
  deployments: {
    total: number;
    successful: number;
    rollbacks: number;
    averageLeadTime: number; // em horas
  };
  tests: {
    total: number;
    passed: number;
    failed: number;
    coverage: number;
  };
}

// Interface para dados de monitoramento/observabilidade
export interface MonitoringData {
  availability: number; // %
  responseTime: number; // ms
  errorRate: number; // %
  incidents: {
    total: number;
    critical: number;
    averageResolutionTime: number; // em horas
  };
}

// Função para integrar dados do Jira
export function integrateJiraMetrics(jiraData: JiraSprintData): { [metricId: string]: number } {
  const metrics: { [metricId: string]: number } = {};

  // Story Completion Rate
  if (jiraData.issues.total > 0) {
    metrics['story-completion'] = (jiraData.issues.completed / jiraData.issues.total) * 100;
  }

  // Velocity Consistency
  if (jiraData.velocity.commitment > 0) {
    metrics['velocity-consistency'] = Math.min(
      (jiraData.velocity.completed / jiraData.velocity.commitment) * 100,
      150
    );
  }

  // Definition of Done (assumindo que completed == DoD completo)
  if (jiraData.issues.total > 0) {
    metrics['definition-of-done'] = (jiraData.issues.completed / jiraData.issues.total) * 100;
  }

  return metrics;
}

// Função para integrar dados do Git
export function integrateGitMetrics(gitData: GitData): { [metricId: string]: number } {
  const metrics: { [metricId: string]: number } = {};

  // Code Coverage
  if (gitData.codeQuality.coverage !== undefined) {
    metrics['code-coverage'] = gitData.codeQuality.coverage;
  }

  // Technical Debt (baseado em code smells e complexity)
  const techDebtScore = Math.min(
    (gitData.codeQuality.codeSmells * 0.3) +
    (gitData.codeQuality.complexity * 0.4) +
    (gitData.codeQuality.duplications * 0.3),
    100
  );
  metrics['technical-debt'] = techDebtScore;

  // Bug Rate (bugs per commit or similar)
  if (gitData.commits > 0) {
    metrics['bug-rate'] = gitData.codeQuality.bugs / gitData.commits;
  }

  // Feature Acceptance (baseado em PR merge rate)
  if (gitData.pullRequests.total > 0) {
    metrics['feature-acceptance'] = (gitData.pullRequests.merged / gitData.pullRequests.total) * 100;
  }

  return metrics;
}

// Função para integrar dados de CI/CD
export function integrateCICDMetrics(cicdData: CICDData): { [metricId: string]: number } {
  const metrics: { [metricId: string]: number } = {};

  // Build Success Rate (pode influenciar na qualidade geral)
  if (cicdData.builds.total > 0) {
    const buildSuccessRate = (cicdData.builds.successful / cicdData.builds.total) * 100;
    metrics['build-success-rate'] = buildSuccessRate;
  }

  // Test Success Rate
  if (cicdData.tests.total > 0) {
    metrics['test-success-rate'] = (cicdData.tests.passed / cicdData.tests.total) * 100;
  }

  // Test Coverage
  if (cicdData.tests.coverage !== undefined) {
    metrics['code-coverage'] = cicdData.tests.coverage;
  }

  // Deployment Success (influencia na entrega)
  if (cicdData.deployments.total > 0) {
    const deploySuccessRate = ((cicdData.deployments.successful) / cicdData.deployments.total) * 100;
    metrics['deployment-success-rate'] = deploySuccessRate;
  }

  return metrics;
}

// Função para integrar dados de monitoramento
export function integrateMonitoringMetrics(monitoringData: MonitoringData): { [metricId: string]: number } {
  const metrics: { [metricId: string]: number } = {};

  // System Availability (influencia satisfação dos stakeholders)
  metrics['system-availability'] = monitoringData.availability;

  // Incident Resolution Time
  if (monitoringData.incidents.total > 0) {
    metrics['impediment-resolution'] = monitoringData.incidents.averageResolutionTime / 24; // converter para dias
  }

  // Error Rate (inverso da qualidade)
  metrics['error-rate'] = monitoringData.errorRate;

  // Performance Score (baseado em response time)
  const performanceScore = Math.max(0, 100 - (monitoringData.responseTime / 10)); // assumindo 1000ms = 0 points
  metrics['performance-score'] = performanceScore;

  return metrics;
}

// Função principal para integração completa
export function integrateAllToolsMetrics(
  jiraData?: JiraSprintData,
  gitData?: GitData,
  cicdData?: CICDData,
  monitoringData?: MonitoringData
): { [metricId: string]: number } {
  let allMetrics: { [metricId: string]: number } = {};

  if (jiraData) {
    allMetrics = { ...allMetrics, ...integrateJiraMetrics(jiraData) };
  }

  if (gitData) {
    allMetrics = { ...allMetrics, ...integrateGitMetrics(gitData) };
  }

  if (cicdData) {
    allMetrics = { ...allMetrics, ...integrateCICDMetrics(cicdData) };
  }

  if (monitoringData) {
    allMetrics = { ...allMetrics, ...integrateMonitoringMetrics(monitoringData) };
  }

  return allMetrics;
}

// Função para simular dados de exemplo (para demonstração)
export function generateMockToolsData(): {
  jira: JiraSprintData;
  git: GitData;
  cicd: CICDData;
  monitoring: MonitoringData;
} {
  return {
    jira: {
      sprintId: 'SPR-123',
      sprintName: 'Sprint 15',
      startDate: '2025-09-12',
      endDate: '2025-09-26',
      state: 'closed',
      issues: {
        total: 12,
        completed: 10,
        inProgress: 1,
        todo: 1,
        storyPoints: {
          total: 34,
          completed: 29
        }
      },
      velocity: {
        commitment: 32,
        completed: 29
      }
    },
    git: {
      repository: 'company/awesome-product',
      branch: 'main',
      commits: 47,
      pullRequests: {
        total: 15,
        merged: 14,
        closed: 1,
        averageTimeToMerge: 18
      },
      codeQuality: {
        coverage: 87,
        complexity: 12,
        duplications: 3,
        bugs: 2,
        vulnerabilities: 0,
        codeSmells: 8
      }
    },
    cicd: {
      builds: {
        total: 52,
        successful: 49,
        failed: 3,
        averageDuration: 8.5
      },
      deployments: {
        total: 6,
        successful: 6,
        rollbacks: 0,
        averageLeadTime: 2.3
      },
      tests: {
        total: 1247,
        passed: 1235,
        failed: 12,
        coverage: 87
      }
    },
    monitoring: {
      availability: 99.8,
      responseTime: 245,
      errorRate: 0.12,
      incidents: {
        total: 1,
        critical: 0,
        averageResolutionTime: 1.5
      }
    }
  };
}