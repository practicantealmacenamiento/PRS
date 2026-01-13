# Plan de Despliegue

## Preparativos
- Confirmar que la rama objetivo tenga pipeline verde (lint, build).
- Validar que las variables `NEXT_PUBLIC_API_URL` esten definidas en el entorno destino.
- Verificar que el backend este disponible y con CORS configurado.

## Pasos por entorno
1. **Conexion y sincronizacion**
   - Obtener el codigo (git pull o artefacto).
2. **Instalacion de dependencias**
   - Ejecutar `npm install`.
3. **Configuracion**
   - Definir `NEXT_PUBLIC_API_URL` (y opcionalmente `NEXT_PUBLIC_API_BASE_URL`).
4. **Build**
   - Ejecutar `npm run build`.
5. **Arranque**
   - Ejecutar `npm run start` o iniciar con el gestor de procesos del servidor.
6. **Smoke test**
   - Validar login, prestamos, historico y panel admin con un usuario real.

## Post despliegue
- Monitorear errores de cliente y respuestas 401/403.
- Confirmar que el tema y assets se cargan sin errores.
- Registrar el despliegue en bitacora (version, fecha, responsable).

## Rollback y contingencias
- Mantener el build anterior disponible.
- En caso de falla, revertir al artefacto previo y limpiar cache del servidor/CDN.
- Comunicar el incidente y estimar ventana de correccion.

## Escalabilidad y alta disponibilidad
- Desplegar detras de un balanceador o CDN.
- Habilitar cache de assets estaticos en CDN.
- Considerar despliegue en plataformas gestionadas (Vercel, Azure, Netlify).
