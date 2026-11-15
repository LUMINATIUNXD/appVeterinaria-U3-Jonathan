# Sistema de citas veterinarias

Aplicación de React con Vite y TypeScript, conectada a una API de Express y MySQL.

Basado en el ejercicio de clase: https://github.com/arlinchc/appVeterinaria

## Inicio rápido en Windows

Extrae el proyecto y abre `INICIAR.cmd`. Escribe la contraseña de tu usuario `root` de MySQL local. El inicio instala dependencias, prepara la base sin borrar registros existentes y abre la app. La contraseña no se guarda en archivos. Requiere MySQL en ejecución en el puerto 3306 y conexión a Internet para la primera instalación. Deja la ventana abierta; Ctrl+C detiene la aplicación.

## Pruebas realizadas

Se verificaron 16 pruebas reales de API con MySQL 8.0.46, incluyendo registro, consulta, confirmación y persistencia después de reiniciar Express. También se comprobó el registro y la confirmación desde el formulario y la conservación de los datos al recargar. Frontend y backend compilan y el análisis ESLint pasa. El informe está en `evidencias/resultado-pruebas.json`.

Para repetir las pruebas: configura `Backend/.env`, entra en `Backend` y ejecuta `npm test`. Las pruebas crean y eliminan su propia base `veterinaria_test_<fecha>`; requieren permisos para ello y no vacían `veterinaria_db`.

## Requisitos

- Node.js y npm.
- Una instancia MySQL con la base de datos configurada en `Backend/.env`.

## Base de datos

La configuración corresponde a la que se compartió en Teams: MySQL local (`localhost:3306`), usuario `root` y base `veterinaria_db`. El texto de Teams deja la contraseña como `TU_CONTRASEÑA`; coloca ahí la contraseña real de tu MySQL local. Si tu usuario `root` no tiene contraseña, deja `DB_PASSWORD=` vacío. Si no tienes `Backend/.env`, copia `Backend/.env.example` a `Backend/.env`. No subas ni compartas el archivo `Backend/.env`: contiene la configuración privada de conexión.

En MySQL Workbench, abre y ejecuta `Backend/sql/schema.sql` para crear la base y la tabla. `Backend/sql/seed.sql` agrega las cuatro citas de ejemplo del mensaje de Teams; es opcional y se ejecuta una sola vez.

## Iniciar el backend

```powershell
cd Backend
npm install
npm run dev
```

La API se inicia en `http://localhost:3000`. Puedes comprobarla en `http://localhost:3000/api/salud`.

## Iniciar React

En otra terminal, desde la carpeta principal:

```powershell
npm install
npm run dev
```

Abre la dirección local que muestre Vite, normalmente `http://localhost:5173`.

## Registrar y comprobar una cita

Pulsa **Nueva cita**, completa mascota, cliente, servicio, fecha y hora y guarda. El frontend envía un `POST` JSON a `http://localhost:3000/api/citas`; Express valida los datos y el horario, inserta la cita en MySQL y responde con código `201`. La cita aparece en la agenda. Para verificar que persiste, recarga la página o consulta `GET http://localhost:3000/api/citas` en Thunder Client.

Ejemplo de cuerpo JSON para Thunder Client:

```json
{
  "mascota": "Luna",
  "cliente": "Ana López",
  "servicio": "Vacunación",
  "fecha": "2030-12-20",
  "hora": "10:30"
}
```

Configura el método como `POST`, la URL como `http://localhost:3000/api/citas` y el header `Content-Type: application/json`. Si la respuesta es `201`, vuelve a consultar con `GET` para confirmar que la cita está almacenada.

## Manejo de errores

Las rutas ejecutan controladores asíncronos mediante `asyncHandler`. Los errores pasan al middleware central `manejarErrores`, que responde con un código HTTP y un mensaje JSON. Las entradas inválidas devuelven `400`; un horario ya ocupado devuelve `409`; y los errores inesperados devuelven `500`.

## Clientes permitidos por CORS

El backend acepta el origen de React definido en `FRONTEND_URL`, clientes locales en `localhost` o `127.0.0.1` con cualquier puerto, y solicitudes sin encabezado `Origin` como Flutter móvil, Postman y Thunder Client. Solo permite `GET`, `POST`, `PUT`, `PATCH`, `DELETE` y `OPTIONS`, con encabezados `Content-Type` y `Authorization`.
