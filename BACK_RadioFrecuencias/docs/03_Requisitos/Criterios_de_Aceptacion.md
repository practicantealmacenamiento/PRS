# Criterios de Aceptacion

- **CA-01**: Dado un administrador autenticado, cuando ejecuta `POST /api/empleados/` con una cedula nueva, entonces recibe `201 Created`, la respuesta incluye `id` y el empleado aparece en `GET /api/empleados/?q={cedula}`.
- **CA-02**: Dado un empleado existente, cuando se actualiza via `PUT /api/empleados/{cedula}/` modificando `nombre`, la respuesta es `200 OK`, `audit_log` registra `action=UPDATED` y la consulta `GET /api/audit-log/?aggregate=Empleado&id_ref={cedula}` refleja los cambios.
- **CA-03**: Dado un radio activo, cuando se asigna a un empleado con `POST /api/prestamos/`, la respuesta contiene `estado=ASIGNADO` y `turno` calculado; ademas `GET /api/prestamos/?codigo_radio=` muestra el registro en la primera posicion.
- **CA-04**: Dado un prestamo abierto, cuando se intenta crear otro con la misma `cedula`, la API responde `400 Bad Request` con mensaje `Empleado {cedula} ya tiene prestamo abierto`.
- **CA-05**: Dado un prestamo abierto, cuando se invoca `POST /api/prestamos/devolver-por-radio/` con el `codigo_radio`, entonces el servicio retorna `estado=DEVUELTO`, `fecha_hora_devolucion` no es nula y la siguiente asignacion para esa radio se permite.
- **CA-06**: Dado un usuario SAP registrado, cuando se vincula a un empleado via `PATCH /api/sap-usuarios/{username}/` enviando `empleado_cedula`, `GET /api/sap-usuarios/{username}/` refleja `empleado_id` y `empleado_cedula` actualizados.
- **CA-07**: Dado un administrador, cuando crea un usuario de aplicacion con `POST /api/usuarios-app/`, puede autenticarse inmediatamente con `POST /api/token/` utilizando las credenciales asignadas.
- **CA-08**: Dado cualquier operacion administrativa (crear, actualizar o eliminar catalogos), cuando se consulta `/api/audit-log/` ordenado por fecha, se observa un evento con `actor_user_id` igual al usuario que realizo la accion.
- **CA-09**: Dado que `DEBUG=False` y se configura `ALLOWED_HOSTS`, el servidor rechaza solicitudes desde origenes no autorizados, respondiendo `400 Bad Request`.
