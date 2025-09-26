import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';

function ProjectsPage() {
  const { user } = useAuth();
  const { projects, currentProject, setCurrentProject, createProject } = useProject();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

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
            className={`card p-6 cursor-pointer transition-all hover:shadow-md ${
              currentProject?.id === project.id
                ? 'ring-2 ring-primary-500 ring-opacity-50'
                : ''
            }`}
            onClick={() => setCurrentProject(project)}
          >
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
    </div>
  );
}

export default ProjectsPage;