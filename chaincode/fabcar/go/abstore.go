package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/rand"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	pb "github.com/hyperledger/fabric-protos-go/peer"
	"github.com/segmentio/ksuid"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

// ===================================================================================
// Main
// ===================================================================================
func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

// Init initializes chaincode
// ===========================
func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {

	return shim.Success(nil)
}

// Invoke - Our entry point for Invocations
// ========================================
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()
	fmt.Println("invoke is running " + function)

	// Handle different functions
	if function == "CreateProduct" { //create a new marble
		return t.CreateProduct(stub, args)
	} else if function == "InitLedger" { //change owner of a specific marble
		return t.InitLedger(stub)
	} else if function == "GetProduct" { //delete a marble
		return t.GetProduct(stub, args)
	} else if function == "SendDelivery" { //read a marble
		return t.SendDelivery(stub, args)
	} else if function == "SendDeliveryRequest" { //find marbles for owner X using rich query
		return t.SendDeliveryRequest(stub, args)
	} else if function == "QueryDeliveryRequest" { //find marbles based on an ad hoc rich query
		return t.QueryDeliveryRequest(stub, args)
	} else if function == "ServeDelivery" { //get history of values for a marble
		return t.ServeDelivery(stub, args)
	} else if function == "Acceptdelivery" { //get marbles based on range query
		return t.Acceptdelivery(stub, args)
	} else if function == "getHistoryForDelevryRequest" {
		return t.getHistoryForDelevryRequest(stub, args)
	}

	fmt.Println("invoke did not find func: " + function) //error
	return shim.Error("Received unknown function invocation")
}

// ============================================================
// Init Ledger - create a new Prodcut
// ============================================================
func (t *SimpleChaincode) InitLedger(stub shim.ChaincodeStubInterface) pb.Response {
	id1 := ksuid.New().String()
	id2 := ksuid.New().String()
	id3 := ksuid.New().String()
	holders := []string{}

	var product1 = Product{ProductID: id1, ManufacturingDate: "01/01/2016", ExpirationDate: "01/01/2018", Name: "Doliprane", Manufacturer: "Sanofi", Holders: holders}
	var product2 = Product{ProductID: id2, ManufacturingDate: "01/01/2016", ExpirationDate: "01/01/2019", Name: "Panadole", Manufacturer: "Sanofi", Holders: holders}
	var product3 = Product{ProductID: id3, ManufacturingDate: "01/01/2016", ExpirationDate: "01/01/2020", Name: "Advil", Manufacturer: "Sanofi", Holders: holders}

	ProductAsBytes, _ := json.Marshal(product1)
	err := stub.PutState(id1, ProductAsBytes)
	if err != nil {
		return shim.Error("Failed to delete state:" + err.Error())
	}

	ProductAsBytes2, _ := json.Marshal(product2)
	err2 := stub.PutState(id2, ProductAsBytes2)
	if err2 != nil {
		return shim.Error("Failed to delete state:" + err2.Error())
	}

	ProductAsBytes3, _ := json.Marshal(product3)
	err3 := stub.PutState(id3, ProductAsBytes3)
	if err3 != nil {
		return shim.Error("Failed to delete state:" + err3.Error())
	}

	//sAsBytes, _ := json.Marshal(s)

	return shim.Success(ProductAsBytes3)
}

// ============================================================
// Create Product - create a new product
// ============================================================
func (t *SimpleChaincode) CreateProduct(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	mspid, _ := CallerCN(stub)
	if mspid != "Org1MSP" {

		return shim.Error("You are not authorized to do this operation")
	}
	id := ksuid.New().String()
	holders := []string{}
	holders = append(holders, args[3])

	var product = Product{ProductID: id,
		ManufacturingDate: args[1],
		ExpirationDate:    args[2],
		Name:              args[0],
		Manufacturer:      args[3],
		Holders:           holders,
	}
	ProductAsBytes, _ := json.Marshal(product)
	errr := stub.PutState(id, ProductAsBytes)
	if errr != nil {
		fmt.Printf("Error creating new Token: %s", errr)
	}

	return shim.Success(ProductAsBytes)
}

// ===============================================
// GetProduct - read a product from chaincode state
// ===============================================
func (t *SimpleChaincode) GetProduct(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var id string
	//jsonResp
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}

	id = args[0]
	ProductAsbytes, err := stub.GetState(id) //get the marble from chaincode state
	if err != nil {
		return shim.Error("Failed to delete state:" + err.Error())
	}

	return shim.Success(ProductAsbytes)
}

