import React, { useState, useEffect } from "react";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";

//导入Wails绑定
import { CheckSTUN } from "../../wailsjs/go/main/App";

//图标组件
const STUNIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);



interface STUNStatusProps {
  className?: string;
}

export const STUNStatus: React.FC<STUNStatusProps> = ({ className = "" }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const NAT_TYPE_MAP = {
    0: "公网",
    1: "全锥形NAT",
    2: "ip限制型NAT",
    3: "端口限制型NAT",
    4: "对称形NAT",
    5: "严格对称形NAT"
  };

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await CheckSTUN();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const getNATTypeColor = (natType: string) => {
    switch (natType) {
      case "0":
        return "success";
      case "1":
        return "success";
      case "2":
        return "primary";
      case "3":
        return "warning";
      case "4":
        return "danger";
      case "5":
        return "danger";
      default:
        return "default";
    }
  };

  const getNATTypeDescription = (natType: string) => {
    switch (natType) {
      case "0":
        return "您的网络是公网ipv4，没有任何限制，可以直接向公网开放指定服务端口";
      case "1":
        return "任何外部主机都可以通过映射的地址访问您的设备，限制很少，最开放的nat类型";
      case "2":
        return "只有你曾经通信过的ip可以访问您的设备，p2p连接需要辅助";
      case "3":
        return "只有您曾经通信过的ip和端口可以访问您的设备，p2p连接较困难";
      case "4":
        return "每个请求使用不同的映射，几乎无法向公网开放任何服务，限制最大的nat类型";
      case "5":
        return "每个请求严格使用不同的映射，几乎无法向公网开放任何服务，限制最大的nat类型";
      default:
        return "无法确定nat类型，或许可以尝试重新测试";
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <Spinner label="STUN检测中.." />
      </div>
    );
  }

  if (error || !status) {
    return (

      <div className={`w-full ${className}`}>
          <div className="text-center py-4">
            <p className="text-danger-500 mb-2">STUN检测失败:{error}</p>
            <Button size="sm" color="primary" onPress={loadStatus}>
              重试
            </Button>
          </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 overflow-y-auto pr-2 ${className}`}>
        {/* 标题和状态 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <STUNIcon />
            <h3 className="text-md font-semibold">STUN检测</h3>
            <Button
              size="sm"
              variant="light"
              onPress={loadStatus}
              startContent={<RefreshIcon />}
            >
              刷新
            </Button>
          </div>
          {status.publicIP && (
            <Tooltip content="外部公网IP地址">
              <Chip size="sm" color="success" variant="flat">
                检查成功
              </Chip>
            </Tooltip>
          )}
        </div>

        <Divider />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">nat类型</span>
            <Chip
              size="sm"
              color={getNATTypeColor(status.natType) as any}
              variant="flat"
              className="ml-auto"
            >
              {NAT_TYPE_MAP[status.natType as keyof typeof NAT_TYPE_MAP] || "Unknown"}
            </Chip>
          </div>

          {/* 类型说明 */}
          <div className="text-xs text-default-500 bg-default-50 p-2 rounded">
            {getNATTypeDescription(status.natType)}
          </div>

          {/* 公网信息 */}
          {status.publicIP && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-default-500">公网IP:</span>
                <span className="text-default-700 font-mono">{status.publicIP}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-default-500">公网端口:</span>
                <span className="text-default-700 font-mono">{status.publicPort}</span>
              </div>
            </>
          )}

          {/*延迟*/}
          {status.latencyMs > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-default-500">测试延迟:</span>
              <span className="text-default-700">{status.latencyMs}ms</span>
            </div>
          )}
        </div>
        <div className="text-xs text-default-400">
          {status.details}
        </div>
      <Divider />
    </div>
  );
};