# Medichain
Ce dossier contient les fichies necessaires pour mettre en place le réseau HLF ainsi que le serveur web:
1/ Le réseau HLF: Dans le dossier MediChain/test-network
2/ Le serveur web: Dans le dossier MediChain/javascript

## Mettre en place le réseau HLF
Pour mettre en place le réseau HLF, il faut exécuter les commandes suivante:
```bash
cd test-network
./network.sh up -ca
./network.sh createChannel -ca
./network.sh deployCC -ca
```
Si  un réseau est déja en place, il faut faire:
```bash
./RestartNetwork.sh
```
## Chainecode
Le chemin du chaincode est : chaincode/fabcar/go/abstore.go
## Démarrer le serveur
Pour démarrer le serveur web, il faut exécuter les commandes suivante:
```bash
cd javascript
node server.js
```
Maintenant le serveur est actif sur le port 3000.


