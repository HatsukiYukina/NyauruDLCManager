import React, { useState, useEffect, useRef } from "react";
import { Progress } from "@heroui/progress";
import { Divider } from "@heroui/divider";

//导入Wails绑定
import { GetSystemInfo } from "../../wailsjs/go/main/App";

//图标组件
const CpuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

const MemoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DiskIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);

const NetworkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ProcessIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const HostIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

interface SystemInfoProps {
  className?: string;
  refreshInterval?: number;
}

export const SystemInfo: React.FC<SystemInfoProps> = ({
                                                        className = "",
                                                        refreshInterval = 3000 //刷新延迟
                                                      }) => {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const loadSystemInfo = async () => {
    try {
      const info = await GetSystemInfo();
      setSystemInfo(info);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemInfo();
    timerRef.current = setInterval(loadSystemInfo, refreshInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshInterval]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-default-400">加载系统信息中</p>
      </div>
    );
  }

  if (error || !systemInfo) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-danger-500">加载失败:{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 overflow-y-auto pr-2 ${className}`}>
      <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
        <InfoIcon />
        <h2 className="text-lg font-semibold">系统信息</h2>
      </div>

      <Divider />

      {/*主机信息*/}
      {systemInfo.hostInfo && (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HostIcon />
              <span className="text-sm font-medium">主机信息</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm ml-7">
              <span className="text-default-500">主机名</span>
              <span>{systemInfo.hostInfo.hostname}</span>

              <span className="text-default-500">操作系统</span>
              <span>{systemInfo.hostInfo.os} {systemInfo.hostInfo.platformVersion}</span>

              <span className="text-default-500">平台</span>
              <span>{systemInfo.hostInfo.platform} {systemInfo.hostInfo.platformFamily}</span>

              <span className="text-default-500">内核版本</span>
              <span>{systemInfo.hostInfo.kernelVersion}</span>

              <span className="text-default-500">运行时间</span>
              <span>
                {Math.floor(systemInfo.hostInfo.uptime / 3600)}小时
              </span>
            </div>
          </div>
          <Divider />
        </>
      )}

      {/*CPU信息*/}
      {systemInfo.cpuInfo && systemInfo.cpuInfo.length > 0 && (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CpuIcon />
              <span className="text-sm font-medium">CPU</span>
            </div>
            <div className="space-y-2 ml-7">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-default-500">型号</span>
                <span className="text--default-500">{systemInfo.cpuInfo[0].modelName}</span>

                <span className="text-default-500">核心数</span>
                <span>{systemInfo.cpuInfo.length} 物理CPU / {systemInfo.cpuPerCore?.length || 0} 逻辑核心</span>

                <span className="text-default-500">频率</span>
                <span>{systemInfo.cpuInfo[0].mhz} MHz</span>
              </div>

              <div className="text-sm">
                <span className="text-default-500">总使用率:</span>
                <span>{systemInfo.cpuPercent?.toFixed(1)}%</span>
              </div>

              {systemInfo.cpuPerCore && (
                <div className="space-y-1">
                  <span className="text-xs text-default-500">各核心使用率:</span>
                  <div className="grid grid-cols-4 gap-1">
                    {systemInfo.cpuPerCore.map((percent: number, i: number) => (
                      <div key={i} className="text-xs">
                        <span className="text-default-400">Core {i}:</span> {percent.toFixed(0)}%
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <Divider />
        </>
      )}

      {/*内存信息*/}
      {systemInfo.memory && (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MemoryIcon />
              <span className="text-sm font-medium">内存信息</span>
            </div>
            <div className="space-y-2 ml-7">
              <Progress
                value={systemInfo.memory.usedPercent}
                color={systemInfo.memory.usedPercent > 80 ? "danger" : "success"}
                className="h-2"
              />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-default-500">总计</span>
                <span>{formatBytes(systemInfo.memory.total)}</span>

                <span className="text-default-500">已用</span>
                <span>{formatBytes(systemInfo.memory.used)} ({systemInfo.memory.usedPercent.toFixed(1)}%)</span>

                <span className="text-default-500">可用</span>
                <span>{formatBytes(systemInfo.memory.available)}</span>

                <span className="text-default-500">缓存</span>
                <span>{formatBytes(systemInfo.memory.cached || 0)}</span>
              </div>
            </div>
          </div>
          <Divider />
        </>
      )}

      {/*磁盘信息*/}
      {systemInfo.diskUsage && Object.keys(systemInfo.diskUsage).length > 0 && (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DiskIcon />
              <span className="text-sm font-medium">磁盘</span>
            </div>
            <div className="space-y-3 ml-7">
              {Object.entries(systemInfo.diskUsage).map(([mount, usage]: [string, any]) => (
                <div key={mount} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{mount}</span>
                    <span className="text-default-500">{usage.fstype}</span>
                  </div>
                  <Progress value={usage.usedPercent} className="h-1.5" />
                  <div className="flex justify-between text-xs text-default-400">
                    <span>已用 {formatBytes(usage.used)}</span>
                    <span>总计 {formatBytes(usage.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Divider />
        </>
      )}

      {/* 网络信息 */}
      {systemInfo.netIOCounters && systemInfo.netIOCounters.length > 0 && (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <NetworkIcon />
              <span className="text-sm font-medium">网络信息</span>
            </div>
            <div className="space-y-2 ml-7">
              {systemInfo.netIOCounters.slice(0, 3).map((net: any, i: number) => (
                <div key={i} className="text-xs">
                  <span className="font-medium">{net.name}</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <span className="text-default-400">↓接收:</span>
                    <span>{formatBytes(net.bytesRecv)}</span>
                    <span className="text-default-400">↑发送:</span>
                    <span>{formatBytes(net.bytesSent)}</span>
                  </div>
                </div>
              ))}
              <div className="text-xs text-default-400">
                连接数:{systemInfo.netConnections?.length || 0}
              </div>
            </div>
          </div>
          <Divider />
        </>
      )}

      {/*进程信息*/}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ProcessIcon />
          <span className="text-sm font-medium">进程信息</span>
        </div>
        <div className="ml-7 text-sm">
          <span className="text-default-500">运行中进程: </span>
          <span>{systemInfo.processCount || 0}</span>
        </div>
      </div>

      <Divider />
    </div>
  );
};