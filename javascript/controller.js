//SPDX-License-Identifier: Apache-2.0

/*
  This code is based on code written by the Hyperledger Fabric community.
  Original code can be found here: https://github.com/hyperledger/fabric-samples/blob/release/fabcar/query.js
  and https://github.com/hyperledger/fabric-samples/blob/release/fabcar/invoke.js
 */

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var http = require('http')
var fs = require('fs');
var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
const { Gateway, Wallets, TxEventHandler, GatewayOptions, DefaultEventHandlerStrategies, TxEventHandlerFactory } = require('fabric-network');
const ccpPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
//const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const helper = require('./app/helper')
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');

async function myFunction(user, password,mspid) {
	const walletPath = await helper.getWalletPath(mspid)
	fs.readFile(`${walletPath}/${user}.id`, (err, data) => {
		// In case of a error throw err. 
		if (err) throw err;
		JsonData = JSON.parse(data.toString())
		//secret=JsonData.enrollmentSecret
		JsonData.password = password

		console.log(JSON.stringify(JsonData));
		//fs.writeFile('/home/helmi/Fabric_Tockenisation(3org)/basic-network/javascript/wallet/aaa/aaa', JSON.stringify(JsonData), (err) => { 
		fs.writeFile(`${walletPath}/${user}.id`, JSON.stringify(JsonData), (err) => {
			 //In case of a error throw err. 
			if (err) throw err;
		})
	})
}



