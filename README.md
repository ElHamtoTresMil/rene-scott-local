# René Scott Local (OSS) — base independiente

**Estado:** prototipo experimental local, separado del producto privado René Scott / Scott Labs.

Código original creado para una posible edición abierta, sin importar archivos, interfaces, bases de datos ni credenciales del repositorio interno `scottautoexport.com`. No utiliza ni redistribuye el DevKit de OpenAI.

## Qué funciona ahora

- Servidor web independiente para macOS/Linux con Node.js 22+ (recomendado 24).
- Interfaz local mínima y funcional para **Ollama real** en `127.0.0.1:11434`.
- Descubrimiento de modelos locales y un chat temporal en memoria del navegador.
- Control básico de Origin/Host, token de sesión y solo loopback, sin llamadas a proveedores de nube.

**No incluye:** Sala Multi-IA personal, proyectos/SQLite, autenticación multiusuario, ChatGPT/Claude conectados, ni despliegue público. Estos elementos solo podrán incorporarse mediante implementaciones públicas independientes, auditoría y permisos adecuados. No se ha garantizado que OpenAI acepte el producto.

## Probar localmente

```bash
node --version            # Node.js 22+; recomendable Node 24
npm test                  # pruebas sin Ollama ni red externa
npm start                 # http://127.0.0.1:4286
```

Ollama debe estar en ejecución y tener al menos un modelo instalado. Para detener el servidor: `Ctrl+C`. Puerto 4286, separado de las instancias privadas 4276 y 4277. **No requiere `npm install` ni dependencias de terceros.**

## Inicio de sesión con ChatGPT: pendiente

OpenAI documenta un flujo opcional de uso del plan de ChatGPT en herramientas **open source/locales**. No basta con que este repositorio sea público para garantizar elegibilidad del producto o la cuenta.

- [Descripción SIWC OSS](https://developers.openai.com/siwc/token-sharing-open-source)
- [Flujo de autenticación](https://developers.openai.com/siwc/token-sharing-open-source/sign-in)
- [Uso de modelos](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference)
- [Condiciones del servicio](https://openai.com/policies/sign-in-with-chatgpt-terms/)
- [Licencia no comercial del DevKit](https://github.com/openai/sign-in-with-chatgpt-devkit/blob/main/LICENSE)

No hay botón OAuth funcional todavía. No introducir aquí claves, cookies de sesión ni tokens. Para un uso empresarial de René Scott, solicitar aclaración o autorización escrita sobre elegibilidad y licencia antes de activar SIWC.

## Publicación en GitHub

Este ZIP es un paquete limpio sin historial Git, `.env`, bases de datos ni secretos. El repositorio público recomendado es `ElHamtoTresMil/rene-scott-local`. Crear **un repositorio nuevo vacío**, no convertir el repositorio privado ni crear un fork de él. Leer todos los archivos antes de publicar.

La licencia MIT cubre **solo los archivos originales incluidos en este paquete**. No otorga derechos sobre el DevKit, marcas de OpenAI, código privado de Scott Labs ni marcas de terceros. Los derechos de marca René Scott se mantienen separados.