// ============================================================
// SendDeliveryRequest - Manufacturer send delevery request
// ============================================================

func (t *SimpleChaincode) SendDeliveryRequest(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var id string
	mspid, _ := CallerCN(stub)
	if mspid != "Org1MSP" {

		return shim.Error("You are not authorized to do this operation")
	}
	id = "DEL" + strconv.Itoa(rand.Intn(100))
	timestamp := time.Now()

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments ")
	}
	s, _ := strconv.ParseFloat(args[1], 32)
	var request = DeliveryRequest{deliveryID: id,
		ProductID:      args[0],
		Timestamp:      timestamp,
		Weight:         s,
		DateOfdelivery: args[2],
		Sended:         false,
		Accepted:       false,
		Deliver:        "",
	}

	RequestAsBytes, _ := json.Marshal(request)
	errr := stub.PutState(id, RequestAsBytes)
	if errr != nil {
		fmt.Printf("Error creating new Request: %s", errr)
	}
	return shim.Success(RequestAsBytes)
}

// ============================================================
// QueryDeliveryRequest - Delivery Man can get all available delevery request
// ============================================================
func (t *SimpleChaincode) QueryDeliveryRequest(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	mspid, _ := CallerCN(stub)
	if (mspid == "Org3MSP") || (mspid == "Org4MSP") || (mspid == "Org5MSP") {

		return shim.Error("You are not authorized to do this operation")
	}
	startKey := "DEL0"
	endKey := "DEL999"

	resultsIterator, err := stub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- queryAllCars:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

// ============================================================
// SendDelivery - Send product from a holder to an other
// ============================================================
func (t *SimpleChaincode) SendDelivery(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	mspid, _ := CallerCN(stub)
	if (mspid == "Org4MSP") || (mspid == "Org5MSP") {

		return shim.Error("You are not authorized to do this operation")
	}
	var id string
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments ")
	}

	id = args[0]
	request, err := getdeliveryRequest(stub, id)
	if err != nil {
		fmt.Printf("Error getting product: %s", err)
	}
	request.Sended = true
	ReqestAsbytes, _ := json.Marshal(request)
	stub.PutState(request.deliveryID, ReqestAsbytes)
	return shim.Success(ReqestAsbytes)
}

// ============================================================
// ServeDelivery - Used by delivery man to serve a delivery
// ============================================================
func (t *SimpleChaincode) ServeDelivery(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	mspid, _ := CallerCN(stub)

	if (mspid == "Org3MSP") || (mspid == "Org4MSP") || (mspid == "Org5MSP") {

		return shim.Error("You are not authorized to do this operation")
	}
	var id string
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments ")
	}

	id = args[0]
	request, err := getdeliveryRequest(stub, id)
	if err != nil {
		fmt.Printf("Error getting product: %s", err)
	}
	request.Served = true
	request.Deliver = args[1]
	ReqestAsbytes, _ := json.Marshal(request)
	stub.PutState(request.deliveryID, ReqestAsbytes)
	return shim.Success(ReqestAsbytes)
}

// ============================================================
// Acceptdelivery - used to Aceept a delivery
// ============================================================
func (t *SimpleChaincode) Acceptdelivery(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	var id string
	id = args[0]
	request, errr := getdeliveryRequest(stub, id)
	if errr != nil {
		fmt.Printf("Error getting request: %s", errr)
	}
	product, err := getProduct(stub, request.ProductID)
	if err != nil {
		fmt.Printf("Error getting product: %s", err)
	}
	// change delivery.Accepted
	request.Accepted = true
	RequestAsbytes, _ := json.Marshal(request)
	stub.PutState(request.deliveryID, RequestAsbytes)
	// Add product holder
	product.Holders = append(product.Holders, request.Deliver)
	ProductAsbytes, _ := json.Marshal(product)
	stub.PutState(product.ProductID, ProductAsbytes)
	return shim.Success(RequestAsbytes)
}

// ============================================================
// getHistoryForDelevryRequest - used for audit
// ============================================================

func (t *SimpleChaincode) getHistoryForDelevryRequest(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	RequestID := args[0]

	fmt.Printf("- start getHistoryForDelevryRequest: %s\n", RequestID)

	resultsIterator, err := stub.GetHistoryForKey(RequestID)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing historic values for the marble
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Value\":")
		// if it was a delete operation on given key, then we need to set the
		//corresponding value null. Else, we will write the response.Value
		//as-is (as the Value itself a JSON marble)
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"Timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"IsDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(response.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- getHistoryForDelevryRequest returning:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}