module.exports = (function () {
	return {
		RegisterUser: async function (req, res) {
			//try {
			var array = req.params.user.split("-");
			var user = array[0]
			var password = array[1].toString()
			var Org = array[2].toString()
			console.log("Registring User: ");
			let response = await helper.getRegisteredUser(user, Org, true);

		setTimeout(function () {
				myFunction(user, password,Org);
			}, 1000);
		res.send(response)

		},



		SignInUser: async function (req, res) {
			try {
				console.log("Singn in User: ");
				var array = req.params.id.split("-");
				var user = array[0]
				console.log(user)
				var password = array[1]
				var mspid = array[2]
				//console.log(user)
				// Create a new file system based wallet for managing identities.
				const walletPath = await helper.getWalletPath(mspid)
				const wallet = await Wallets.newFileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				const gateway = new Gateway();
				await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: false } });

				var Values = await helper.getUser(user,mspid)
				var _mspid=Values[0]
				var _password=Values[1]
				setTimeout(() => {  				
				console.log("MspId: "+_mspid)
				console.log("password: "+_password)
				//var _name = Client._userContext._name
				//var _secret = Client._userContext._enrollmentSecret
				if (_mspid != mspid || _password != password) {
					res.send("Failed to sign In this user ")
				}
				else res.send("Good") }, 2000);
				
			


			} catch (error) {
				console.error(`Failed to register user ${user}: ${error}`);

			}
		},





		CreateProduct: async function (req, res) {
			console.log("Creating product: ");
			username=req.params.user
			var org_name=req.params.mspid
			console.log(username,org_name)
			var Name = req.body.Name;
			var ManufacturingDate = req.body.ManufacturingDate;
			var ExpirationDate = req.body.ExpirationDate;
			var Manifacturer = req.body.Manifacturer;


			try {
				let ccp = await helper.getCCP(org_name)
				console.log(ccp);
				// Create a new file system based wallet for managing identities.
				const walletPath = await helper.getWalletPath(org_name)
				const wallet = await Wallets.newFileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				let identity = await wallet.get(username);
				if (!identity) {
					console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
					await helper.getRegisteredUser(username, org_name, true)
					identity = await wallet.get(username);
					console.log('Run the registerUser.js application before retrying');
					return;
				}	

				const connectOptions = {
					wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
					eventHandlerOptions: {
						commitTimeout: 100,
						strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
					},
				}
				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, connectOptions);

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');

				// Submit the specified transaction.
				// createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
				// changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR12', 'Dave')
				result = await contract.submitTransaction('CreateProduct', Name, ManufacturingDate, ExpirationDate, Manifacturer);
				console.log('Transaction has been submitted');
				var obj = JSON.parse(result);

				// Disconnect from the gateway.
				await gateway.disconnect();
				res.send(obj)
				return (obj)

			} catch (error) {
				console.error(`Failed to submit transaction: ${error}`);
				res.status(500).send(new Error('You are not authorized to do this operation'));

			}
		},

		SendDeliveryRequest: async function (req, res) {
			console.log("Creating SendDeliveryRequest: ");
			var ProductID = req.body.ProductID;
			var Weight = req.body.Weight;
			var DateOfDelevery = req.body.DateOfDelevery;
			username=req.params.user
			var org_name=req.params.mspid
			try {


				let ccp = await helper.getCCP(org_name)
				console.log(ccp);
				// Create a new file system based wallet for managing identities.
				const walletPath = await helper.getWalletPath(org_name)
				const wallet = await Wallets.newFileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				let identity = await wallet.get(username);
				if (!identity) {
					console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
					await helper.getRegisteredUser(username, org_name, true)
					identity = await wallet.get(username);
					console.log('Run the registerUser.js application before retrying');
					return;
				}	

				const connectOptions = {
					wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
					eventHandlerOptions: {
						commitTimeout: 100,
						strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
					},
				}
				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, connectOptions);

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');
				result = await contract.submitTransaction('SendDeliveryRequest', ProductID, Weight, DateOfDelevery);
				console.log('Transaction has been submitted');
				var obj = JSON.parse(result);

				// Disconnect from the gateway.
				await gateway.disconnect();
				res.send(obj)
				return (obj)

			} catch (error) {
				console.error(`Failed to submit transaction: ${error}`);
				res.status(500).send(new Error('You are not authorized to do this operation'));

				//process.exit(1);
			}
		},

		SendDelivery: async function (req, res) {
			console.log("SendDelivery ");
			var DELID = req.body.DELID;
			username=req.params.user
			var org_name=req.params.mspid

			try {


				let ccp = await helper.getCCP(org_name)
				console.log(ccp);
				// Create a new file system based wallet for managing identities.
				const walletPath = await helper.getWalletPath(org_name)
				const wallet = await Wallets.newFileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				let identity = await wallet.get(username);
				if (!identity) {
					console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
					await helper.getRegisteredUser(username, org_name, true)
					identity = await wallet.get(username);
					console.log('Run the registerUser.js application before retrying');
					return;
				}	

				const connectOptions = {
					wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
					eventHandlerOptions: {
						commitTimeout: 100,
						strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
					},
				}
				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, connectOptions);

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');
				result = await contract.submitTransaction('SendDelivery', DELID);
				console.log('Transaction has been submitted');
				var obj = JSON.parse(result);

				// Disconnect from the gateway.
				await gateway.disconnect();
				res.send(obj)
				return (obj)

			} catch (error) {
				console.error(`Failed to submit transaction: ${error}`);
				res.status(500).send(new Error('You are not authorized to do this operation'));

				//process.exit(1);
			}
		},

		AcceptDelivery: async function (req, res) {
			console.log("AcceptDelevery ");
			var DELID = req.body.DELID;
			username=req.params.user
			var org_name=req.params.mspid

			try {


				let ccp = await helper.getCCP(org_name)
				console.log(ccp);
				// Create a new file system based wallet for managing identities.
				const walletPath = await helper.getWalletPath(org_name)
				const wallet = await Wallets.newFileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				let identity = await wallet.get(username);
				if (!identity) {
					console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
					await helper.getRegisteredUser(username, org_name, true)
					identity = await wallet.get(username);
					console.log('Run the registerUser.js application before retrying');
					return;
				}	

				const connectOptions = {
					wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
					eventHandlerOptions: {
						commitTimeout: 100,
						strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
					},
				}
				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, connectOptions);

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');
				result = await contract.submitTransaction('Acceptdelivery', DELID);
				console.log('Transaction has been submitted');
				var obj = JSON.parse(result);

				// Disconnect from the gateway.
				await gateway.disconnect();
				res.send(obj)
				return (obj)

			} catch (error) {
				console.error(`Failed to submit transaction: ${error}`);
				res.status(500).send(new Error('You are not authorized to do this operation'));

				//process.exit(1);
			}
		},

		ServeDelivery: async function (req, res) {
			console.log("ServeDelivery ");
			var DELID = req.body.DELID;
			var Deliver = req.body.Deliver;
			username=req.params.user
			var org_name=req.params.mspid
			try {


				let ccp = await helper.getCCP(org_name)
				console.log(ccp);
				// Create a new file system based wallet for managing identities.
				const walletPath = await helper.getWalletPath(org_name)
				const wallet = await Wallets.newFileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				let identity = await wallet.get(username);
				if (!identity) {
					console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
					await helper.getRegisteredUser(username, org_name, true)
					identity = await wallet.get(username);
					console.log('Run the registerUser.js application before retrying');
					return;
				}	

				const connectOptions = {
					wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
					eventHandlerOptions: {
						commitTimeout: 100,
						strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
					},
				}
				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, connectOptions);

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');
				result = await contract.submitTransaction('ServeDelivery', DELID, Deliver);
				console.log('Transaction has been submitted');
				var obj = JSON.parse(result);

				// Disconnect from the gateway.
				await gateway.disconnect();
				res.send(obj)
				return (obj)

			} catch (error) {
				console.error(`Failed to submit transaction: ${error}`);
				res.status(500).send(new Error('You are not authorized to do this operation'));

				//process.exit(1);
			}
		},
		QueryDeliveryRequest: async function (req, res) {
			console.log("QueryDeliveryRequest: ");
			username=req.params.user
			var org_name=req.params.mspid			
			try {


				let ccp = await helper.getCCP(org_name)
				console.log(ccp);
				// Create a new file system based wallet for managing identities.
				const walletPath = await helper.getWalletPath(org_name)
				const wallet = await Wallets.newFileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				let identity = await wallet.get(username);
				if (!identity) {
					console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
					await helper.getRegisteredUser(username, org_name, true)
					identity = await wallet.get(username);
					console.log('Run the registerUser.js application before retrying');
					return;
				}	

				const connectOptions = {
					wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
					eventHandlerOptions: {
						commitTimeout: 100,
						strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
					},
				}
				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, connectOptions);

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');
				const result = await contract.evaluateTransaction('QueryDeliveryRequest');
				console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
				var obj = JSON.parse(result);

				// Disconnect from the gateway.
				await gateway.disconnect();
				res.send(obj)
				return (obj)
			} catch (error) {
				console.error(`Failed to evaluate transaction: ${error}`);
				res.status(500).send(new Error('You are not authorized to do this operationd'));

				//process.exit(1);
			}
		},


		GetProduct: async function (req, res) {
			console.log("GetProduct: ");
			var array = req.params.id.split("-");
			var ProductID = array[0];
			console.log(ProductID)
			username=req.params.user
			var org_name=req.params.mspid
			try {


				let ccp = await helper.getCCP(org_name)
				console.log(ccp);
				// Create a new file system based wallet for managing identities.
				const walletPath = await helper.getWalletPath(org_name)
				const wallet = await Wallets.newFileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				let identity = await wallet.get(username);
				if (!identity) {
					console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
					await helper.getRegisteredUser(username, org_name, true)
					identity = await wallet.get(username);
					console.log('Run the registerUser.js application before retrying');
					return;
				}	

				const connectOptions = {
					wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
					eventHandlerOptions: {
						commitTimeout: 100,
						strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
					},
				}
				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, connectOptions);

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');
				const result = await contract.evaluateTransaction('GetProduct',ProductID);
				console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
				var obj = JSON.parse(result);

				// Disconnect from the gateway.
				await gateway.disconnect();
				res.send(obj)
				return (obj)
			} catch (error) {
				console.error(`Failed to evaluate transaction: ${error}`);
				res.status(500).send(new Error('You are not authorized to do this operation'));

				//process.exit(1);
			}
		},

		getHistoryForDelevryRequest: async function (req, res) {
			console.log("getHistoryForDelevryRequest: ");
			var array = req.params.id.split("-");
			var RequestID = array[0];
			console.log(RequestID)
			username=req.params.user
			var org_name=req.params.mspid
			try {


				let ccp = await helper.getCCP(org_name)
				console.log(ccp);
				// Create a new file system based wallet for managing identities.
				const walletPath = await helper.getWalletPath(org_name)
				const wallet = await Wallets.newFileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				let identity = await wallet.get(username);
				if (!identity) {
					console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
					await helper.getRegisteredUser(username, org_name, true)
					identity = await wallet.get(username);
					console.log('Run the registerUser.js application before retrying');
					return;
				}	

				const connectOptions = {
					wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
					eventHandlerOptions: {
						commitTimeout: 100,
						strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
					},
				}
				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, connectOptions);

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');
				const result = await contract.evaluateTransaction('getHistoryForDelevryRequest',RequestID);
				console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
				var obj = JSON.parse(result);

				// Disconnect from the gateway.
				await gateway.disconnect();
				res.send(obj)
				return (obj)
			} catch (error) {
				console.error(`Failed to evaluate transaction: ${error}`);
				//process.exit(1);
			}
		},



		deleteToken: async function (req, res) {
			console.log("Delete Token");
			var array = req.params.id.split("-");
			var user = array[0]
			var id = array[1]

			try {
				// Create a new file system based wallet for managing identities.
				const walletPath = path.join(process.cwd(), 'wallet');
				const wallet = new FileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				const userExists = await wallet.exists(user);
				if (!userExists) {
					console.log('An identity for the user user does not exist in the wallet');
					console.log('Run the registerUser.js application before retrying');
					return;
				}

				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: false } });

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');

				// Evaluate the specified transaction.
				// queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
				// queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
				const result = await contract.submitTransaction('deleteToken', id);
				console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
				res.send(result)
				return (result)

			} catch (error) {
				console.error(`Failed to evaluate transaction: ${error}`);
				//process.exit(1);
			}
		},


		AddInput: async function (req, res) {
			console.log("Add Input to token: ");
			var array = req.params.token.split("-");
			var user = array[0]
			//var tokenList=array[1].toString()
			var token1 = array[1].toString()
			var token2 = array[2].toString()

			/*for (var i = 2; i < array.length; i++) {
				token = array[i].toString()
				tokenList = tokenList + "," + token
			}*/

			console.log(token1, token2)

			try {
				// Create a new file system based wallet for managing identities.
				const walletPath = path.join(process.cwd(), 'wallet');
				const wallet = new FileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				const userExists = await wallet.exists(user);
				if (!userExists) {
					console.log('An identity for the user user does not exist in the wallet');
					console.log('Run the registerUser.js application before retrying');
					return;
				}

				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: false } });

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');

				// Evaluate the specified transaction.
				// queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
				// queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
				const result = await contract.submitTransaction('AddInput', token1, token2);
				console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
				var d = new Date();
				var t = d.getTime()
				var s = new Date().toISOString().replace('T', ' ');
				var r = s.replace('Z', '')
				console.log(r)
				res.send(r)
				return (r)

			} catch (error) {
				res.send(`Failed to evaluate transaction: ${error}`)
				console.error(`Failed to evaluate transaction: ${error}`);
				//process.exit(1);
			}
		},

		RemoveInput: async function (req, res) {
			console.log("Remove Input to token: ");
			var array = req.params.token.split("-");
			var user = array[0]
			//var tokenList=array[1].toString()
			var token1 = array[1].toString()
			var token2 = array[2].toString()

			/*for (var i = 2; i < array.length; i++) {
				token = array[i].toString()
				tokenList = tokenList + "," + token
			}*/

			console.log(token1, token2)

			try {
				// Create a new file system based wallet for managing identities.
				const walletPath = path.join(process.cwd(), 'wallet');
				const wallet = new FileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				const userExists = await wallet.exists(user);
				if (!userExists) {
					console.log('An identity for the user user does not exist in the wallet');
					console.log('Run the registerUser.js application before retrying');
					return;
				}

				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: false } });

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');

				// Evaluate the specified transaction.
				// queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
				// queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
				const result = await contract.submitTransaction('RemoveInput', token1, token2);
				console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
				res.send(result)
				return (result)

			} catch (error) {
				console.error(`Failed to evaluate transaction: ${error}`);
				//process.exit(1);
			}
		},

		FinalizeToken: async function (req, res) {
			console.log("Finalize Token");
			var array = req.params.id.split("-");
			var user = array[0]
			var id = array[1]

			try {
				// Create a new file system based wallet for managing identities.
				const walletPath = path.join(process.cwd(), 'wallet');
				const wallet = new FileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				const userExists = await wallet.exists(user);
				if (!userExists) {
					console.log('An identity for the user user does not exist in the wallet');
					console.log('Run the registerUser.js application before retrying');
					return;
				}

				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: false } });

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');

				// Evaluate the specified transaction.
				// queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
				// queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
				const result = await contract.submitTransaction('FinalizeToken', id);
				console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
				var d = new Date();
				var t = d.getTime()
				var s = new Date().toISOString().replace('T', ' ');
				var r = s.replace('Z', '')
				console.log(r)
				res.send(r)
				return (r)

			} catch (error) {
				res.send(`Failed to evaluate transaction: ${error}`)
				console.error(`Failed to evaluate transaction: ${error}`);
				//process.exit(1);
			}
		},

		SetAuthCall: async function (req, res) {
			console.log("Setting Authorized call:");
			var array = req.params.token.split("-");
			var user = array[0]
			//var tokenList=array[1].toString()
			var token1 = array[1].toString()
			var number = array[2]

			try {
				// Create a new file system based wallet for managing identities.
				const walletPath = path.join(process.cwd(), 'wallet');
				const wallet = new FileSystemWallet(walletPath);
				console.log(`Wallet path: ${walletPath}`);

				// Check to see if we've already enrolled the user.
				const userExists = await wallet.exists(user);
				if (!userExists) {
					console.log('An identity for the user user does not exist in the wallet');
					console.log('Run the registerUser.js application before retrying');
					return;
				}

				// Create a new gateway for connecting to our peer node.
				const gateway = new Gateway();
				await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: false } });

				// Get the network (channel) our contract is deployed to.
				const network = await gateway.getNetwork('mychannel');

				// Get the contract from the network.
				const contract = network.getContract('fabcar');

				// Evaluate the specified transaction.
				// queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
				// queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
				const result = await contract.submitTransaction('SetAuthCall', token1, number);
				console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
				res.send(result)
				return (result)

			} catch (error) {
				console.error(`Failed to evaluate transaction: ${error}`);
				//process.exit(1);
			}
		},


	}
})();
