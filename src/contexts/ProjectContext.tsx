import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, ProjectContextType, StateDefinition } from '../types';
import { projectsStorage, generateId, migrateSprintLogs } from '../utils/storage';
import { DEFAULT_STATE_DEFINITIONS } from '../utils/constants';
import { useAuth } from './AuthContext';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (user) {
      loadUserProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
    }
  }, [user]);

  const loadUserProjects = () => {
    if (!user) return;
    
    // Migrar dados legados se necessário
    migrateSprintLogs();
    
    const allProjects = projectsStorage.get();
    const userProjects = allProjects.filter(project => 
      project.adminId === user.id || project.memberIds.includes(user.id)
    );
    setProjects(userProjects);
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'adminId' | 'stateDefinitions'>): Promise<Project> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const newProject: Project = {
      ...projectData,
      id: generateId(),
      adminId: user.id,
      stateDefinitions: DEFAULT_STATE_DEFINITIONS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projectsStorage.add(newProject);
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    if (project.adminId !== user.id) {
      throw new Error('Apenas o administrador pode atualizar o projeto');
    }

    projectsStorage.update(projectId, updates);
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ));

    if (currentProject?.id === projectId) {
      setCurrentProject(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
    }
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    if (project.adminId !== user.id) {
      throw new Error('Apenas o administrador pode deletar o projeto');
    }

    // Remover todos os dados associados ao projeto
    projectsStorage.removeProjectWithSprints(projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));

    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }
  };

  const inviteMember = async (projectId: string, email: string): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    if (project.adminId !== user.id) {
      throw new Error('Apenas o administrador pode convidar membros');
    }

    // Em uma aplicação real, isso enviaria um convite por email
    // Por simplicidade, vamos apenas simular o processo
    console.log(`Convite enviado para ${email} para o projeto ${project.name}`);
  };

  const removeMember = async (projectId: string, userId: string): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    if (project.adminId !== user.id) {
      throw new Error('Apenas o administrador pode remover membros');
    }

    const updatedMemberIds = project.memberIds.filter(id => id !== userId);
    await updateProject(projectId, { memberIds: updatedMemberIds });
  };

  const updateStateDefinitions = async (projectId: string, definitions: StateDefinition[]): Promise<void> => {
    await updateProject(projectId, { stateDefinitions: definitions });
  };

  const value: ProjectContextType = {
    currentProject,
    projects,
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    inviteMember,
    removeMember,
    updateStateDefinitions
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextType {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject deve ser usado dentro de um ProjectProvider');
  }
  return context;
}