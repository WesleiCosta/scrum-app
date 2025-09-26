import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';

function ProjectsPage() {
  const { user } = useAuth();
  const { projects, currentProject, setCurrentProject, createProject, deleteProject } = useProject();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    setLoading(true);
    try {
      const project = await createProject({
        name: newProject.name,
        description: newProject.description,
        memberIds: [],
        stateDefinitions: [], // Add an empty array or provide initial state definitions as needed
      });
      setCurrentProject(project);
      setNewProject({ name: '', description: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setLoading(true);
    try {
      await deleteProject(projectId);
      setProjectToDelete(null);
      setConfirmDeleteText('');
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      alert('Erro ao deletar projeto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirmation = (projectId: string) => {
    setProjectToDelete(projectId);
    setConfirmDeleteText('');
  };

  const closeDeleteConfirmation = () => {
    setProjectToDelete(null);
    setConfirmDeleteText('');
  };

  const getProjectToDelete = () => {
    return projects.find(p => p.id === projectToDelete);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Projetos</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          + Novo Projeto
        </button>
      </div>

      {showCreateForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Criar Novo Projeto</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Projeto *
              </label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Sistema de Vendas"
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Descrição do projeto (opcional)"
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Criando...' : 'Criar Projeto'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`card p-6 transition-all hover:shadow-md ${
              currentProject?.id === project.id
                ? 'ring-2 ring-primary-500 ring-opacity-50'
                : ''
            }`}
          >
            <div className="cursor-pointer" onClick={() => setCurrentProject(project)}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-gray-600 text-sm mb-4">
                  {project.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{project.adminId === user?.id ? 'Administrador' : 'Membro'}</span>
                <span>{new Date(project.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              {currentProject?.id === project.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-primary-600">
                    ✓ Projeto Atual
                  </span>
                </div>
              )}
            </div>
            
            {/* Botão de exclusão (apenas para administradores) */}
            {project.adminId === user?.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteConfirmation(project.id);
                  }}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 py-2 px-3 rounded-md text-sm font-medium transition-colors"
                  title="Excluir projeto e todos os sprints associados"
                >
                  🗑️ Excluir Projeto
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {projects.length === 0 && !showCreateForm && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum projeto encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            Crie seu primeiro projeto para começar a usar o Scrum-Markov.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Criar Primeiro Projeto
          </button>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <span className="text-red-600 text-2xl">⚠️</span>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Excluir Projeto Permanentemente
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Você está prestes a excluir o projeto <strong>"{getProjectToDelete()?.name}"</strong>.
                </p>
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <p className="text-sm text-red-700">
                    <strong>⚠️ ATENÇÃO:</strong> Esta ação é <strong>irreversível</strong> e irá:
                  </p>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    <li>Excluir o projeto permanentemente</li>
                    <li>Remover <strong>TODOS</strong> os sprints associados</li>
                    <li>Apagar todas as matrizes de transição</li>
                    <li>Perder todo o histórico de dados</li>
                  </ul>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  Para confirmar, digite <strong>EXCLUIR</strong> no campo abaixo:
                </p>
                <input
                  type="text"
                  className="input"
                  placeholder="Digite EXCLUIR para confirmar"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => projectToDelete && handleDeleteProject(projectToDelete)}
                  disabled={confirmDeleteText !== 'EXCLUIR' || loading}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    confirmDeleteText === 'EXCLUIR' && !loading
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Excluindo...' : 'Excluir Permanentemente'}
                </button>
                <button
                  onClick={closeDeleteConfirmation}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;