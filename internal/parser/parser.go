package parser

import (
	"encoding/json"
	"fmt"
	"mime/multipart"
)

type (
	DesksFile struct {
		Zones []Zone `json:"zones"`
	}

	Zone struct {
		Name  string `json:"name"`
		Desks []Desk `json:"desks"`
	}

	Desk struct {
		Name string `json:"name"`
	}
)

func ParseDesksFile(fileHeader *multipart.FileHeader) (*DesksFile, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open file")
	}
	defer file.Close()

	var desksFile DesksFile
	if err := json.NewDecoder(file).Decode(&desksFile); err != nil {
		return nil, fmt.Errorf("failed to parse desks file: %w", err)
	}

	return &desksFile, nil
}
