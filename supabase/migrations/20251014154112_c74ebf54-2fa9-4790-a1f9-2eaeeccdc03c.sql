-- Insert all ISO 27001 Controls for A5
INSERT INTO public.controls (code, name, description, domain_id)
SELECT '5.1', 'Políticas de seguridad', '¿La organización define, revisa y comunica formalmente las políticas de seguridad de la información a todos los empleados y partes relevantes?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.2', 'Funciones y responsabilidades', '¿Se encuentran claramente definidas y asignadas las funciones y responsabilidades específicas relacionadas con la seguridad de la información?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.3', 'Segregación de funciones', '¿Se aplican y mantienen mecanismos de segregación de funciones para reducir el riesgo de errores o fraudes?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.4', 'Responsabilidades de la gerencia', '¿La alta dirección demuestra activamente su apoyo y compromiso con el SGSI?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.5', 'Contacto con autoridades', '¿La organización mantiene contactos identificados con las autoridades relevantes?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.6', 'Contacto con grupos especiales', '¿La organización participa con grupos de interés especial en seguridad?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.7', 'Inteligencia sobre amenazas', '¿La organización recopila y analiza información sobre amenazas cibernéticas?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.8', 'Seguridad en proyectos', '¿Se integran requisitos de seguridad en todos los proyectos?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.9', 'Inventario de activos', '¿Se mantiene un inventario actualizado de activos de información?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.10', 'Uso aceptable', '¿Existen reglas claras sobre el uso aceptable de activos?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.11', 'Devolución de activos', '¿Existe proceso formal para devolución de activos?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.12', 'Clasificación de información', '¿Se utiliza esquema de clasificación de información?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.13', 'Etiquetado de información', '¿Los activos están etiquetados según clasificación?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.14', 'Transferencia de información', '¿Se protege la información durante transferencia?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.15', 'Control de acceso', '¿Se aplica principio de mínimo privilegio?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.16', 'Gestión de identidad', '¿Se gestiona ciclo de vida de identidades?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.17', 'Información de autenticación', '¿Las credenciales están protegidas adecuadamente?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.18', 'Derechos de acceso', '¿Se revisan periódicamente derechos de acceso?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.19', 'Seguridad con proveedores', '¿Se evalúan riesgos antes de contratar proveedores?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.20', 'Acuerdos con proveedores', '¿Los acuerdos incluyen requisitos de seguridad?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.21', 'Cadena de suministro TIC', '¿Se extienden requisitos a cadena completa?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.22', 'Monitoreo de proveedores', '¿Se monitoriza desempeño de proveedores?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.23', 'Servicios en nube', '¿Uso de cloud sigue política de seguridad?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.24', 'Planificación de incidentes', '¿Existe plan formal para gestión de incidentes?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.25', 'Evaluación de eventos', '¿Eventos se evalúan sistemáticamente?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.26', 'Respuesta a incidentes', '¿Existe proceso estructurado de respuesta?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.27', 'Aprender de incidentes', '¿Se analizan lecciones aprendidas?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.28', 'Recolección de evidencia', '¿Existen procedimientos para evidencia digital?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.29', 'Seguridad durante interrupciones', '¿Se mantiene seguridad durante interrupciones?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.30', 'Continuidad TIC', '¿Sistemas TI preparados para continuidad?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.31', 'Requisitos legales', '¿Se cumplen requisitos legales y contractuales?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.32', 'Propiedad intelectual', '¿Se protegen derechos de propiedad?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.33', 'Protección de registros', '¿Registros críticos están protegidos?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.34', 'Privacidad y PII', '¿Se garantiza privacidad de datos personales?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.35', 'Revisión independiente', '¿SGSI tiene revisiones independientes?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.36', 'Cumplimiento de políticas', '¿Se verifica cumplimiento de políticas?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales'
UNION ALL SELECT '5.37', 'Procedimientos documentados', '¿Operaciones siguen procedimientos documentados?', d.id FROM public.domains d WHERE d.name = 'A5 - Controles Organizacionales';

