package main

import (
	"time"
)

//Product definition
type Product struct {
	ProductID         string   `json:"Product_Id"`
	ManufacturingDate string   `json:"Manufacturing_Date"`
	ExpirationDate    string   `json:"Expiration_Date"`
	Name              string   `json:"Name"`
	Manufacturer      string   `json:"Manufacturer"`
	Holders           []string `json:"Holders"`
}

type DeliveryRequest struct {
	deliveryID     string    `json:"deliveryID"`
	ProductID      string    `json:"Product_Id"`
	Timestamp      time.Time `json:"Timestamp"`
	Weight         float64   `json:"weight"`
	DateOfdelivery string    `json:"DateOfdelivery"`
	Served         bool      `json:"Served"`
	Sended         bool      `json:"Sended"`
	Accepted       bool      `json:"Accepted"`
	Deliver        string    `json:"Deliver"`
}


type QueryResult struct {
	Key    string `json:"Key"`
	Record *DeliveryRequest
}
