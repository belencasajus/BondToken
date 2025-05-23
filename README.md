Esta investigación presenta el diseño e implementación de un modelo de tokenización de bonos corporativos sobre una red de tecnología de registro distribuido (Distributed Ledger Technology, DLT), apoyado en contratos inteligentes y almacenamiento descentralizado de la documentación. Tras analizar proyectos piloto de tokenización de instrumentos financieros y la literatura especializada, se definen mecanismos de entrega contra pago (Delivery versus Payment, DvP) automatizados y se emplea el Sistema de Archivos Interplanetario (InterPlanetary File System, IPFS) para garantizar la integridad de la documentación legal. 
El modelo propone un protocolo híbrido -en cadena y fuera de la cadena blockchain- que abarca la emisión en el mercado primario mediante una aplicación web, el anclaje de folletos en IPFS y el despliegue de un contrato ERC-20, así como la liquidación atómica DvP en el mercado secundario extrabursátil, validada con pruebas automáticas en Hardhat. Un planificador desarrollado en Node.js gestiona los pagos de cupones y la amortización final de bono o redención, mientras que una réplica en MongoDB de los eventos generados en la cadena permite ofrecer una interfaz de usuario con baja latencia. 
El prototipo, desplegado en la red de pruebas Sepolia, confirma la viabilidad técnica del enfoque y señala, para su futura puesta en producción, la conveniencia de hacer pruebas de carga, integrar monedas estables (stablecoins) o moneda digital mayorista de banco central (wCBDC) y adoptar el estándar ERC-1400 con controles de identidad (KYC/AML) y mecanismos adicionales de resiliencia.


GUÍA DE DESPLIEGUE PASO A PASO
A continuación, se detallan los pasos necesarios para poner en marcha la plataforma en un entorno local. Este ejemplo está probado en Windows PowerShell, pero en Linux o macOS los comandos son similares.
5.5.1. Compilar el contrato
Desde la carpeta raíz del proyecto (en este caso, con nombre “tokenizacion-bono”), se ejecuta:
cd tokenizacion-bono
npx hardhat compile

Obteniendo: “Compiled 1 Solidity file successfully (evm target: paris)”

5.5.2. Iniciar el frontend con hot-reload
cd frontend
npm install        # sólo la primera vez
npm run dev

Vite arrancará la aplicación en servidor local en el puerto 5173 (http://localhost:5173) y recargará automáticamente al cambiar el código.
5.5.3. Levantar el backend y el planificador de cupones

cd ../backend
npm install        # sólo la primera vez
node server.js

El servidor escuchará en el puerto 3000 del servidor local (http://localhost:3000). En la consola aparecerán mensajes como:

MongoDB conectado
MongoDB conectado para scheduler
MongoDB conectado para DvP listener
Suscrito dinámicamente a DvP de <dirección>
5.5.4. Configurar variables de entorno
Para el correcto funcionamiento de todos los componentes de la plataforma, es imprescindible definir una serie de parámetros en un fichero de configuración situado en la raíz del proyecto (tokenizacion-bono/.env). Este archivo debe incluir las credenciales necesarias para la comunicación con la base de datos, el nodo Ethereum y el servicio de almacenamiento de IPFS, sin necesidad de exponer ninguna clave privada de usuario. El contenido mínimo es el siguiente:
MONGO_URI=“mongodb://127.0.0.1:27017/bonosdb”
API_URL=“https://eth-sepolia.g.alchemy.com/v2/<API_KEY_ALCHEMY>”
PINATA_JWT=“<PINATA_JWT>”
PORT=3000

•	MONGO_URI: cadena de conexión a la base de datos MongoDB local, donde se mantiene la réplica operativa de eventos y estados off-chain.
•	API_URL: endpoint de Alchemy para la red Sepolia, utilizado por Ethers.js para emitir y escuchar transacciones.
•	PINATA_JWT: token de autenticación de Pinata, que permite fijar los documentos PDF en IPFS sin requerir credenciales privadas.
•	PORT: puerto en el que el servidor Express atenderá las peticiones REST.



























Este proyecto ha sido desarrollado por Belén Casajús para su Trabajo Fin de Grado en la ETSIT-UPM. Todos los derechos reservados. 
No se autoriza su uso comercial ni distribución sin consentimiento expreso de la autora.
