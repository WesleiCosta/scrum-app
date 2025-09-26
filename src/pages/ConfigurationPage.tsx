import { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { StateDefinition } from '../types';

function ConfigurationPage() {
  const { currentProject, updateStateDefinitions } = useProject();
  const [definitions, setDefinitions] = useState<StateDefinition[]>(
    currentProject?.stateDefinitions || []
  );
  const [loading, setLoading] = useState(false);
  const [editingState, setEditingState] = useState<string | null>(null);

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📁</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Nenhum projeto selecionado
        </h2>
        <p className="text-gray-600">
          Selecione um projeto para configurar seus estados.
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateStateDefinitions(currentProject.id, definitions);
      setEditingState(null);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDefinition = (stateId: string, field: keyof StateDefinition, value: any) => {
    setDefinitions(prev => prev.map(def => 
      def.id === stateId ? { ...def, [field]: value } : def
    ));
  };

  const addCriteria = (stateId: string) => {
    const definition = definitions.find(def => def.id === stateId);
    if (definition) {
      updateDefinition(stateId, 'criteria', [...definition.criteria, '']);
    }
  };

  const updateCriteria = (stateId: string, index: number, value: string) => {
    const definition = definitions.find(def => def.id === stateId);
    if (definition) {
      const newCriteria = [...definition.criteria];
      newCriteria[index] = value;
      updateDefinition(stateId, 'criteria', newCriteria);
    }
  };

  const removeCriteria = (stateId: string, index: number) => {
    const definition = definitions.find(def => def.id === stateId);
    if (definition) {
      const newCriteria = definition.criteria.filter((_, i) => i !== index);
      updateDefinition(stateId, 'criteria', newCriteria);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-1">{currentProject.name}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Estados do Projeto
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Customize as definições dos 5 estados para alinhá-los à realidade da sua equipe.
          </p>

          <div className="space-y-6">
            {definitions.map((definition) => (
              <div key={definition.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${definition.bgColor} ${definition.color}`}>
                      {definition.id}
                    </span>
                    {editingState === definition.id ? (
                      <input
                        type="text"
                        value={definition.name}
                        onChange={(e) => updateDefinition(definition.id, 'name', e.target.value)}
                        className="font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-primary-500 outline-none"
                      />
                    ) : (
                      <h3 className="font-semibold text-gray-900">{definition.name}</h3>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingState(editingState === definition.id ? null : definition.id)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {editingState === definition.id ? 'Finalizar' : 'Editar'}
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    {editingState === definition.id ? (
                      <textarea
                        value={definition.description}
                        onChange={(e) => updateDefinition(definition.id, 'description', e.target.value)}
                        className="input min-h-[60px]"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{definition.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Critérios de Avaliação
                    </label>
                    <div className="space-y-2">
                      {definition.criteria.map((criteria, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-gray-400">•</span>
                          {editingState === definition.id ? (
                            <>
                              <input
                                type="text"
                                value={criteria}
                                onChange={(e) => updateCriteria(definition.id, index, e.target.value)}
                                className="flex-1 input"
                                placeholder="Critério de avaliação"
                              />
                              <button
                                onClick={() => removeCriteria(definition.id, index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <span className="text-sm text-gray-600">{criteria}</span>
                          )}
                        </div>
                      ))}
                      {editingState === definition.id && (
                        <button
                          onClick={() => addCriteria(definition.id)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          + Adicionar Critério
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informações do Projeto
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Nome:</span>
              <span className="ml-2 text-gray-600">{currentProject.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Criado em:</span>
              <span className="ml-2 text-gray-600">
                {new Date(currentProject.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Última atualização:</span>
              <span className="ml-2 text-gray-600">
                {new Date(currentProject.updatedAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Membros:</span>
              <span className="ml-2 text-gray-600">{currentProject.memberIds.length + 1}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigurationPage;