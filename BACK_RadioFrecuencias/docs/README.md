# Documentacion Backend RadioFrecuencias

Esta carpeta consolida la documentacion funcional y tecnica del backend de **RadioFrecuencias**, la plataforma que gestiona la asignacion y devolucion de radios de comunicacion para el personal operativo. Toda la informacion refleja la arquitectura basada en capas introducida en 2025 (domain -> application -> infrastructure -> interfaces), los servicios de auditoria y los flujos REST consumidos por el frontend Next.js.

## Guia de navegacion
- **General**
  - [Descripcion General](01_Descripcion_General.md)
  - [Objetivos y Alcance](02_Objetivos_y_Alcance.md)
- **Requisitos**
  - [Requisitos Funcionales](03_Requisitos/Requisitos_Funcionales.md)
  - [Requisitos No Funcionales](03_Requisitos/Requisitos_No_Funcionales.md)
  - [Criterios de Aceptacion](03_Requisitos/Criterios_de_Aceptacion.md)
- **Especificaciones tecnicas**
  - [Entorno de Desarrollo](04_Especificaciones_Tecnicas/Entorno_de_Desarrollo.md)
  - [Instalacion y Configuracion](04_Especificaciones_Tecnicas/Instalacion_y_Configuracion.md)
  - [Codigo Fuente y Estructura](04_Especificaciones_Tecnicas/Codigo_Fuente_GitHub.md)
  - [Plan de Soporte](04_Especificaciones_Tecnicas/Plan_de_Soporte.md)
  - [Monitorizacion y Logs](04_Especificaciones_Tecnicas/Monitorizacion_y_Logs.md)
  - [Plan de Seguridad Tecnica](04_Especificaciones_Tecnicas/Seguridad_Tecnica.md)
- **Arquitectura y diseno**
  - [Diagramas y Modelos](05_Arquitectura_y_Disenio/Diagramas_y_Modelos.md)
  - [Arquitectura y Patrones](05_Arquitectura_y_Disenio/Arquitectura_y_Patrones.md)
- **Gestion de usuarios y operacion**
  - [Roles y Permisos](06_Gestion_de_Usuarios/Roles_y_Permisos.md)
  - [Estrategia de Mantenimiento y Actualizaciones](06_Gestion_de_Usuarios/Estrategia_de_Mantenimiento.md)
- **Despliegue y seguridad de usuario final**
  - [Plan de Despliegue](07_Despliegue_y_Seguridad_Usuario_Final/Plan_de_Despliegue.md)
  - [Seguridad para Usuario Final](07_Despliegue_y_Seguridad_Usuario_Final/Seguridad_Usuario_Final.md)
- **Marco conceptual**
  - [Estandares de Referencia](08_Marco_Conceptual/Estandares.md)

> Nota: esta documentacion cubre exclusivamente el backend Django. La documentacion del frontend Next.js se mantiene en `FRONT_RadioFrecuencias/docs/` (pendiente de generar).
