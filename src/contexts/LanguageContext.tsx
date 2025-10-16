import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
  es: {
    // Common
    'common.loading': 'Cargando...',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.create': 'Crear',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.actions': 'Acciones',
    'common.logout': 'Cerrar sesión',
    'common.profile': 'Perfil',
    
    // Dashboard
    'dashboard.title': 'TechSecureIA',
    'dashboard.subtitle': 'Evaluaciones de Ciberseguridad con IA',
    'dashboard.description': 'Realiza evaluaciones completas de ciberseguridad basadas en marcos de trabajo internacionales como ISO 27001 y NIST CSF.',
    'dashboard.admin': 'Admin',
    'dashboard.iso27001': 'Evaluación ISO 27001',
    'dashboard.iso27001.desc': 'Realiza una evaluación completa basada en los controles de ISO 27001.',
    'dashboard.nist': 'Evaluación NIST CSF',
    'dashboard.nist.desc': 'Evalúa tu organización según el Marco de Ciberseguridad de NIST.',
    'dashboard.organizations': 'Gestión de Organizaciones',
    'dashboard.organizations.desc': 'Administra las organizaciones y sus evaluaciones.',
    'dashboard.reports': 'Informes y Resultados',
    'dashboard.reports.desc': 'Visualiza informes detallados de tus evaluaciones.',
    'dashboard.features': 'Características Principales',
    'dashboard.features.desc': 'Evaluaciones basadas en estándares internacionales, análisis detallados, informes personalizados.',
    
    // Auth
    'auth.title': 'TechSecureIA',
    'auth.subtitle': 'Evaluaciones de Ciberseguridad',
    'auth.login': 'Iniciar Sesión',
    'auth.signup': 'Registrarse',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.name': 'Nombre Completo',
    'auth.dni': 'DNI',
    'auth.login.button': 'Iniciar Sesión',
    'auth.signup.button': 'Crear Cuenta',
    'auth.login.success': 'Inicio de sesión exitoso',
    'auth.signup.success': 'Usuario creado exitosamente',
    'auth.error': 'Error de autenticación',
    
    // Assessment ISO
    'assessment.iso.title': 'Evaluación ISO 27001',
    'assessment.iso.finish': 'Finalizar Evaluación',
    'assessment.iso.selectOrg': 'Selecciona una Organización',
    'assessment.iso.instructions': 'Instrucciones: Para cada control, selecciona el nivel de madurez correspondiente',
    'assessment.iso.levels': 'Niveles de Madurez',
    'assessment.iso.selectAll': 'Por favor selecciona un nivel para todos los controles',
    'assessment.iso.success': 'Evaluación guardada exitosamente',
    'assessment.iso.error': 'Error al guardar la evaluación',
    
    // Assessment NIST
    'assessment.nist.title': 'Evaluación NIST CSF',
    'assessment.nist.finish': 'Finalizar Evaluación',
    'assessment.nist.selectOrg': 'Selecciona una Organización',
    'assessment.nist.instructions': 'Instrucciones: Para cada control, selecciona el nivel de madurez correspondiente',
    'assessment.nist.levels': 'Niveles de Madurez',
    'assessment.nist.selectAll': 'Por favor selecciona un nivel para todos los controles',
    'assessment.nist.success': 'Evaluación guardada exitosamente',
    'assessment.nist.error': 'Error al guardar la evaluación',
    
    // Admin
    'admin.title': 'Panel de Administración',
    'admin.users': 'Gestión de Usuarios',
    'admin.domains': 'Gestión de Dominios',
    'admin.controls': 'Gestión de Controles',
    'admin.improvements': 'Planes de Mejora',
    'admin.user.name': 'Nombre',
    'admin.user.email': 'Email',
    'admin.user.role': 'Rol',
    'admin.user.actions': 'Acciones',
    'admin.user.changeRole': 'Cambiar Rol',
    
    // Profile
    'profile.title': 'Mi Perfil',
    'profile.avatar': 'Avatar',
    'profile.upload': 'Subir Imagen',
    'profile.name': 'Nombre',
    'profile.email': 'Correo Electrónico',
    'profile.password': 'Contraseña',
    'profile.newPassword': 'Nueva Contraseña',
    'profile.update': 'Actualizar',
    'profile.success': 'Perfil actualizado exitosamente',
    'profile.error': 'Error al actualizar el perfil',
    
    // Results
    'results.title': 'Resultados de Evaluaciones',
    'results.organization': 'Organización',
    'results.date': 'Fecha',
    'results.type': 'Tipo',
    'results.score': 'Puntuación',
    'results.view': 'Ver Detalles',
    'results.domain': 'Dominio',
    'results.controls': 'Controles',
    'results.improvementPlan': 'Plan de Mejora',
    'results.expand': 'Expandir',
    'results.collapse': 'Colapsar',
    
    // Reports
    'reports.title': 'Informes',
    'reports.viewMore': 'Ver Más',
    
    // Organizations
    'organizations.title': 'Gestión de Organizaciones',
    'organizations.create': 'Crear Organización',
    'organizations.name': 'Nombre',
    'organizations.description': 'Descripción',
    'organizations.success': 'Organización guardada exitosamente',
    'organizations.error': 'Error al guardar la organización',
    
    // Not Found
    'notfound.title': '404',
    'notfound.message': '¡Ups! Página no encontrada',
    'notfound.back': 'Volver al Inicio',
  },
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.actions': 'Actions',
    'common.logout': 'Logout',
    'common.profile': 'Profile',
    
    // Dashboard
    'dashboard.title': 'TechSecureIA',
    'dashboard.subtitle': 'AI-Powered Cybersecurity Assessments',
    'dashboard.description': 'Conduct comprehensive cybersecurity assessments based on international frameworks such as ISO 27001 and NIST CSF.',
    'dashboard.admin': 'Admin',
    'dashboard.iso27001': 'ISO 27001 Assessment',
    'dashboard.iso27001.desc': 'Conduct a comprehensive assessment based on ISO 27001 controls.',
    'dashboard.nist': 'NIST CSF Assessment',
    'dashboard.nist.desc': 'Assess your organization according to the NIST Cybersecurity Framework.',
    'dashboard.organizations': 'Organization Management',
    'dashboard.organizations.desc': 'Manage organizations and their assessments.',
    'dashboard.reports': 'Reports and Results',
    'dashboard.reports.desc': 'View detailed reports of your assessments.',
    'dashboard.features': 'Key Features',
    'dashboard.features.desc': 'Assessments based on international standards, detailed analysis, customized reports.',
    
    // Auth
    'auth.title': 'TechSecureIA',
    'auth.subtitle': 'Cybersecurity Assessments',
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.dni': 'ID Number',
    'auth.login.button': 'Login',
    'auth.signup.button': 'Create Account',
    'auth.login.success': 'Login successful',
    'auth.signup.success': 'User created successfully',
    'auth.error': 'Authentication error',
    
    // Assessment ISO
    'assessment.iso.title': 'ISO 27001 Assessment',
    'assessment.iso.finish': 'Complete Assessment',
    'assessment.iso.selectOrg': 'Select an Organization',
    'assessment.iso.instructions': 'Instructions: For each control, select the corresponding maturity level',
    'assessment.iso.levels': 'Maturity Levels',
    'assessment.iso.selectAll': 'Please select a level for all controls',
    'assessment.iso.success': 'Assessment saved successfully',
    'assessment.iso.error': 'Error saving assessment',
    
    // Assessment NIST
    'assessment.nist.title': 'NIST CSF Assessment',
    'assessment.nist.finish': 'Complete Assessment',
    'assessment.nist.selectOrg': 'Select an Organization',
    'assessment.nist.instructions': 'Instructions: For each control, select the corresponding maturity level',
    'assessment.nist.levels': 'Maturity Levels',
    'assessment.nist.selectAll': 'Please select a level for all controls',
    'assessment.nist.success': 'Assessment saved successfully',
    'assessment.nist.error': 'Error saving assessment',
    
    // Admin
    'admin.title': 'Administration Panel',
    'admin.users': 'User Management',
    'admin.domains': 'Domain Management',
    'admin.controls': 'Control Management',
    'admin.improvements': 'Improvement Plans',
    'admin.user.name': 'Name',
    'admin.user.email': 'Email',
    'admin.user.role': 'Role',
    'admin.user.actions': 'Actions',
    'admin.user.changeRole': 'Change Role',
    
    // Profile
    'profile.title': 'My Profile',
    'profile.avatar': 'Avatar',
    'profile.upload': 'Upload Image',
    'profile.name': 'Name',
    'profile.email': 'Email',
    'profile.password': 'Password',
    'profile.newPassword': 'New Password',
    'profile.update': 'Update',
    'profile.success': 'Profile updated successfully',
    'profile.error': 'Error updating profile',
    
    // Results
    'results.title': 'Assessment Results',
    'results.organization': 'Organization',
    'results.date': 'Date',
    'results.type': 'Type',
    'results.score': 'Score',
    'results.view': 'View Details',
    'results.domain': 'Domain',
    'results.controls': 'Controls',
    'results.improvementPlan': 'Improvement Plan',
    'results.expand': 'Expand',
    'results.collapse': 'Collapse',
    
    // Reports
    'reports.title': 'Reports',
    'reports.viewMore': 'View More',
    
    // Organizations
    'organizations.title': 'Organization Management',
    'organizations.create': 'Create Organization',
    'organizations.name': 'Name',
    'organizations.description': 'Description',
    'organizations.success': 'Organization saved successfully',
    'organizations.error': 'Error saving organization',
    
    // Not Found
    'notfound.title': '404',
    'notfound.message': 'Oops! Page not found',
    'notfound.back': 'Return to Home',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'es') ? saved : 'es';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['es']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