-- A6 Controls
INSERT INTO public.controls (code, name, description, domain_id)
SELECT '6.1', 'Detección previa al empleo', '¿Se realizan verificaciones de antecedentes?', d.id FROM public.domains d WHERE d.name = 'A6 - Controles Orientados a Personas'
UNION ALL SELECT '6.2', 'Términos de empleo', '¿Contratos incluyen responsabilidades de seguridad?', d.id FROM public.domains d WHERE d.name = 'A6 - Controles Orientados a Personas'
UNION ALL SELECT '6.3', 'Capacitación en seguridad', '¿Todos reciben capacitación periódica?', d.id FROM public.domains d WHERE d.name = 'A6 - Controles Orientados a Personas'
UNION ALL SELECT '6.4', 'Proceso disciplinario', '¿Existe proceso para violaciones de seguridad?', d.id FROM public.domains d WHERE d.name = 'A6 - Controles Orientados a Personas'
UNION ALL SELECT '6.5', 'Terminación de empleo', '¿Se gestionan accesos al terminar empleo?', d.id FROM public.domains d WHERE d.name = 'A6 - Controles Orientados a Personas'
UNION ALL SELECT '6.6', 'Acuerdos de confidencialidad', '¿Todos han firmado acuerdos vigentes?', d.id FROM public.domains d WHERE d.name = 'A6 - Controles Orientados a Personas'
UNION ALL SELECT '6.7', 'Trabajo remoto', '¿Trabajo remoto tiene controles equivalentes?', d.id FROM public.domains d WHERE d.name = 'A6 - Controles Orientados a Personas'
UNION ALL SELECT '6.8', 'Reporte de eventos', '¿Se facilita reporte de eventos?', d.id FROM public.domains d WHERE d.name = 'A6 - Controles Orientados a Personas';

-- A7 Controls
INSERT INTO public.controls (code, name, description, domain_id)
SELECT '7.1', 'Perímetros físicos', '¿Instalaciones están protegidas por perímetros?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.2', 'Entrada física', '¿Acceso físico se controla y registra?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.3', 'Protección de instalaciones', '¿Áreas seguras tienen protecciones robustas?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.4', 'Monitoreo físico', '¿Áreas sensibles son monitoreadas?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.5', 'Amenazas físicas', '¿Existen protecciones contra amenazas físicas?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.6', 'Trabajo en áreas seguras', '¿Trabajo en áreas seguras sigue procedimientos?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.7', 'Escritorio limpio', '¿Se aplican políticas de escritorio limpio?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.8', 'Ubicación de equipos', '¿Equipos ubicados para reducir riesgos?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.9', 'Activos fuera', '¿Activos fuera de instalaciones protegidos?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.10', 'Medios de almacenamiento', '¿Medios extraíbles están protegidos?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.11', 'Utilidades de soporte', '¿Servicios críticos tienen respaldos?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.12', 'Seguridad del cableado', '¿Cableado protegido contra interceptaciones?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.13', 'Mantenimiento de equipos', '¿Mantenimiento sigue procedimientos seguros?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos'
UNION ALL SELECT '7.14', 'Eliminación de equipos', '¿Equipos se borran antes de desechar?', d.id FROM public.domains d WHERE d.name = 'A7 - Controles Físicos';

-- A8 Controls (split into multiple inserts due to length)
INSERT INTO public.controls (code, name, description, domain_id)
SELECT '8.1', 'Dispositivos de usuario', '¿Dispositivos tienen controles configurados?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.2', 'Acceso privilegiado', '¿Accesos privilegiados se restringen?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.3', 'Restricción de información', '¿Accesos restringidos según clasificación?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.4', 'Acceso a código fuente', '¿Acceso a código fuente está restringido?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.5', 'Autenticación segura', '¿Mecanismos de autenticación son seguros?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.6', 'Gestión de capacidad', '¿Se monitoriza capacidad de sistemas?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.7', 'Protección contra malware', '¿Existen defensas actualizadas?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.8', 'Gestión de vulnerabilidades', '¿Se escanean y parchean vulnerabilidades?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.9', 'Gestión de configuración', '¿Configuraciones se documentan y revisan?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.10', 'Eliminación de información', '¿Información se elimina de forma segura?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.11', 'Enmascaramiento de datos', '¿Datos enmascarados en no-producción?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.12', 'Prevención fuga datos', '¿Existen controles DLP implementados?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.13', 'Copias de seguridad', '¿Se realizan copias periódicas?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.14', 'Redundancia', '¿Componentes críticos tienen redundancia?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.15', 'Registro de actividades', '¿Actividades se registran en logs?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.16', 'Monitoreo de logs', '¿Logs se revisan regularmente?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.17', 'Sincronización de reloj', '¿Relojes de sistemas sincronizados?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos';

