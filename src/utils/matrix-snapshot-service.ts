/**
 * Serviço de Snapshots de Matriz - Implementação da Especificação Seção 1.2
 * Sistema Scrum-Markov para Análise Preditiva de Projetos Ágeis
 */

import { TransitionMatrixSnapshot, TransitionMatrix, MatrixType } from '../types';
import { generateId } from './storage';

export class MatrixSnapshotService {
  private static STORAGE_KEY = 'scrum-markov-matrix-snapshots';

  /**
   * Obter todos os snapshots
   */
  static getSnapshots(): TransitionMatrixSnapshot[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar snapshots:', error);
      return [];
    }
  }

  /**
   * Obter snapshots por projeto
   */
  static getSnapshotsByProject(projectId: string): TransitionMatrixSnapshot[] {
    return this.getSnapshots()
      .filter(snapshot => snapshot.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Obter snapshot mais recente de um projeto
   */
  static getLatestSnapshot(
    projectId: string, 
    matrixType?: MatrixType
  ): TransitionMatrixSnapshot | null {
    let snapshots = this.getSnapshotsByProject(projectId);
    
    if (matrixType) {
      snapshots = snapshots.filter(s => s.matrixType === matrixType);
    }
    
    return snapshots[0] || null;
  }

  /**
   * Criar novo snapshot de matriz
   */
  static createSnapshot(
    projectId: string,
    sprintId: string,
    matrixType: MatrixType,
    matrix: TransitionMatrix,
    windowSize?: number
  ): TransitionMatrixSnapshot {
    const snapshot: TransitionMatrixSnapshot = {
      id: generateId(),
      projectId,
      sprintId,
      matrixType,
      matrixPayload: matrix,
      createdAt: new Date().toISOString(),
      windowSize
    };

    const snapshots = this.getSnapshots();
    snapshots.push(snapshot);
    this.saveSnapshots(snapshots);
    
    return snapshot;
  }

  /**
   * Remover snapshots antigos (mantém apenas os N mais recentes por projeto)
   */
  static cleanupOldSnapshots(projectId: string, keepCount: number = 50): number {
    const allSnapshots = this.getSnapshots();
    const projectSnapshots = allSnapshots
      .filter(s => s.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (projectSnapshots.length <= keepCount) {
      return 0; // Nada para limpar
    }

    // Identificar snapshots a serem removidos
    const snapshotsToRemove = projectSnapshots.slice(keepCount);
    const idsToRemove = new Set(snapshotsToRemove.map(s => s.id));
    
    // Filtrar snapshots mantendo apenas os mais recentes
    const filteredSnapshots = allSnapshots.filter(s => !idsToRemove.has(s.id));
    
    this.saveSnapshots(filteredSnapshots);
    
    return snapshotsToRemove.length;
  }

  /**
   * Remover todos os snapshots de um projeto
   */
  static deleteProjectSnapshots(projectId: string): number {
    const snapshots = this.getSnapshots();
    const filtered = snapshots.filter(s => s.projectId !== projectId);
    const removedCount = snapshots.length - filtered.length;
    
    if (removedCount > 0) {
      this.saveSnapshots(filtered);
    }
    
    return removedCount;
  }

  /**
   * Comparar duas matrizes de transição
   */
  static compareMatrices(
    matrix1: TransitionMatrix, 
    matrix2: TransitionMatrix
  ): {
    areEqual: boolean;
    differences: Array<{
      row: number;
      col: number;
      value1: number;
      value2: number;
      difference: number;
    }>;
    maxDifference: number;
  } {
    const differences = [];
    let maxDifference = 0;
    let areEqual = true;

    for (let i = 0; i < Math.max(matrix1.length, matrix2.length); i++) {
      for (let j = 0; j < Math.max(matrix1[i]?.length || 0, matrix2[i]?.length || 0); j++) {
        const value1 = matrix1[i]?.[j] || 0;
        const value2 = matrix2[i]?.[j] || 0;
        const diff = Math.abs(value1 - value2);

        if (diff > 0.001) { // Tolerância para precisão de ponto flutuante
          areEqual = false;
          differences.push({
            row: i,
            col: j,
            value1,
            value2,
            difference: diff
          });
          
          if (diff > maxDifference) {
            maxDifference = diff;
          }
        }
      }
    }

    return { areEqual, differences, maxDifference };
  }

  /**
   * Obter estatísticas de snapshots por projeto
   */
  static getProjectStats(projectId: string): {
    totalSnapshots: number;
    initialMatrices: number;
    dynamicMatrices: number;
    oldestSnapshot?: string;
    newestSnapshot?: string;
    averageWindowSize: number;
  } {
    const snapshots = this.getSnapshotsByProject(projectId);
    
    const initialCount = snapshots.filter(s => s.matrixType === 'INITIAL').length;
    const dynamicCount = snapshots.filter(s => s.matrixType === 'DYNAMIC').length;
    
    const windowSizes = snapshots
      .filter(s => s.windowSize !== undefined)
      .map(s => s.windowSize!);
    
    const averageWindowSize = windowSizes.length > 0 
      ? windowSizes.reduce((sum, size) => sum + size, 0) / windowSizes.length 
      : 0;

    return {
      totalSnapshots: snapshots.length,
      initialMatrices: initialCount,
      dynamicMatrices: dynamicCount,
      oldestSnapshot: snapshots.length > 0 ? snapshots[snapshots.length - 1].createdAt : undefined,
      newestSnapshot: snapshots.length > 0 ? snapshots[0].createdAt : undefined,
      averageWindowSize: Math.round(averageWindowSize * 10) / 10
    };
  }

  /**
   * Exportar snapshots para JSON
   */
  static exportSnapshots(projectId?: string): string {
    const snapshots = projectId 
      ? this.getSnapshotsByProject(projectId)
      : this.getSnapshots();
    
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      projectId,
      snapshots
    }, null, 2);
  }

  /**
   * Importar snapshots do JSON
   */
  static importSnapshots(jsonData: string, overwrite: boolean = false): {
    imported: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const data = JSON.parse(jsonData);
      
      if (!data.snapshots || !Array.isArray(data.snapshots)) {
        errors.push('Formato de dados inválido');
        return { imported, errors };
      }

      const existingSnapshots = overwrite ? [] : this.getSnapshots();
      const existingIds = new Set(existingSnapshots.map(s => s.id));

      for (const snapshot of data.snapshots) {
        try {
          // Validar estrutura do snapshot
          if (!snapshot.id || !snapshot.projectId || !snapshot.matrixPayload) {
            errors.push(`Snapshot inválido: ${JSON.stringify(snapshot)}`);
            continue;
          }

          // Evitar duplicatas se não estiver sobrescrevendo
          if (!overwrite && existingIds.has(snapshot.id)) {
            continue;
          }

          existingSnapshots.push(snapshot);
          imported++;
        } catch (error) {
          errors.push(`Erro ao processar snapshot: ${error}`);
        }
      }

      this.saveSnapshots(existingSnapshots);
    } catch (error) {
      errors.push(`Erro ao parsear JSON: ${error}`);
    }

    return { imported, errors };
  }

  /**
   * Salvar snapshots no localStorage
   */
  private static saveSnapshots(snapshots: TransitionMatrixSnapshot[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(snapshots));
    } catch (error) {
      console.error('Erro ao salvar snapshots:', error);
    }
  }
}