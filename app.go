package main

import (
	"NyauruDLCManager/src/config"
	"NyauruDLCManager/src/update"
	"context"
	"encoding/json"
	"fmt"
	"io"
	goNet "net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	goRuntime "runtime"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
	"github.com/shirou/gopsutil/v3/process"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

var (
	updateMode = false
)

// NewApp creates a new App application struct
func NewApp() *App {
	args := os.Args[1:] //获取除程序名外的所有参数

	for i := 0; i < len(args); i++ {
		arg := args[i]

		//检测更新模式参数
		if arg == "--update" || arg == "-u" {
			updateMode = true
			break
		}
	}
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// IsUpdateMode 检测是否为更新模式
func (a *App) IsUpdateMode() bool {
	return updateMode
}

// 读取配置信息
type FileItem struct {
	Path         string `json:"path"`        //完整文件路径
	Name         string `json:"name"`        //名称
	Description  string `json:"description"` //描述
	Disabled     bool   `json:"disabled"`    //是否禁用
	OriginalPath string `json:"originalPath"`
	Group        string `json:"group"` //组
}

type FilesConfig struct {
	Files []FileConfig `json:"files"`
}

type FileConfig struct {
	Path        string `json:"path"`        //文件路径
	Name        string `json:"name"`        //名称
	Description string `json:"description"` //描述
	Group       string `json:"group"`
}

// GetFiles 获取所有文件及其状态
func (a *App) GetFiles() ([]FileItem, error) {
	// 读取配置文件
	configPath := filepath.Join("config", "files.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}
	var config FilesConfig
	err = json.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	//转换为FileItem并检查禁用状态
	var items []FileItem
	for _, file := range config.Files {
		//检查原始文件是否存在
		originalPath := file.Path
		disabledPath := file.Path + ".disable"

		var currentPath string
		var disabled bool

		//优先检查禁用状态的文件
		if _, err := os.Stat(disabledPath); err == nil {
			//.disable在，说明是禁用状态
			currentPath = disabledPath
			disabled = true
		} else if _, err := os.Stat(originalPath); err == nil {
			//说明是启用状态
			currentPath = originalPath
			disabled = false
		} else {
			//文件不存在，跳过
			continue
		}

		items = append(items, FileItem{
			Path:         currentPath,
			OriginalPath: originalPath,
			Name:         file.Name,
			Description:  file.Description,
			Disabled:     disabled,
			Group:        file.Group,
		})
	}

	return items, nil
}

// ToggleFile切换文件状态
func (a *App) ToggleFile(originalPath string, disable bool) error {
	var oldPath, newPath string

	if disable {
		//禁用
		oldPath = originalPath
		newPath = originalPath + ".disable"
	} else {
		//启用
		oldPath = originalPath + ".disable"
		newPath = originalPath
	}

	//检查源文件在不在
	if _, err := os.Stat(oldPath); os.IsNotExist(err) {
		return err
	}

	//检查目标在不在
	if _, err := os.Stat(newPath); err == nil {
		//目标文件已存在
		os.Remove(newPath)
	}

	//执行重命名
	err := os.Rename(oldPath, newPath)
	if err != nil {
		return err
	}

	return nil
}

const settingsPath = "config/settings.json"

// LoadSettings 加载程序设置
func (a *App) LoadSettings() (*config.Settings, error) {
	return config.LoadSettings(settingsPath)
}

// SaveSettings 保存程序设置
func (a *App) SaveSettings(set *config.Settings) error {
	return config.SaveSettings(settingsPath, set)
}

// ResetSettings 重置设置
func (a *App) ResetSettings() *config.Settings {
	return config.ResetSettings()
}

// 获取更新URL
func (a *App) GetUpdateURL() (string, error) {
	settings, err := config.LoadSettings(settingsPath)
	if err != nil {
		return "", err
	}
	return settings.UpdateUrl, nil
}

// 执行更新操作
func (a *App) PerformUpdate() error {
	settings, err := config.LoadSettings(settingsPath)
	if err != nil {
		runtime.EventsEmit(a.ctx, "update-log", fmt.Sprintf("Failed to load settings: %v\n", err))
		//发送失败事件
		runtime.EventsEmit(a.ctx, "update-result", map[string]interface{}{
			"success": false,
			"message": fmt.Sprintf("Failed to load settings: %v", err),
		})
		return err
	}

	if settings.UpdateUrl == "" {
		err := fmt.Errorf("Update URL is not set")
		runtime.EventsEmit(a.ctx, "update-log", "Update URL is not set, please configure it in the settings\n")
		//发送失败事件
		runtime.EventsEmit(a.ctx, "update-result", map[string]interface{}{
			"success": false,
			"message": "Update URL is not set, please configure it in the settings",
		})
		return err
	}

	//获取当前工作目录
	wd, err := os.Getwd()
	if err != nil {
		runtime.EventsEmit(a.ctx, "update-log", fmt.Sprintf("Failed to get working directory: %v\n", err))
		//发送失败事件
		runtime.EventsEmit(a.ctx, "update-result", map[string]interface{}{
			"success": false,
			"message": fmt.Sprintf("Failed to get workdir: %v", err),
		})
		return err
	}

	//创建更新器配置
	config := &update.Config{
		JSONURL:    settings.UpdateUrl,
		WorkDir:    wd,
		Timeout:    30,
		MaxRetries: 3,
		Logger:     &update.DefaultLogger{},
	}

	updater := update.NewUpdater(config)

	//在goroutine中执行更新避免阻塞前端
	go func() {
		//保存原始输出
		oldStdout := os.Stdout
		oldStderr := os.Stderr

		//创建管道
		r, w, err := os.Pipe()
		if err != nil {
			runtime.EventsEmit(a.ctx, "update-log", fmt.Sprintf("create pipe failed: %v\n", err))
			//发送失败事件
			runtime.EventsEmit(a.ctx, "update-result", map[string]interface{}{
				"success": false,
				"message": fmt.Sprintf("Failed to create pipe: %v", err),
			})
			return
		}

		//重定向输出
		os.Stdout = w
		os.Stderr = w

		buf := make([]byte, 8192) //8kb缓冲区
		go func() {
			for {
				n, err := r.Read(buf)
				if err != nil {
					break
				}
				if n > 0 {
					//发送所有数据
					runtime.EventsEmit(a.ctx, "update-log", string(buf[:n]))
				}
			}
		}()

		//执行更新
		err = updater.Run(settings.UpdateUrl)
		//恢复输出并清理
		os.Stdout = oldStdout
		os.Stderr = oldStderr
		w.Close()
		r.Close()

		if err != nil {
			runtime.EventsEmit(a.ctx, "update-result", map[string]interface{}{
				"success": false,
				"message": fmt.Sprintf("Update failed: %v", err),
			})
			runtime.EventsEmit(a.ctx, "update-log", fmt.Sprintf("Update failed: %v\n", err))
			runtime.EventsEmit(a.ctx, "update-log", "更新失败: %v\n", err)
			runtime.EventsEmit(a.ctx, "update-log", "请考虑重新更新或放弃更新\n")
		} else {
			runtime.EventsEmit(a.ctx, "update-result", map[string]interface{}{
				"success": true,
				"message": "Update succeed",
			})
			runtime.EventsEmit(a.ctx, "update-log", "Update succeed\n")
			runtime.EventsEmit(a.ctx, "update-log", "更新成功\n")

			//如果是更新模式更新成功，延时退出
			if updateMode {
				runtime.EventsEmit(a.ctx, "update-log", "将在5s后自动退出\n")
				time.Sleep(5 * time.Second)
				runtime.EventsEmit(a.ctx, "update-log", "程序将退出\n")
				os.Exit(0)
			}
		}
	}()

	return nil
}

type UILogWriter struct {
	ctx context.Context
}

func (a *App) RestartApp() error {
	//获取当前路径
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	//准备重启
	cmd := exec.Command(exe, os.Args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	//启动进程
	err = cmd.Start()
	if err != nil {
		return err
	}

	//退出进程
	os.Exit(0)
	return nil
}

type SystemInfo struct {
	//cpu信息
	CPUInfo    []cpu.InfoStat `json:"cpuInfo"`    //cpu详细信息
	CPUPercent float64        `json:"cpuPercent"` //cpu总使用率
	CPUPerCore []float64      `json:"cpuPerCore"` //核心使用率
	//内存信息
	Memory     *mem.VirtualMemoryStat `json:"memory"` //虚拟内存信息
	SwapMemory *mem.SwapMemoryStat    `json:"swap"`   //交换内存信息
	//磁盘信息
	DiskPartitions []disk.PartitionStat       `json:"diskPartitions"` //磁盘分区
	DiskUsage      map[string]*disk.UsageStat `json:"diskUsage"`      //每个分区的使用情况
	//网络信息
	NetIOCounters  []net.IOCountersStat `json:"netIOCounters"`  //网络计数
	NetConnections []net.ConnectionStat `json:"netConnections"` //网络连接
	//主机信息
	HostInfo *host.InfoStat `json:"hostInfo"` //主机信息
	//进程信息
	ProcessCount int `json:"processCount"` //进程总数
	//自身信息
	AppVersion string `json:"appVersion"` //程序版本
	GoVersion  string `json:"goVersion"`  //Go版本
}

// 系统信息获取区域
// GetSystemInfo 获取系统信息
func (a *App) GetSystemInfo() (*SystemInfo, error) {
	info := &SystemInfo{}
	//获取cpu信息
	cpuInfos, err := cpu.Info()
	if err == nil {
		info.CPUInfo = cpuInfos
	}

	cpuPercent, err := cpu.Percent(0, false)
	if err == nil && len(cpuPercent) > 0 {
		info.CPUPercent = cpuPercent[0]
	}

	cpuPerCore, err := cpu.Percent(0, true)
	if err == nil {
		info.CPUPerCore = cpuPerCore
	}

	//获取内存信息
	memStat, err := mem.VirtualMemory()
	if err == nil {
		info.Memory = memStat
	}

	swapStat, err := mem.SwapMemory()
	if err == nil {
		info.SwapMemory = swapStat
	}

	//获取磁盘信息
	partitions, err := disk.Partitions(false)
	if err == nil {
		info.DiskPartitions = partitions

		//获取每个分区的使用情况
		usageMap := make(map[string]*disk.UsageStat)
		for _, p := range partitions {
			usage, err := disk.Usage(p.Mountpoint)
			if err == nil {
				usageMap[p.Mountpoint] = usage
			}
		}
		info.DiskUsage = usageMap
	}

	//获取网络信息
	netIO, err := net.IOCounters(true)
	if err == nil {
		info.NetIOCounters = netIO
	}

	netConns, err := net.Connections("all")
	if err == nil {
		info.NetConnections = netConns
	}

	//获取主机信息
	hostInfo, err := host.Info()
	if err == nil {
		info.HostInfo = hostInfo
	}

	//获取进程数量
	processes, err := process.Processes()
	if err == nil {
		info.ProcessCount = len(processes)
	}

	//程序版本
	info.AppVersion = "1.2.4-GO.ver"
	info.GoVersion = goRuntime.Version()

	return info, nil
}

//ipv6检查区域

type IPv6Status struct {
	HasInternet bool     `json:"hasInternet"` //是否v6
	LatencyMs   int64    `json:"latencyMs"`   //延迟
	PublicIPs   []string `json:"publicIPs"`   //公网v6地址列表
	Details     string   `json:"details"`     //详细信息
}

// 获取本地公网v6地址
func getPublicIPv6Addresses() []string {
	var publicIPs []string

	interfaces, err := goNet.Interfaces()
	if err != nil {
		return publicIPs
	}

	for _, iface := range interfaces {
		//跳过未启用的
		if iface.Flags&goNet.FlagUp == 0 {
			continue
		}

		//跳过回环
		if iface.Flags&goNet.FlagLoopback != 0 {
			continue
		}

		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		for _, addr := range addrs {
			ipStr := addr.String()
			//检查是否是v6地址（用冒号检查
			if strings.Contains(ipStr, ":") {
				//去除子网掩码
				ip := goNet.ParseIP(strings.Split(ipStr, "/")[0])
				if ip == nil || ip.To16() == nil || ip.To4() != nil {
					continue
				}

				//检查是否是公网地址
				//不是回环地址
				if ip.IsLoopback() {
					continue
				}
				//不是链路本地地址fe80
				if ip.IsLinkLocalUnicast() {
					continue
				}
				//不是组播地址
				if ip.IsMulticast() {
					continue
				}
				//唯一本地地址前缀fc00::/7，1111110
				//0xFC或0xFD
				if len(ip) == 16 && (ip[0]&0xfe) == 0xfc {
					continue
				}
				//不是v4兼容地址
				if ip.Equal(goNet.IPv4(0, 0, 0, 0)) {
					continue
				}
				publicIPs = append(publicIPs, ip.String())
			}
		}
	}

	return publicIPs
}

// 检测v6连通性
func (a *App) CheckIPv6Connectivity() (*IPv6Status, error) {
	status := &IPv6Status{
		HasInternet: false,
		LatencyMs:   0,
		PublicIPs:   getPublicIPv6Addresses(),
		Details:     "Can't connect to IPV6 internet",
	}

	//超时时间
	timeout := 5 * time.Second

	//尝试连接的v6服务器列表
	servers := []struct {
		name string
		addr string
	}{
		{"Google DNS", "[2001:4860:4860::8888]:80"},
		{"Cloudflare DNS", "[2606:4700:4700::1111]:80"},
		{"OpenDNS", "[2001:19f0:8001:1::4]:80"},
	}

	for _, server := range servers {
		startTime := time.Now()
		conn, err := goNet.DialTimeout("tcp6", server.addr, timeout)
		if err == nil {
			conn.Close()
			status.HasInternet = true
			status.LatencyMs = time.Since(startTime).Milliseconds()
			status.Details = server.name
			return status, nil
		}
	}

	return status, nil
}

// stun检查
const (
	NATTypeUnknown            = "-1"
	NATTypeNone               = "0" //无NAT
	NATTypeFullCone           = "1" //Full Cone
	NATTypeRestrictedCone     = "2" //Restricted Cone
	NATTypePortRestrictedCone = "3" //Port Restricted Cone
	NATTypeSymmetric          = "4" //Symmetric
	NATTypeStrictSymmetric    = "5" //Symmetric
)

// stun检测结构体
type STUNResult struct {
	NatType         string   `json:"natType"`         //NAT类型
	PublicIP        string   `json:"publicIP"`        //公网地址
	PublicPort      int      `json:"publicPort"`      //公网端口
	MappedAddresses []string `json:"mappedAddresses"` //映射地址列表
	LatencyMs       int64    `json:"latencyMs"`       //延迟
	Details         string   `json:"details"`         //详细信息
	ServerUsed      string   `json:"serverUsed"`      //使用的服务器
}

// stun服务器列表
var stunServers = []string{
	"stun.stunprotocol.org:3478", //full check server
	"stun.voipgate.com:3478",     //full check server
	"stun.hot-chilli.net",
	"stun.syncthing.net",
	"stun.miwifi.com:3478",
	"stun.fitauto.ru",
	"stun.chat.bilibili.com:3478",
	"stun.hitv.com:3478",
	"stun.cdnbye.com:3478",
}

// stun常量
const (
	STUN_MAGIC_COOKIE              = 0x2112A442
	STUN_BIND_REQUEST              = 0x0001
	STUN_BIND_RESPONSE             = 0x0101
	STUN_FAMILY_IPV4               = 0x01
	STUN_ATTRIB_MAPPED_ADDRESS     = 0x0001
	STUN_ATTRIB_CHANGE_REQUEST     = 0x0003
	STUN_ATTRIB_XOR_MAPPED_ADDRESS = 0x0020
	STUN_CHANGE_PORT               = 0x0002
	STUN_CHANGE_IP                 = 0x0004
	STUN_PORT                      = 3478
)

// STUN测试结果
type stunTestResult struct {
	sourceAddr  *goNet.UDPAddr
	mappedIP    string
	mappedPort  int
	ipChanged   bool
	portChanged bool
	latency     time.Duration
}

// 发送stun请求并获取结果
func stunRequest(serverAddr string, localPort int, changeIP bool, changePort bool, timeout time.Duration, variation ...int) (*stunTestResult, error) {
	//解析服务器地址
	serverUDPAddr, err := goNet.ResolveUDPAddr("udp4", serverAddr)
	if err != nil {
		return nil, fmt.Errorf("fail to Resolve server address: %v", err)
	}

	//创建本地连接
	localAddr := &goNet.UDPAddr{
		IP:   goNet.IPv4zero,
		Port: localPort,
	}
	conn, err := goNet.ListenUDP("udp4", localAddr)
	if err != nil {
		return nil, fmt.Errorf("create udp channel failed: %v", err)
	}
	defer conn.Close()

	// 生成16字节随机事务ID
	transactionID := make([]byte, 16)
	for i := 0; i < 16; i++ {
		transactionID[i] = byte(time.Now().UnixNano() >> (uint(i) * 8))
	}

	//构建stun消息头
	msgHeader := make([]byte, 20)
	//Binding Request (0x0001)
	msgHeader[0] = 0x00
	msgHeader[1] = 0x01

	//构建CHANGE_REQUEST属性
	payload := []byte{}
	if changeIP || changePort {
		flags := 0
		if changeIP {
			flags |= STUN_CHANGE_IP
		}
		if changePort {
			flags |= STUN_CHANGE_PORT
		}
		//8字节CHANGE_REQUEST
		attr := make([]byte, 8)
		attr[0] = byte(STUN_ATTRIB_CHANGE_REQUEST >> 8)
		attr[1] = byte(STUN_ATTRIB_CHANGE_REQUEST)
		attr[2] = 0x00
		attr[3] = 0x04
		attr[4] = 0x00
		attr[5] = 0x00
		attr[6] = 0x00
		attr[7] = byte(flags)
		payload = attr
	}

	//设置消息长度
	msgLength := len(payload)
	msgHeader[2] = byte(msgLength >> 8)
	msgHeader[3] = byte(msgLength)

	//messageid
	copy(msgHeader[4:20], transactionID)

	//组合完整的消息
	msg := append(msgHeader, payload...)

	//发请求
	startTime := time.Now()
	_, err = conn.WriteToUDP(msg, serverUDPAddr)
	if err != nil {
		return nil, fmt.Errorf("failed to send message: %v", err)
	}

	//接收响应
	buffer := make([]byte, 1500)
	conn.SetReadDeadline(time.Now().Add(timeout))
	n, _, err := conn.ReadFromUDP(buffer)
	if err != nil {
		return nil, fmt.Errorf("read message failed: %v", err)
	}
	latency := time.Since(startTime)

	//解析响应
	if n < 20 {
		return nil, fmt.Errorf("message to short")
	}

	//检查消息类型
	msgType := int(buffer[0])<<8 | int(buffer[1])
	if msgType != STUN_BIND_RESPONSE {
		return nil, fmt.Errorf("not Binding Response")
	}

	//检查message id
	if string(buffer[4:20]) != string(transactionID) {
		return nil, fmt.Errorf("message id not available")
	}

	//解析属性
	pos := 20
	var mappedIP string
	var mappedPort int

	for pos+4 <= n {
		attrType := int(buffer[pos])<<8 | int(buffer[pos+1])
		attrLength := int(buffer[pos+2])<<8 | int(buffer[pos+3])

		if attrType == STUN_ATTRIB_MAPPED_ADDRESS {
			if attrLength >= 8 && pos+4+attrLength <= n {
				family := buffer[pos+5]
				port := int(buffer[pos+6])<<8 | int(buffer[pos+7])
				if family == STUN_FAMILY_IPV4 {
					ip := goNet.IP(buffer[pos+8 : pos+12])
					mappedIP = ip.String()
					mappedPort = port
					break
				}
			}
		} else if attrType == STUN_ATTRIB_XOR_MAPPED_ADDRESS {
			if attrLength >= 8 && pos+4+attrLength <= n {
				family := buffer[pos+5]
				xorPort := int(buffer[pos+6])<<8 | int(buffer[pos+7])
				if family == STUN_FAMILY_IPV4 {
					//XOR with magic cookie 16位
					port := xorPort ^ (STUN_MAGIC_COOKIE >> 16)

					//XOR IP with magic cookie
					xorIP := make([]byte, 4)
					copy(xorIP, buffer[pos+8:pos+12])

					//XOR运算
					magicCookie := uint32(STUN_MAGIC_COOKIE)
					ipInt := uint32(xorIP[0])<<24 | uint32(xorIP[1])<<16 | uint32(xorIP[2])<<8 | uint32(xorIP[3])
					realIPInt := ipInt ^ magicCookie

					realIP := make([]byte, 4)
					realIP[0] = byte(realIPInt >> 24)
					realIP[1] = byte(realIPInt >> 16)
					realIP[2] = byte(realIPInt >> 8)
					realIP[3] = byte(realIPInt)

					mappedIP = goNet.IP(realIP).String()
					mappedPort = port
					break
				}
			}
		}
		pos += 4 + attrLength
	}

	if mappedIP == "" {
		return nil, fmt.Errorf("can't find mapped address")
	}

	//获取源地址
	sourceAddr := conn.LocalAddr().(*goNet.UDPAddr)

	//判断ip和端口是否改变
	ipChanged := false
	portChanged := false

	//如果能获取到地址判断是否改变
	if remoteAddr, ok := conn.RemoteAddr().(*goNet.UDPAddr); ok {
		ipChanged = remoteAddr.IP.String() != serverUDPAddr.IP.String()
		portChanged = remoteAddr.Port != serverUDPAddr.Port
	}

	result := &stunTestResult{
		sourceAddr:  sourceAddr,
		mappedIP:    mappedIP,
		mappedPort:  mappedPort,
		ipChanged:   ipChanged,
		portChanged: portChanged,
		latency:     latency,
	}

	return result, nil
}

// 检测udpnat类型
func detectNATType(serverAddr string) (string, string, int, int64, error) {
	fmt.Printf("\nStart stun test\n")
	fmt.Printf("Stun server: %s\n", serverAddr)

	//获取随机端口
	localAddr := &goNet.UDPAddr{
		IP:   goNet.IPv4zero,
		Port: 0,
	}
	conn, err := goNet.ListenUDP("udp4", localAddr)
	if err != nil {
		return NATTypeUnknown, "", 0, 0, err
	}
	sourcePort := conn.LocalAddr().(*goNet.UDPAddr).Port
	conn.Close()
	fmt.Printf("local port: %d\n", sourcePort)

	//Test I
	//普通请求
	fmt.Printf("\nTest I Start\n")
	ret1, err := stunRequest(serverAddr, sourcePort, false, false, 3*time.Second)
	if err != nil {
		fmt.Printf("Test I failed: %v\n", err)
		return NATTypeUnknown, "", 0, 0, err
	}
	fmt.Printf("Test I:\n")
	fmt.Printf("  source address: %s:%d\n", ret1.sourceAddr.IP.String(), ret1.sourceAddr.Port)
	fmt.Printf("  mapped address: %s:%d\n", ret1.mappedIP, ret1.mappedPort)
	fmt.Printf("  latency: %v\n", ret1.latency)

	//Test II
	//多次相同端口请求检测对称nat
	fmt.Printf("\nTest II Start\n")
	samePortResults := []*stunTestResult{ret1}

	for i := 0; i < 4; i++ { //额外发送4次请求
		fmt.Printf("\n request%d:\n", i+1)
		ret, err := stunRequest(serverAddr, sourcePort, false, false, 3*time.Second)
		if err != nil {
			fmt.Printf("  request failed: %v\n", err)
			continue
		}
		samePortResults = append(samePortResults, ret)

		fmt.Printf("    mapped address: %s:%d\n", ret.mappedIP, ret.mappedPort)
		fmt.Printf("    compare with first request: ip %v, port %v\n",
			ret.mappedIP == ret1.mappedIP,
			ret.mappedPort == ret1.mappedPort)

		//只要有一次映射不同，判定严格对称nat
		if ret.mappedIP != ret1.mappedIP || ret.mappedPort != ret1.mappedPort {
			fmt.Printf("\n	mapped address has been change -> NAT4\n")
			fmt.Printf("  first request: %s:%d\n", ret1.mappedIP, ret1.mappedPort)
			fmt.Printf("  now: %s:%d\n", ret.mappedIP, ret.mappedPort)
			return NATTypeStrictSymmetric, ret1.mappedIP, ret1.mappedPort, ret.latency.Milliseconds(), nil
		}

		//稍微等待一下让nat有机会分配新的端口
		time.Sleep(100 * time.Millisecond)
	}

	fmt.Printf("\nall %d request none change\n", len(samePortResults))

	//Test III
	//改变IP和端口测试fullcone
	fmt.Printf("\nTest III (Change IP and Port)\n")
	ret3, err3 := stunRequest(serverAddr, sourcePort, true, true, 3*time.Second)
	if err3 == nil {
		fmt.Printf("Test III received response\n")
		fmt.Printf("  mapped address: %s:%d\n", ret3.mappedIP, ret3.mappedPort)
	} else {
		fmt.Printf("Test III failed: %v\n", err3)
	}

	//Test IV
	//只改变端口测试ip受限锥形
	fmt.Printf("\nTest IV (Change Port only)\n")
	ret4, err4 := stunRequest(serverAddr, sourcePort, false, true, 3*time.Second)
	if err4 == nil {
		fmt.Printf("Test IV received response\n")
		fmt.Printf("  mapped address: %s:%d\n", ret4.mappedIP, ret4.mappedPort)
	} else {
		fmt.Printf("Test IV failed: %v\n", err4)
	}

	//Test V
	//只改变IP，验证测试3和4的结果
	fmt.Printf("\nTest V (Change IP only)\n")
	ret5, err5 := stunRequest(serverAddr, sourcePort, true, false, 3*time.Second)
	if err5 == nil {
		fmt.Printf("Test V received response\n")
		fmt.Printf("  mapped address: %s:%d\n", ret5.mappedIP, ret5.mappedPort)
	} else {
		fmt.Printf("Test V failed: %v\n", err5)
	}

	//计算平均延迟
	avgLatency := ret1.latency.Milliseconds()

	//获取源ip
	sourceIP := ret1.sourceAddr.IP.String()
	mappedIP := ret1.mappedIP
	fmt.Printf("\nFinal judgment\n")
	fmt.Printf("source IP: %s\n", sourceIP)
	fmt.Printf("mapped IP: %s\n", mappedIP)

	//公网IP
	if sourceIP == mappedIP {
		fmt.Printf("Open net\n")
		return NATTypeNone, ret1.mappedIP, ret1.mappedPort, avgLatency, nil
	}

	//非公网情况判断nat类型
	if err3 == nil && err4 == nil && err5 == nil {
		//Test3，4，5都成功 ->Full Cone
		fmt.Printf("FullCone nat (all responses received)\n")
		return NATTypeFullCone, ret1.mappedIP, ret1.mappedPort, avgLatency, nil
	} else if err4 == nil && err5 == nil {
		//Test4和5成功，但3失败 ->Restricted Cone
		fmt.Printf("IpRestrictedCone nat (responses from same IP only)\n")
		return NATTypeRestrictedCone, ret1.mappedIP, ret1.mappedPort, avgLatency, nil
	} else if err4 == nil {
		//只有Test4成功 ->Port Restricted Cone
		fmt.Printf("PortRestrictedCone nat (responses from same IP:port only)\n")
		return NATTypePortRestrictedCone, ret1.mappedIP, ret1.mappedPort, avgLatency, nil
	} else if err3 != nil && err4 != nil && err5 != nil {
		//Test345全部失败 ->Symmetric NAT
		fmt.Printf("Symmetric nat (no external hosts can reach client)\n")
		return NATTypeSymmetric, ret1.mappedIP, ret1.mappedPort, avgLatency, nil
	}

	fmt.Printf("PortRestrictedCone nat (by default)\n")
	return NATTypePortRestrictedCone, ret1.mappedIP, ret1.mappedPort, avgLatency, nil
}

// 执行stun检测
func (a *App) CheckSTUN() (*STUNResult, error) {
	//模拟数据 表示正在检查
	result := &STUNResult{
		NatType:         NATTypeUnknown,
		PublicIP:        "",
		PublicPort:      0,
		MappedAddresses: []string{},
		LatencyMs:       0,
		Details:         "checking...",
		ServerUsed:      "",
	}

	//遍历stun服务器地址表
	for _, serverAddr := range stunServers {
		natType, publicIP, publicPort, latency, err := detectNATType(serverAddr)
		if err == nil {
			result.NatType = natType
			result.PublicIP = publicIP
			result.PublicPort = publicPort
			result.LatencyMs = latency
			result.ServerUsed = serverAddr

			//生成详细信息
			details := fmt.Sprintf("test final from %s", serverAddr)
			result.Details = details

			return result, nil
		}
	}

	result.Details = "cannot connect to any stun server"
	return result, fmt.Errorf("stun test failed")
}

// 延迟检查部分
// 测试tcp连接延迟
func (a *App) TestTCPLatency(host string, port int, count int) (float64, error) {
	if count <= 0 {
		count = 1
	}

	var totalLatency time.Duration
	successCount := 0

	for i := 0; i < count; i++ {
		start := time.Now()

		//尝试建立tcp连接
		conn, err := goNet.DialTimeout("tcp", fmt.Sprintf("%s:%d", host, port), 5*time.Second)
		if err != nil {
			continue
		}

		latency := time.Since(start)
		conn.Close()

		totalLatency += latency
		successCount++

		//稍微等待避免请求过于频繁
		if i < count-1 {
			time.Sleep(100 * time.Millisecond)
		}
	}

	if successCount == 0 {
		return -1, fmt.Errorf("all test failed")
	}

	//返回平均延迟
	avgLatency := float64(totalLatency.Milliseconds()) / float64(successCount)
	return avgLatency, nil
}

func (a *App) FetchAddressList(url string) (string, error) {
	//设置超时时间
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	//发起请求
	resp, err := client.Get(url)
	if err != nil {
		return "", fmt.Errorf("fetch failed: %v", err)
	}
	defer resp.Body.Close()

	//检查状态码
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP ERROR: %d", resp.StatusCode)
	}

	//读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("%v", err)
	}

	return string(body), nil
}