INSERT INTO public.controls (code, name, description, domain_id)
SELECT '8.18', 'Programas privilegiados', '¿Uso de utilidades privilegiadas restringido?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.19', 'Instalación de software', '¿Instalación de software está restringida?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.20', 'Seguridad de redes', '¿Servicios de red están asegurados?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.21', 'Servicios de red', '¿Requisitos de red documentados?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.22', 'Segregación de redes', '¿Red segmentada en dominios?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.23', 'Filtrado web', '¿Se filtra acceso a contenido malicioso?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.24', 'Uso de criptografía', '¿Se usa cifrado para proteger información?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.25', 'Desarrollo seguro', '¿Se sigue metodología de desarrollo seguro?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.26', 'Requisitos de seguridad', '¿Se definen requisitos para aplicaciones?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.27', 'Arquitectura segura', '¿Se aplican principios en arquitectura?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.28', 'Codificación segura', '¿Desarrolladores siguen prácticas seguras?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.29', 'Pruebas de seguridad', '¿Se realizan pruebas antes de producción?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.30', 'Desarrollo subcontratado', '¿Subcontratado cumple estándares?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.31', 'Separación de entornos', '¿Entornos están separados?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.32', 'Gestión de cambios', '¿Cambios siguen proceso formal?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.33', 'Información de prueba', '¿Datos de prueba anonimizados?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos'
UNION ALL SELECT '8.34', 'Protección auditorías', '¿Auditorías minimizan interrupciones?', d.id FROM public.domains d WHERE d.name = 'A8 - Controles Tecnológicos';

-- NIST Controls
INSERT INTO public.controls (code, name, description, domain_id)
SELECT 'GV.OC-01', 'Misión organizacional', '¿Organización comprende su misión y riesgos?', d.id FROM public.domains d WHERE d.name = 'GV - Gobernar'
UNION ALL SELECT 'GV.OC-02', 'Partes interesadas', '¿Se identifican necesidades de stakeholders?', d.id FROM public.domains d WHERE d.name = 'GV - Gobernar'
UNION ALL SELECT 'GV.OC-03', 'Requisitos legales', '¿Se cumplen requisitos legales y normativos?', d.id FROM public.domains d WHERE d.name = 'GV - Gobernar'
UNION ALL SELECT 'GV.RM-01', 'Apetito de riesgo', '¿Se ha definido apetito de riesgo?', d.id FROM public.domains d WHERE d.name = 'GV - Gobernar'
UNION ALL SELECT 'GV.RM-02', 'Integración ERM', '¿Gestión de riesgo integrada con ERM?', d.id FROM public.domains d WHERE d.name = 'GV - Gobernar'
UNION ALL SELECT 'GV.RM-03', 'Método de riesgos', '¿Existe método para calcular riesgos?', d.id FROM public.domains d WHERE d.name = 'GV - Gobernar'
UNION ALL SELECT 'GV.RR-01', 'Liderazgo responsable', '¿Liderazgo responsable de riesgos?', d.id FROM public.domains d WHERE d.name = 'GV - Gobernar'
UNION ALL SELECT 'GV.RR-02', 'Funciones establecidas', '¿Funciones de seguridad comunicadas?', d.id FROM public.domains d WHERE d.name = 'GV - Gobernar'
UNION ALL SELECT 'GV.SC-01', 'Priorización proveedores', '¿Proveedores priorizados por criticidad?', d.id FROM public.domains d WHERE d.name = 'GV - Gobernar'
UNION ALL SELECT 'GV.SC-02', 'Contratos proveedores', '¿Contratos incluyen seguridad?', d.id FROM public.domains d WHERE d.name = 'GV - Gobernar';

INSERT INTO public.controls (code, name, description, domain_id)
SELECT 'ID.AM-01', 'Inventario hardware', '¿Se mantiene inventario de hardware?', d.id FROM public.domains d WHERE d.name = 'ID - Identificar'
UNION ALL SELECT 'ID.AM-02', 'Inventario software', '¿Se mantiene inventario de software?', d.id FROM public.domains d WHERE d.name = 'ID - Identificar'
UNION ALL SELECT 'ID.AM-03', 'Priorización activos', '¿Activos priorizados por criticidad?', d.id FROM public.domains d WHERE d.name = 'ID - Identificar'
UNION ALL SELECT 'ID.RA-01', 'Identificación vulnerabilidades', '¿Se identifican vulnerabilidades?', d.id FROM public.domains d WHERE d.name = 'ID - Identificar'
UNION ALL SELECT 'ID.RA-02', 'Inteligencia de amenazas', '¿Se recibe información sobre amenazas?', d.id FROM public.domains d WHERE d.name = 'ID - Identificar'
UNION ALL SELECT 'ID.RA-03', 'Evaluación de impactos', '¿Se evalúan impactos de amenazas?', d.id FROM public.domains d WHERE d.name = 'ID - Identificar';

