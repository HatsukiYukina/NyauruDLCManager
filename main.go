package main

import (
	"embed"
	"encoding/json"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

type Settings struct {
	Theme        string `json:"theme"`
	Language     string `json:"language"`
	CheckUpdates bool   `json:"checkUpdates"`
	UpdateUrl    string `json:"updateUrl"`
	NativeWindow bool   `json:"nativeWindow"`
}

// 加载设置
func loadSettings() (*Settings, error) {
	configPath := filepath.Join("config", "settings.json")

	//默认设置
	defaultSettings := &Settings{
		Theme:        "light",
		Language:     "zh-CN",
		CheckUpdates: true,
		NativeWindow: false,
	}

	// 检查文件是否存在
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return defaultSettings, nil
	}

	//读取文件
	data, err := os.ReadFile(configPath)
	if err != nil {
		return defaultSettings, err
	}

	//解析Json
	var settings Settings
	err = json.Unmarshal(data, &settings)
	if err != nil {
		return defaultSettings, err
	}

	return &settings, nil
}

func main() {
	// Create an instance of the app structure
	app := NewApp()

	settings, err := loadSettings()
	if err != nil {
		println("Warning: Failed to load settings, using default:", err.Error())
		settings = &Settings{
			Theme:        "light",
			Language:     "zh-CN",
			CheckUpdates: true,
			NativeWindow: false,
		}
	}

	//根据NativeWindow设置Frameless
	frameless := !settings.NativeWindow

	// Create application with options
	err = wails.Run(&options.App{
		Title:     "NyauruDLCManager",
		Width:     768,
		Height:    480,
		Frameless: frameless,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
