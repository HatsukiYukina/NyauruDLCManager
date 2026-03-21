package update

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// 日志接口
type Logger interface {
	Info(format string, args ...interface{})  //普通信息
	Warn(format string, args ...interface{})  //警告
	Error(format string, args ...interface{}) //错误
}

// 默认日志实现
type DefaultLogger struct{}

func (l *DefaultLogger) Info(format string, args ...interface{}) {
	fmt.Printf("[INFO] "+format, args...)
}
func (l *DefaultLogger) Warn(format string, args ...interface{}) {
	fmt.Printf("[WARN] "+format, args...)
}
func (l *DefaultLogger) Error(format string, args ...interface{}) {
	fmt.Printf("[ERROR] "+format, args...)
}

// 更新器配置结构体
type Config struct {
	JSONURL    string //更新清单Url
	WorkDir    string //工作目录
	Timeout    int    //下载超时时间
	MaxRetries int    //最大重试次数
	Logger     Logger //日志接口
}

// json结构
type UpdateJSON struct {
	Download []DownloadItem `json:"download"` //下载项列表
	Copy     []CopyItem     `json:"copy"`     //复制项列表
	Delete   []DeleteItem   `json:"delete"`   //删除项列表
}

// 下载项
type DownloadItem struct {
	Name   string `json:"name"`   //临时文件名
	URL    string `json:"url"`    //文件的下载地址
	Path   string `json:"path"`   //最终安装路径
	SHA256 string `json:"sha256"` //sha256
}

type CopyItem struct {
	File string `json:"file"` //源文件
	Path string `json:"path"` //目标路径
}

// 删除项
type DeleteItem struct {
	DeleteFile string `json:"deletefile"` //要删除的文件
}

// 更新器核心
type Updater struct {
	config     *Config      //更新器配置
	httpClient *http.Client //http客户端
	logger     Logger       //日志记录器
}

// 构造函数
func NewUpdater(config *Config) *Updater {
	//如果传入nil创建一个空配置
	if config == nil {
		config = &Config{}
	}

	//当前工作目录
	if config.WorkDir == "" {
		wd, _ := os.Getwd()
		config.WorkDir = wd
	}

	//超时30秒
	if config.Timeout == 0 {
		config.Timeout = 30
	}

	//重试3次
	if config.MaxRetries == 0 {
		config.MaxRetries = 3
	}

	//使用控制台日志
	if config.Logger == nil {
		config.Logger = &DefaultLogger{}
	}

	//创建http客户端
	client := &http.Client{
		Timeout: time.Duration(config.Timeout) * time.Second,
	}

	return &Updater{
		config:     config,
		httpClient: client,
		logger:     config.Logger,
	}
}

// 公共方法
// 示例
//
//	err := updater.Run("https://example.com/update.json")
//	if err != nil {
//	    log.Fatal(err)
//	}
func (u *Updater) Run(jsonURL string) error {
	//确定更新清单url
	//使用传入的url或配置中的url
	if jsonURL == "" {
		jsonURL = u.config.JSONURL
	}
	if jsonURL == "" {
		return fmt.Errorf("URL error")
	}

	//验证url格式
	if !u.isValidURL(jsonURL) {
		return fmt.Errorf("inValid url:%s", jsonURL)
	}

	u.logger.Info("Start update\n")
	u.logger.Info("Work dir: %s\n", u.config.WorkDir)
	u.logger.Info("update list: %s\n", jsonURL)

	//下载并解析更新清单
	u.logger.Info("Getting Update json file...\n")
	updateJSON, err := u.fetchUpdateJSON(jsonURL)
	if err != nil {
		return fmt.Errorf("Json file download failed: %v", err)
	}
	u.logger.Info("Update json is downloaded\n")

	//执行下载操作
	if len(updateJSON.Download) > 0 {
		u.logger.Info("\nStart update process\n")
		u.logger.Info("A total of %d files need to be download\n", len(updateJSON.Download))

		for i, item := range updateJSON.Download {
			u.logger.Info("[%d/%d] ", i+1, len(updateJSON.Download))
			if err := u.downloadItem(&item); err != nil {
				u.logger.Error("download failed: %v\n", err)
			}
		}
	} else {
		u.logger.Info("There are no files to download!\n")
	}

	//复制项
	if len(updateJSON.Copy) > 0 {
		u.logger.Info("\nCopy file to target fold\n")
		u.logger.Info("A total of %d files need to be copied\n", len(updateJSON.Copy))

		for i, item := range updateJSON.Copy {
			u.logger.Info("[%d/%d] ", i+1, len(updateJSON.Copy))
			if err := u.copyItem(&item); err != nil {
				u.logger.Error("Copy failed: %v\n", err)
			}
		}
	} else {
		u.logger.Info("There are no files to copy!\n")
	}

	//删除操作
	if len(updateJSON.Delete) > 0 {
		u.logger.Info("\nStart clean process\n")
		u.logger.Info("A total of %d files need to be clean\n", len(updateJSON.Delete))

		for i, item := range updateJSON.Delete {
			u.logger.Info("[%d/%d] ", i+1, len(updateJSON.Delete))
			if err := u.deleteItem(&item); err != nil {
				u.logger.Error("Delete failed: %v\n", err)
			}
		}
	} else {
		u.logger.Info("There are no files to delete!\n")
	}

	//完成
	u.logger.Info("Finish process\n")

	return nil
}

