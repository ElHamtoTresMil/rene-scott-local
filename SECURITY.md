# Seguridad — René Scott Local (base experimental)

- Servidor limitado a `127.0.0.1`; no hay puerto público, escucha en LAN ni proxy inverso.
- Solicitudes de escritura necesitan Origin correcto y token aleatorio de sesión.
- No se almacenan contraseñas, cookies de ChatGPT/Claude, OAuth tokens, API keys ni mensajes en disco.
- Solo se permite conexión directa al Ollama local configurado en loopback.
- ChatGPT, Claude y Sign in with ChatGPT están desactivados, no implementados.
- No copies fuentes, historiales, credenciales, repositorios o secretos de Scott Labs aquí.
- Antes de integrar SIWC: revisión de elegibilidad para uso empresarial, licencias, consentimiento, PKCE/OIDC completo, almacenamiento de tokens de OS y revocación, límites y tests de seguridad.
- No exponer este servidor experimental en Internet. No es una versión multiusuario ni sustituto de Scott Shield.
- Reportar problemas de seguridad privadamente a los mantenedores; no subir secretos en Issues.