INSERT INTO public.controls (code, name, description, domain_id)
SELECT 'PR.AA-01', 'Gestión de permisos', '¿Permisos gestionados con mínimo privilegio?', d.id FROM public.domains d WHERE d.name = 'PR - Proteger'
UNION ALL SELECT 'PR.AA-02', 'Acceso físico', '¿Acceso físico gestionado y supervisado?', d.id FROM public.domains d WHERE d.name = 'PR - Proteger'
UNION ALL SELECT 'PR.AT-01', 'Capacitación general', '¿Personal recibe capacitación?', d.id FROM public.domains d WHERE d.name = 'PR - Proteger'
UNION ALL SELECT 'PR.AT-02', 'Capacitación especializada', '¿Personal especializado capacitado?', d.id FROM public.domains d WHERE d.name = 'PR - Proteger'
UNION ALL SELECT 'PR.DS-01', 'Datos en reposo', '¿Se protegen datos almacenados?', d.id FROM public.domains d WHERE d.name = 'PR - Proteger'
UNION ALL SELECT 'PR.DS-02', 'Datos en tránsito', '¿Se protegen datos en red?', d.id FROM public.domains d WHERE d.name = 'PR - Proteger'
UNION ALL SELECT 'PR.DS-03', 'Copias de seguridad', '¿Se crean y verifican backups?', d.id FROM public.domains d WHERE d.name = 'PR - Proteger'
UNION ALL SELECT 'PR.PS-01', 'Gestión de configuración', '¿Se establecen configuraciones seguras?', d.id FROM public.domains d WHERE d.name = 'PR - Proteger'
UNION ALL SELECT 'PR.PS-02', 'Control de software', '¿Se impide software no autorizado?', d.id FROM public.domains d WHERE d.name = 'PR - Proteger';

INSERT INTO public.controls (code, name, description, domain_id)
SELECT 'DE.CM-01', 'Monitoreo de redes', '¿Se monitorizan redes para eventos adversos?', d.id FROM public.domains d WHERE d.name = 'DE - Detectar'
UNION ALL SELECT 'DE.CM-02', 'Monitoreo proveedores', '¿Se monitorizan actividades de proveedores?', d.id FROM public.domains d WHERE d.name = 'DE - Detectar'
UNION ALL SELECT 'DE.AE-01', 'Análisis de eventos', '¿Eventos adversos se analizan?', d.id FROM public.domains d WHERE d.name = 'DE - Detectar'
UNION ALL SELECT 'DE.AE-02', 'Integración inteligencia', '¿Se integra inteligencia en análisis?', d.id FROM public.domains d WHERE d.name = 'DE - Detectar';

INSERT INTO public.controls (code, name, description, domain_id)
SELECT 'RS.AN-01', 'Análisis causa raíz', '¿Se analiza causa raíz de incidentes?', d.id FROM public.domains d WHERE d.name = 'RS - Responder'
UNION ALL SELECT 'RS.AN-02', 'Registro acciones', '¿Se registran acciones de investigación?', d.id FROM public.domains d WHERE d.name = 'RS - Responder'
UNION ALL SELECT 'RS.AN-03', 'Recopilación evidencia', '¿Se recopila y protege evidencia?', d.id FROM public.domains d WHERE d.name = 'RS - Responder'
UNION ALL SELECT 'RS.AN-04', 'Estimación impacto', '¿Se estima impacto de incidentes?', d.id FROM public.domains d WHERE d.name = 'RS - Responder'
UNION ALL SELECT 'RS.MI-01', 'Contención', '¿Se contienen incidentes rápidamente?', d.id FROM public.domains d WHERE d.name = 'RS - Responder'
UNION ALL SELECT 'RS.MI-02', 'Erradicación', '¿Se erradican causas del incidente?', d.id FROM public.domains d WHERE d.name = 'RS - Responder'
UNION ALL SELECT 'RS.CO-01', 'Comunicación incidentes', '¿Se comparte información oportunamente?', d.id FROM public.domains d WHERE d.name = 'RS - Responder';

INSERT INTO public.controls (code, name, description, domain_id)
SELECT 'RC.RP-01', 'Ejecución recuperación', '¿Acciones de recuperación ejecutadas?', d.id FROM public.domains d WHERE d.name = 'RC - Recuperar'
UNION ALL SELECT 'RC.RP-02', 'Criterios operativos', '¿Se establecen criterios post-incidente?', d.id FROM public.domains d WHERE d.name = 'RC - Recuperar'
UNION ALL SELECT 'RC.RP-03', 'Verificación integridad', '¿Se verifica integridad de activos?', d.id FROM public.domains d WHERE d.name = 'RC - Recuperar'
UNION ALL SELECT 'RC.RP-04', 'Declaración fin', '¿Se declara formalmente fin de recuperación?', d.id FROM public.domains d WHERE d.name = 'RC - Recuperar'
UNION ALL SELECT 'RC.CO-01', 'Comunicación pública', '¿Se comparten actualizaciones públicas?', d.id FROM public.domains d WHERE d.name = 'RC - Recuperar';