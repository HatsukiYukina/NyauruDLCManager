package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type Settings struct {
	Theme            string `json:"theme"`            //主题
	Language         string `json:"language"`         //语言
	CheckUpdates     bool   `json:"checkUpdates"`     //是否检查更新
	UpdateUrl        string `json:"updateUrl"`        //更新链接
	NativeWindow     bool   `json:"nativeWindow"`     //原生窗口
	AddressUrl       string `json:"addressUrl"`       //延迟检测链接
	LatencyTestCount int    `json:"latencyTestCount"` //延迟检测链接
}

// 默认设置
var defaultSettings = Settings{
	Theme:            "light",
	Language:         "zh-CN",
	CheckUpdates:     true,
	UpdateUrl:        "https://www.example.com/update.json",
	AddressUrl:       "https://www.example.com/address.json",
	LatencyTestCount: 1,
}

// LoadSettings 从文件加载设置
func LoadSettings(path string) (*Settings, error) {
	//检查文件是否存在
	if _, err := os.Stat(path); os.IsNotExist(err) {
		// 文件不存在，返回默认设置
		return &defaultSettings, nil
	}

	//读取文件
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("%v", err)
	}

	//解析Json
	var settings Settings
	err = json.Unmarshal(data, &settings)
	if err != nil {
		return nil, fmt.Errorf("%v", err)
	}

	return &settings, nil
}

// SaveSettings 保存设置到文件
func SaveSettings(path string, settings *Settings) error {
	//确保目录存在
	dir := filepath.Dir(path)
	err := os.MkdirAll(dir, 0755)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	//转换为Json
	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	//写入文件
	err = os.WriteFile(path, data, 0644)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	return nil
}

// ResetSettings 重置为默认设置
func ResetSettings() *Settings {
	return &defaultSettings
}