// 私有方法
func (u *Updater) fetchUpdateJSON(jsonURL string) (*UpdateJSON, error) {
	//添加随机参数防止cdn或浏览器缓存
	randURL := fmt.Sprintf("%s?rand=%d", jsonURL, time.Now().UnixNano())

	//发送http请求
	resp, err := u.httpClient.Get(randURL)
	if err != nil {
		return nil, fmt.Errorf("%v", err)
	}
	defer resp.Body.Close()

	//检查http状态码
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP code error: %d", resp.StatusCode)
	}

	//读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("%v", err)
	}

	//解析json
	var updateJSON UpdateJSON
	if err := json.Unmarshal(body, &updateJSON); err != nil {
		return nil, fmt.Errorf("%v", err)
	}
	return &updateJSON, nil
}

// 下载单个文件
func (u *Updater) downloadItem(item *DownloadItem) error {
	u.logger.Info("Target file: %s\n", item.Path)

	if item.SHA256 != "" {
		//verifyFileSHA256
		match, err := u.verifyFileSHA256(item.Path, item.SHA256)
		if err == nil && match {
			u.logger.Info("The target file already exists and the SHA256 matches, skipping download\n")
			return nil
		}
		if err != nil {
			u.logger.Info("Target file check failed: %v (will re-download)\n", err)
		} else if !match {
			u.logger.Info("The target file SHA256 does not match and will be re-downloaded\n")
		}
	}

	//准备下载
	//临时文件路径
	tempPath := filepath.Join(u.config.WorkDir, item.Name)

	//添加随机参数防止缓存
	randURL := fmt.Sprintf("%s?rand=%d", item.URL, time.Now().UnixNano())
	u.logger.Info("Downloading: %s\n", randURL)

	//发送http请求
	resp, err := u.httpClient.Get(randURL)
	if err != nil {
		return fmt.Errorf("Download failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP code error: %d", resp.StatusCode)
	}

	outFile, err := os.Create(tempPath)
	if err != nil {
		return fmt.Errorf("Failed to create temporary file: %v", err)
	}

	_, err = io.Copy(outFile, resp.Body)
	outFile.Close() //立即关闭

	if err != nil {
		os.Remove(tempPath) //写入失败时清理临时文件
		return fmt.Errorf("Failed to write temporary file: %v", err)
	}

	u.logger.Info("Download successful: %s\n", tempPath)

	if item.SHA256 != "" {
		match, err := u.verifyFileSHA256(tempPath, item.SHA256)
		if err != nil {
			os.Remove(tempPath)
			return fmt.Errorf("SHA256 verification failed: %v", err)
		}
		if !match {
			os.Remove(tempPath)
			return fmt.Errorf("SHA256 does not match, the file may be corrupted")
		}
		u.logger.Info("SHA256 verification successful\n")
	}

	return nil
}

// copyItem 复制文件
func (u *Updater) copyItem(item *CopyItem) error {
	//构建源文件路径
	sourcePath := filepath.Join(u.config.WorkDir, item.File)
	destPath := item.Path

	u.logger.Info("Copying: %s -> %s\n", sourcePath, destPath)

	if _, err := os.Stat(sourcePath); os.IsNotExist(err) {
		u.logger.Info("The source file does not exist, skipping: %s\n", sourcePath)
		return nil
	}

	destDir := filepath.Dir(destPath)
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return fmt.Errorf("Failed to create target directory: %v", err)
	}

	sourceFile, err := os.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("Failed to open the source file: %v", err)
	}
	defer sourceFile.Close()

	destFile, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("Failed to create target file: %v", err)
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return fmt.Errorf("Failed to copy file: %v", err)
	}

	u.logger.Info("Copy successful: %s\n", destPath)
	return nil
}

// deleteItem 删除文件
func (u *Updater) deleteItem(item *DeleteItem) error {
	filePath := item.DeleteFile

	u.logger.Info("cleaning: %s\n", filePath)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		u.logger.Info("File does not exist, skipping: %s\n", filePath)
		return nil
	}

	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("Delete failed: %v", err)
	}

	u.logger.Info("clean successful\n")
	return nil
}

// verifyFileSHA256 验证文件SHA256
func (u *Updater) verifyFileSHA256(filePath, expectedHash string) (bool, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return false, err
	}
	defer file.Close()

	hasher := sha256.New()

	if _, err := io.Copy(hasher, file); err != nil {
		return false, err
	}

	actualHash := hex.EncodeToString(hasher.Sum(nil))

	return strings.ToLower(actualHash) == strings.ToLower(expectedHash), nil
}

// isValidURL 验证url
func (u *Updater) isValidURL(urlStr string) bool {
	parsed, err := url.Parse(urlStr)
	if err != nil {
		return false
	}
	return parsed.Scheme == "http" || parsed.Scheme == "https"
}
