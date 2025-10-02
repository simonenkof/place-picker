package main

import (
	"fmt"
	"place-picker/internal/config"
)

func main() {
	config := config.MustLoadConfig()
	fmt.Print(config)
}