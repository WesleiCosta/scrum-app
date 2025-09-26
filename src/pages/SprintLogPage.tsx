import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useSprint } from '../contexts/SprintContext';
import { ProjectState } from '../types';
import { formatDate } from '../utils/storage';

function SprintLogPage() {
  const { currentProject } = useProject();
  const { sprintLogs, addSprintLog, deleteSprintLog } = useSprint();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSprint, setNewSprint] = useState({
    sprintDurationDays: 14,
    finalState: 'ESTÁVEL' as ProjectState,
    observations: ''
  });
  const [loading, setLoading] = useState(false);

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📁</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Nenhum projeto selecionado
        </h2>
        <p className="text-gray-600">
          Selecione um projeto para gerenciar seus sprints.
        </p>
      </div>
    );
  }

  const handleAddSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações de entrada
    if (!currentProject) {
      console.error('Erro: Nenhum projeto selecionado');
      return;
    }

    // Validação de duração mais robusta
    const duration = newSprint.sprintDurationDays;
    
    if (duration === null || duration === undefined || isNaN(duration)) {
      console.error('Erro: Duração do sprint deve ser um número válido');
      return;
    }
    
    if (duration < 0) {
      console.error('Erro: Duração não pode ser negativa');
      return;
    }
    
    // Permitir duração 0 para finalizar sprint no dia atual
    // Apenas impedir duração negativa
    
    // Validar estado final
    const validStates = currentProject.stateDefinitions.map(def => def.id);
    if (!newSprint.finalState || !validStates.includes(newSprint.finalState)) {
      console.error('Erro: Estado final é obrigatório e deve ser válido');
      return;
    }

    setLoading(true);
    try {
      // Buscar dados atualizados do storage para garantir consistência
      const currentSprints = sprintLogs;
      const nextSprintNumber = currentSprints.length + 1;
      const sprintName = `Sprint ${nextSprintNumber}`;
      
      // Calcular data de término com validações mais robustas
      let endDate: string;
      const today = new Date();
      
      if (currentSprints.length === 0) {
        // Primeiro sprint: tratar duração 0 como caso especial
        if (newSprint.sprintDurationDays === 0) {
          endDate = today.toISOString().split('T')[0];
        } else {
          const safeDuration = Math.max(1, newSprint.sprintDurationDays || 14);
          const durationMs = safeDuration * 24 * 60 * 60 * 1000;
          const endDateObj = new Date(today.getTime() + durationMs);
          endDate = endDateObj.toISOString().split('T')[0];
        }
      } else {
        // Sprints subsequentes: usar duração informada a partir do último sprint
        const sortedSprints = [...currentSprints].sort((a, b) => 
          new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
        );
        
        const lastSprint = sortedSprints[0];
        let baseDate = new Date(lastSprint.endDate);
        
        // Validar se a data do último sprint é válida
        if (isNaN(baseDate.getTime())) {
          console.warn('Data inválida no último sprint, usando data atual');
          baseDate = today;
        }
        
        // Se a duração é 0, usar a data de hoje como data final
        if (newSprint.sprintDurationDays === 0) {
          endDate = today.toISOString().split('T')[0];
        } else {
          // Usar duração informada pelo usuário (pode ser >= 1)
          const safeDuration = Math.max(1, newSprint.sprintDurationDays || 14);
          const durationMs = safeDuration * 24 * 60 * 60 * 1000;
          const endDateObj = new Date(baseDate.getTime() + durationMs);
          endDate = endDateObj.toISOString().split('T')[0];
        }
      }
      
      await addSprintLog({
        projectId: currentProject.id,
        sprintName: sprintName,
        endDate: endDate,
        finalState: newSprint.finalState,
        observations: newSprint.observations
      });
      
      setNewSprint({
        sprintDurationDays: 14,
        finalState: 'ESTÁVEL',
        observations: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Erro ao adicionar sprint:', error);
      // Mostrar feedback visual de erro para o usuário
      alert('Erro ao adicionar sprint. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (state: ProjectState) => {
    const colors = {
      EXCELENTE: 'text-green-600 bg-green-50',
      BOM: 'text-blue-600 bg-blue-50', 
      ESTÁVEL: 'text-yellow-600 bg-yellow-50',
      RISCO: 'text-orange-600 bg-orange-50',
      CRÍTICO: 'text-red-600 bg-red-50',
    };
    return colors[state] || 'text-gray-600 bg-gray-50';
  };

  const getStateName = (state: ProjectState) => {
    return currentProject.stateDefinitions.find(def => def.id === state)?.name || state;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Log de Sprints</h1>
          <p className="text-gray-600 mt-1">{currentProject.name}</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary"
        >
          + Adicionar Sprint
        </button>
      </div>

      {showAddForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Adicionar Sprint</h2>
          <form onSubmit={handleAddSprint} className="space-y-4">
            {/* Informações Automáticas */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">📋 Informações Automáticas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Nome do Sprint:</span>
                  <p className="text-blue-800">Sprint {sprintLogs.length + 1}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Data de Término:</span>
                  <p className="text-blue-800">
                    {(() => {
                      const today = new Date();
                      const duration = Math.max(0, newSprint.sprintDurationDays || 14);
                      
                      if (sprintLogs.length === 0) {
                        const endDate = new Date(today.getTime() + (duration * 24 * 60 * 60 * 1000));
                        return endDate.toLocaleDateString('pt-BR');
                      } else {
                        const sortedSprints = [...sprintLogs].sort((a, b) => 
                          new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
                        );
                        const lastSprint = sortedSprints[0];
                        let baseDate = new Date(lastSprint.endDate);
                        
                        if (isNaN(baseDate.getTime())) {
                          baseDate = today;
                        }
                        
                        const endDate = new Date(baseDate.getTime() + (duration * 24 * 60 * 60 * 1000));
                        return endDate.toLocaleDateString('pt-BR');
                      }
                    })()} 
                    ({newSprint.sprintDurationDays || 14} dias a partir da {sprintLogs.length === 0 ? 'data atual' : 'última sprint'})
                  </p>
                </div>
              </div>
            </div>
            
            {/* Campos de Entrada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duração do Sprint (dias) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="input"
                  placeholder="14"
                  min="0"
                  max="60"
                  value={newSprint.sprintDurationDays}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === '' ? 0 : parseInt(value);
                    setNewSprint({...newSprint, sprintDurationDays: isNaN(numValue) ? 0 : numValue});
                  }}
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">dias</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 Padrão: 14 dias (2 semanas). Use 0 para finalizar no dia atual.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado Final do Sprint *
              </label>
              <select
                className="input"
                value={newSprint.finalState}
                onChange={(e) => setNewSprint({...newSprint, finalState: e.target.value as ProjectState})}
              >
                {currentProject.stateDefinitions.map(stateDef => (
                  <option key={stateDef.id} value={stateDef.id}>
                    {stateDef.id} - {stateDef.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                📊 Selecione o estado que melhor representa o resultado deste sprint
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Descreva os principais resultados, impedimentos ou observações do sprint..."
                value={newSprint.observations}
                onChange={(e) => setNewSprint({...newSprint, observations: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">
                💭 Campo opcional para registrar contexto adicional sobre o sprint
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Adicionando...' : 'Adicionar Sprint'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resumo dos Sprints */}
      {sprintLogs.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            📈 Resumo da Sequência
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{sprintLogs.length}</div>
              <div className="text-sm text-blue-700">Total de Sprints</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Sprint {sprintLogs.length + 1}</div>
              <div className="text-sm text-green-700">Próximo Sprint</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {sprintLogs.length > 1 ? 
                  Math.round((new Date(sprintLogs[sprintLogs.length - 1].endDate).getTime() - new Date(sprintLogs[0].endDate).getTime()) / (sprintLogs.length - 1) / (24 * 60 * 60 * 1000)) 
                  : 'N/A'} dias
              </div>
              <div className="text-sm text-purple-700">Duração Média</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(() => {
                  const lastSprint = sprintLogs[sprintLogs.length - 1];
                  const daysSinceEnd = Math.floor((new Date().getTime() - new Date(lastSprint.endDate).getTime()) / (24 * 60 * 60 * 1000));
                  return daysSinceEnd >= 0 ? `${daysSinceEnd} dias` : `${Math.abs(daysSinceEnd)} dias`;
                })()}
              </div>
              <div className="text-sm text-orange-700">
                {(() => {
                  const lastSprint = sprintLogs[sprintLogs.length - 1];
                  const daysSinceEnd = Math.floor((new Date().getTime() - new Date(lastSprint.endDate).getTime()) / (24 * 60 * 60 * 1000));
                  return daysSinceEnd >= 0 ? 'Desde Último Sprint' : 'Para Término';
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {sprintLogs.length > 0 ? (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              📋 Histórico de Sprints
              <span className="ml-2 text-sm font-normal text-gray-500">({sprintLogs.length} sprints registrados)</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sprint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Término
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duração
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado Final
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observações
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sprintLogs
                  .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
                  .map((sprint) => (
                  <tr key={sprint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                          {sprint.sprintName ? sprint.sprintName.replace('Sprint ', '') : '?'}
                        </span>
                        {sprint.sprintName || 'Sprint sem nome'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium">{formatDate(sprint.endDate)}</div>
                        <div className="text-xs text-gray-400">
                          {(() => {
                            const endDate = new Date(sprint.endDate);
                            const today = new Date();
                            const daysDiff = Math.ceil((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
                            if (daysDiff > 0) return `em ${daysDiff} dias`;
                            if (daysDiff === 0) return 'hoje';
                            return `há ${Math.abs(daysDiff)} dias`;
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        const sortedSprints = sprintLogs.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
                        const sortedIndex = sortedSprints.findIndex(s => s.id === sprint.id);
                        
                        if (sortedIndex === 0) {
                          return <span className="text-gray-400 text-xs">Primeiro sprint</span>;
                        }
                        
                        const currentSprintDate = new Date(sprint.endDate);
                        const previousSprintDate = new Date(sortedSprints[sortedIndex - 1].endDate);
                        const durationDays = Math.ceil((currentSprintDate.getTime() - previousSprintDate.getTime()) / (24 * 60 * 60 * 1000));
                        
                        return (
                          <div className="text-center">
                            <div className="font-medium">{durationDays} dias</div>
                            <div className="text-xs text-gray-400">
                              {durationDays === 14 ? '✅ Padrão' : 
                               durationDays > 14 ? '📈 Longo' : 
                               '📉 Curto'}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStateColor(sprint.finalState)}`}>
                        {sprint.finalState} - {getStateName(sprint.finalState)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <div className="truncate" title={sprint.observations || ''}>
                        {sprint.observations || <span className="text-gray-400 italic">Sem observações</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {(() => {
                        // Verificar se há sprints disponíveis
                        if (sprintLogs.length === 0) return null;
                        
                        // Encontrar o último sprint inserido (mais recente por createdAt)
                        const lastInsertedSprint = sprintLogs.reduce((latest, current) => 
                          new Date(current.createdAt).getTime() > new Date(latest.createdAt).getTime() ? current : latest
                        );
                        
                        // Verificar se este é o último sprint inserido
                        const isLastInserted = sprint.id === lastInsertedSprint.id;
                        
                        if (isLastInserted) {
                          return (
                            <div className="flex flex-col items-center space-y-1">
                              <button
                                onClick={() => {
                                  if (window.confirm(`Tem certeza que deseja excluir o ${sprint.sprintName}?\n\nEsta ação não pode ser desfeita e pode afetar os cálculos de Markov.`)) {
                                    deleteSprintLog(sprint.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors border border-red-200 hover:border-red-300"
                                title="Excluir último sprint inserido"
                              >
                                🗑️
                              </button>
                              <span className="text-xs text-green-600 font-medium">Último</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex flex-col items-center space-y-1">
                              <span className="text-gray-400 p-2" title="Apenas o último sprint inserido pode ser excluído">
                                🔒
                              </span>
                              <span className="text-xs text-gray-400">Protegido</span>
                            </div>
                          );
                        }
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum sprint registrado
          </h3>
          <p className="text-gray-600 mb-6">
            Adicione sprints para começar a gerar análises preditivas.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            Adicionar Primeiro Sprint
          </button>
        </div>
      )}
    </div>
  );
}

export default SprintLogPage;