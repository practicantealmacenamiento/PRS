# Diagramas y Modelos

## Modelo de componentes (descripcion textual)
- **Layout raiz**: `src/app/layout.tsx` renderiza `Navbar` y el contenido de rutas.
- **Navbar**: muestra accesos principales, estado de sesion y selector de tema.
- **Menu lateral**: navega entre Inicio, Prestamos y Historico.
- **Prestamos**: formulario con validaciones de cedula/SAP/RF y acciones de registrar/devolver.
- **Historico**: tabla con filtros, paginacion y exportacion.
- **Admin**: secciones de Catalogos, Auditoria y Usuarios con CRUDs.

## Flujos de secuencia (descriptivo)
1. **Inicio de sesion**
   - Usuario ingresa credenciales en `/login`.
   - `auth.ts` llama `POST /api/token/`.
   - `api.ts` persiste tokens y se establece cookie `access_token`.
   - Usuario es redirigido a `/prestamos`.
2. **Registro de prestamo**
   - Operador valida cedula, usuario SAP y radio via `GET /api/empleados/`, `/sap-usuarios/`, `/radios/`.
   - Al enviar el formulario, se ejecuta `POST /api/prestamos/`.
   - La UI muestra confirmacion y limpia el formulario.
3. **Devolucion**
   - Operador ingresa cedula, usuario SAP o codigo RF.
   - Se invoca `POST /api/prestamos/devolver/`.
   - El estado cambia a devuelto y se muestra el mensaje correspondiente.
4. **Consulta historica y exportacion**
   - La vista `/historico` carga `GET /api/prestamos/`.
   - Los filtros se aplican en cliente y se exportan filas con `csv.ts` o `xlsx.ts`.
5. **Administracion**
   - `/admin` consulta catalogos y auditoria.
   - CRUD en catalogos y usuarios se realiza via endpoints REST.

## Diagramas recomendados (pendiente de adjuntar)
- **Diagrama de componentes**: Navbar, Menu, rutas principales y modulos de admin.
- **Diagrama de secuencia**: login y registro de prestamo.
- **Diagrama de flujo de datos**: `api.ts` -> backend -> respuesta -> UI.
- **Diagrama de despliegue**: navegador, servidor Next.js y backend Django.

Hasta contar con diagramas graficos, esta descripcion narrativa sirve como referencia para comprender la arquitectura del frontend.
