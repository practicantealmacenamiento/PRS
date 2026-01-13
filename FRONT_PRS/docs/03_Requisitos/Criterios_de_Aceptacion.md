# Criterios de Aceptacion

- **CA-01**: Dado un usuario valido, cuando inicia sesion en `/login`, entonces se redirige a `/prestamos` y se almacenan `access_token` y `refresh` localmente.
- **CA-02**: Dado un usuario sin cookie de acceso, cuando navega a `/historico`, entonces es redirigido a `/login`.
- **CA-03**: Dado un empleado inexistente, cuando se ingresa la cedula en `/prestamos`, entonces se muestra el mensaje "Empleado no encontrado".
- **CA-04**: Dado un formulario valido, cuando se crea un prestamo, entonces la UI muestra confirmacion con el ID retornado por la API.
- **CA-05**: Dada una devolucion por codigo RF, cuando se ejecuta `Devolver`, entonces la UI muestra mensaje de exito.
- **CA-06**: Dado un administrador, cuando crea un empleado en `/admin`, entonces el registro aparece en la tabla con estado activo.
- **CA-07**: Dado un administrador, cuando consulta la auditoria, entonces la UI muestra eventos con fecha, actor y resumen de cambios.
- **CA-08**: Dado un historico filtrado, cuando se exporta a CSV o XLSX, entonces el archivo se descarga con los datos visibles.
- **CA-09**: Dado un usuario autenticado, cuando cambia el tema, entonces la preferencia se conserva al recargar la pagina.
