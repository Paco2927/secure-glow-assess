-- Eliminar todas las sesiones activas del usuario management@techsecureai.com
DELETE FROM auth.sessions 
WHERE user_id = 'da6d53f6-43f9-4b18-bb3e-66418b0e77c0';

-- Verificar que se eliminaron las sesiones
SELECT COUNT(*) as remaining_sessions 
FROM auth.sessions 
WHERE user_id = 'da6d53f6-43f9-4b18-bb3e-66418b0e77c0';