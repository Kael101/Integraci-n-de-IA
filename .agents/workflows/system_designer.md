---
description: Diseñador de Sistemas para Territorio Jaguar (React + Firebase + PWA)
---

# 🐆 Agente de Diseño de Sistemas - Territorio Jaguar

Este flujo de trabajo (workflow) está diseñado para estructurar la creación de nuevas funcionalidades, componentes o módulos en **Territorio Jaguar**, asegurando que cumplan con la arquitectura establecida (React, Firebase, PWA offline-first).

## 🎯 Objetivo
Transformar una especificación de producto (Product Spec) en un diseño técnico profundo, seguro y eficiente, *antes* de escribir cualquier código.

---

## 📋 Pasos de Diseño (Ejecutar en orden)

### 1. Entendimiento y Componentización (React)
Analiza el requerimiento del usuario y define el árbol de componentes de React.
- **Regla:** Cada nueva vista o sección debe mapear a una ruta o componente específico.
- **Regla:** Identificar componentes reutilizables (HUDs, botones, tarjetas) vs componentes de contenedores de página.
- **Salida:** Árbol de archivos planeado en `src/components/...` o `src/pages/...`.

### 2. Diseño de Datos y Reglas (Firebase Firestore)
Define cómo se almacenarán los datos en Firestore y cómo se protegerán.
- **Regla:** Estructura NoSQL. Definir colecciones, documentos y subcolecciones necesarios.
- **Regla:** Establecer las **Reglas de Seguridad** (Security Rules) exactas que validarán la lectura/escritura de estos datos (ej. solo usuarios autenticados, validación de esquema).
- **Salida:** Esquema de la base de datos y borrador de `firestore.rules`.

### 3. Estrategia PWA y Offline-First
Asegura que la funcionalidad trabaje correctamente en la selva o sin internet.
- **Regla:** ¿Qué datos deben ser cacheados (Service Workers / IndexedDB / AsyncStorage)?
- **Regla:** ¿Cómo se maneja la sincronización asíncrona cuando regrese la conexión? (ej. uso de Firebase Offline Persistence).
- **Salida:** Estrategia de caching y manejo de estado offline.

### 4. Flujo de Estados y Performance
Define cómo se moverán los datos dentro de la aplicación.
- **Regla:** Evitar dependencias circulares entre componentes.
- **Regla:** Especificar manejo de estado global (Context/Zustand) vs estado local.
- **Regla:** Considerar consumo de batería en operaciones complejas.
- **Salida:** Grafo de dependencias de estado o diagrama de flujo de datos.

### 5. Plan de Pruebas (Quality Gates)
Establece los criterios de aceptación técnicos.
- **Regla:** Casos de prueba unitarios para utilidades lógicas complejas.
- **Regla:** Casos de prueba de integración (ej. flujo de guardar un reporte offline y sincronizarlo online).

---

## 🛠️ Instrucciones para el Agente (Tú)
Cuando el usuario solicite implementar un nuevo módulo usando este workflow (ej. `/system_designer [Módulo]`), **debes responder obligatoriamente con la siguiente estructura de salida (`SystemDesign`)**:

### Esquema de Salida Esperado (SystemDesign)
```markdown
## 📁 Árbol de Archivos (File Tree)
(Lista de archivos nuevos o modificados con su propósito)

## 🧩 Diseño Frontend (React)
(Componentes, rutas, hooks a crear)

## 🗄️ Diseño de Datos y Backend (Firebase)
(Esquema de las colecciones en Firestore, índices necesarios, y Reglas de Seguridad actualizadas)

## 📡 Estrategia Offline y Performance
(Cómo funcionará sin red, qué se guarda en caché, impacto en la batería)

## ✅ Quality Gates (Criterios de Aceptación)
(Checklist técnico de lo que debe cumplirse para considerar la tarea terminada exitosamente)
```

**NOTA:** No escribas código final hasta que el usuario haya revisado y aprobado el `SystemDesign`.
