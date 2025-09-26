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
    sprintName: '',
    endDate: '',
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
    if (!newSprint.sprintName.trim() || !newSprint.endDate) return;

    setLoading(true);
    try {
      await addSprintLog({
        projectId: currentProject.id,
        sprintName: newSprint.sprintName,
        endDate: newSprint.endDate,
        finalState: newSprint.finalState,
        observations: newSprint.observations
      });
      setNewSprint({
        sprintName: '',
        endDate: '',
        finalState: 'ESTÁVEL',
        observations: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Erro ao adicionar sprint:', error);
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome/Número do Sprint *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Sprint 15"
                  value={newSprint.sprintName}
                  onChange={(e) => setNewSprint({...newSprint, sprintName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Término *
                </label>
                <input
                  type="date"
                  className="input"
                  value={newSprint.endDate}
                  onChange={(e) => setNewSprint({...newSprint, endDate: e.target.value})}
                  required
                />
              </div>
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Observações sobre o sprint (opcional)"
                value={newSprint.observations}
                onChange={(e) => setNewSprint({...newSprint, observations: e.target.value})}
              />
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

      {sprintLogs.length > 0 ? (
        <div className="card">
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
                  <tr key={sprint.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sprint.sprintName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sprint.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStateColor(sprint.finalState)}`}>
                        {sprint.finalState} - {getStateName(sprint.finalState)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {sprint.observations || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => deleteSprintLog(sprint.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        🗑️
                      </button>
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