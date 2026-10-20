# My Social Network – SENA 🚀💚

**Red social moderna, atractiva y 100% funcional creada para los aprendices del Servicio Nacional de Aprendizaje (SENA).**

Diseñada con los colores y la identidad visual institucional (verde SENA `#39A900`, azul institucional y blancos puros), con navegación fluida, base de datos relacional MySQL y una arquitectura full-stack desacoplada.

---

## 📸 Características y Secciones Implementadas

### 1. 🎨 Diseño Visual e Identidad Institucional
- Réplica exacta y mejorada de la interfaz institucional del SENA.
- Menú lateral permanente con logo oficial del SENA en blanco, lema *"SENA Formación para la vida"* y accesos directos con contadores dinámicos.
- Barra superior con buscador global interactivo, campana de notificaciones en tiempo real y menú de usuario.
- Diseño totalmente adaptable (*responsive*) para computadores, tabletas y móviles.

### 2. 👤 Perfil Personal Integral
Campos completos registrados y editables en base de datos:
- Nombre completo: *Juan Pablo Tocarema Ávila*
- Edad: *18 años*
- Ocupación: *Aprendiz SENA | Análisis y Desarrollo de Software*
- Ciudad de origen: *Espinal, Tolima*
- Sexo: *Masculino*
- Número de teléfono: *+57 320 123 4567*
- Correo electrónico: *juanpablotocaremaavila@gmail.com*
- Idiomas: *Español (nativo), Inglés (básico)*
- Foto de perfil con indicador en línea (*online*) y foto de portada del campus SENA.
- Descripción personal (*Sobre mí*).

### 3. ❤️ Sección de Intereses (9 Categorías con Oraciones Completas)
1. **🎓 Estudios**: *"Me gusta aprender y mejorar mis habilidades en programación y tecnología."*
2. **🎵 Música**: *"Escucho salsa cuando estoy feliz y vallenato cuando estoy triste."*
3. **🎬 Películas**: *"Me gustan las películas de acción, ciencia ficción y aventura."*
4. **📺 Series de TV**: *"Disfruto series como La Casa de Papel, Stranger Things y The Last of Us."*
5. **⚽ Deportes**: *"Me gusta el fútbol y también practico gimnasio para mantenerme en forma."*
6. **🍴 Comida**: *"Me encanta la comida típica colombiana, especialmente el ajiaco y la bandeja paisa."*
7. **☕ Bebidas**: *"Prefiero el agua, pero me gusta un buen café o una soda en ocasiones."*
8. **📖 Libros**: *"Leo libros de tecnología, desarrollo de software y superación personal."*
9. **🎮 Videojuegos y tecnología**: *"Disfruto jugar en mi tiempo libre, especialmente juegos de estrategia y aventura."*

### 4. ⚡ Funciones Sociales y Académicas
- **Muro de noticias (Feed)**: Publicación de textos e imágenes con selector multimedia, comentarios en tiempo real y reacciones (Me gusta, Me encanta).
- **Amigos y red de aprendices**: Agregar compañeros, enviar solicitudes, explorar aprendices por ficha y programa formativo.
- **Grupos por programas y fichas**:
  - ADSO - Ficha 2670142.
  - Semillero de Inteligencia Artificial & Cloud.
  - Club de Videojuegos & Esports SENA.
  - Creación de nuevos grupos y publicaciones internas.
- **Mensajería privada (Chat)**: Conversaciones directas e instantáneas con compañeros, historial guardado e indicador de no leídos.
- **Eventos académicos**: Hackathon SENASoft, Ferias de proyectos de grado, talleres de Git/GitHub, con botones de confirmación (*Asistir / Me interesa*).
- **Configuración y Privacidad**: Control de visibilidad del perfil (Público, Solo aprendices de la ficha, Privado), ocultar/mostrar teléfono y correo, actualización de contraseña cifrada con `bcrypt`.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, Vite, Bootstrap 5, Bootstrap Icons, CSS3 Moderno (Custom SENA tokens).
- **Backend**: Node.js, Express, `mysql2/promise`, `bcryptjs` (cifrado de contraseñas), `jsonwebtoken` (JWT), `multer` (gestión de subida de archivos).
- **Base de Datos**: MySQL (`sena_social_db` con tablas `users`, `interests`, `posts`, `reactions`, `comments`, `friendships`, `user_groups`, `group_members`, `messages`, `events`, `event_attendees`, `notifications`, `user_settings`).

---

## 🚀 Puesta en Marcha Rápida

### 1. Iniciar Base de Datos (MySQL XAMPP)
Asegúrate de que MySQL esté activo en el puerto 3306 (por ejemplo mediante XAMPP).

### 2. Iniciar el Backend
```bash
cd backend
npm install
node server.js
```
*El servidor inicializará automáticamente la base de datos `sena_social_db` y sembrará los aprendices, publicaciones, grupos y eventos iniciales.*

### 3. Iniciar el Frontend
```bash
cd frontend
npm install
npm run dev
```
Abre en tu navegador: **http://127.0.0.1:5173/**

---

## 🔑 Cuentas de Prueba Pre-cargadas

| Aprendiz | Usuario / Correo | Contraseña | Programa / Ficha |
| :--- | :--- | :--- | :--- |
| **Juan Pablo Tocarema Ávila** | `juanpato27` / `juanpablotocaremaavila@gmail.com` | `Sena2026*` | ADSO · Ficha 2670142 |
| **Camila Rodríguez** | `camilarodz` / `camila.rodriguez@sena.edu.co` | `Sena2026*` | Redes · Ficha 2670142 |
| **Carlos Andrés Mendoza** | `carlos_mendoza` / `cmendoza@sena.edu.co` | `Sena2026*` | Animación 3D · Ficha 2589011 |

*Puedes alternar entre aprendices desde el menú de usuario en la barra superior o ingresar con el formulario de inicio de sesión.*

---

## 🌐 Enlace Público Mundial (Sin Restricciones de País)

La plataforma cuenta con un enlace público seguro **HTTPS** activo para acceder desde cualquier país del mundo (móvil, tablet o PC):

- 🔗 **Enlace Directo Mundial**: `https://c14056a0b376ba.lhr.life`
- 🛡️ **Seguridad**: Certificado SSL/TLS con cifrado HTTPS.
- 🌍 **Sin restricciones**: Accesible desde Colombia, EE. UU., Europa, Latinoamérica y cualquier región global sin bloqueo por geolocalización.
- 📱 **Script de un clic**: Ejecuta `crear_enlace_publico_mundial.bat` para regenerar o abrir el túnel global en cualquier momento.

---

## ☁️ Opciones de Hosting Gratuito Permanente (24/7 en la Nube sin Restricciones)

Para mantener la red social activa las 24 horas del día sin necesidad de tener tu computador encendido, las mejores plataformas 100% gratuitas y sin restricciones de país son:

1. **Render.com (Frontend + Backend Node.js)**:
   - Capa gratuita mundial disponible en todos los países.
   - Conexión directa a GitHub con despliegue automático.
   - Certificados SSL automáticos incluidos.
2. **TiDB Cloud / Aiven (Base de Datos MySQL Cloud)**:
   - MySQL gratuito de hasta 5 GB en la nube.
   - Compatible 100% con los scripts `db.js` y `sena_social_db`.
3. **Koyeb / Railway**:
   - Despliegue de contenedores y servicios web sin restricciones geográficas.
