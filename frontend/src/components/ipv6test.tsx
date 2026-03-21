import React, { useState, useEffect } from "react";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";

//导入Wails绑定
import { CheckIPv6Connectivity } from "../../wailsjs/go/main/App";

//图标组件
const NetworkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

interface IPv6StatusProps {
  className?: string;
}

export const IPv6Status: React.FC<IPv6StatusProps> = ({ className = "" }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CheckIPv6Connectivity();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(String(err));
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  if (error) {
    return (
      <div className={`w-full ${className}`}>
          <div className="text-center py-4">
            <p className="text-danger-500 mb-2">检测失败: {error}</p>
            <Button size="sm" color="primary" onPress={loadStatus}>
              重试
            </Button>
          </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <Spinner label="检测ipv6状态中..." />
      </div>
    );
  }

  if (!status) {
    return (
      <div className={`w-full ${className}`}>
          <div className="text-center py-4">
            <p className="text-default-500 mb-2">无法获取IPv6状态</p>
            <Button size="sm" color="primary" onPress={loadStatus}>
              重试
            </Button>
          </div>
      </div>
    );
  }

  const publicIPs = status.publicIPs || [];
  const displayIPs = expanded ? publicIPs : publicIPs.slice(0, 3);

  return (
    <div className={`space-y-4 overflow-y-auto pr-2 ${className}`}>
      {/*标题和状态*/}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NetworkIcon />
          <h3 className="text-md font-semibold">ipv6状态</h3>
          <Button
            size="sm"
            variant="light"
            onPress={loadStatus}
            startContent={<RefreshIcon />}
          >
            刷新
          </Button>
        </div>
        <Chip
          size="sm"
          color={status.hasInternet ? "success" : "danger"}
          variant="flat"
        >
          {status.hasInternet ? "可使用" : "不可使用"}
        </Chip>
      </div>

      <Divider />

      {/*连接信息 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-default-500">测试地址:</span>
          <span className="text-default-700">{status.details}</span>
        </div>

        {status.hasInternet && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-default-500">延迟:</span>
            <span className="text-default-700">{status.latencyMs} ms</span>
          </div>
        )}
      </div>

      {/*v6地址列表 */}
      {publicIPs.length > 0 && (
        <>
          <Divider />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <NetworkIcon />
              <span className="text-sm font-medium">公网ipv6地址</span>
              <Chip size="sm" variant="flat" className="ml-auto">
                {publicIPs.length} 个
              </Chip>
            </div>

            <div className="space-y-2">
              {displayIPs.map((ip: string, index: number) => (
                <div
                  key={index}
                  className="text-xs bg-default-100 dark:bg-default-800 p-2 rounded break-all"
                >
                  {ip}
                </div>
              ))}

              {publicIPs.length > 3 && (
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => setExpanded(!expanded)}
                  className="w-full mt-1"
                >
                  {expanded ? "收起" : `显示全部${publicIPs.length}个地址`}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
      <p className="text-xs">
        {status.hasInternet ? "这代表您可以访问ipv6网络，并自由连接服务器/他人联机的ipv6地址" : "这代表您不可访问ipv6网络，如果您希望改善，请检查路由器/光猫等设备，并开启相应的ipv6开关，及关闭ipv6防火墙。若您使用移动数据网络，通常ipv6已默认开启，您应检查系统的ipv6是否打开等问题。ipv6可以为您的上网增加一些体验，推荐您及时打开。"}
      </p>
      <p className="text-xs">
        {publicIPs.length>0 && "您已拥有公网ipv6地址，通常这代表您可以自由的作为服务端/联机主机端与他人联机。但前提是联机的其他人也可使用ipv6，并且您的光猫/路由器的ipv6防火墙已关闭。"}
      </p>

      <Divider />
    </div>
  );
};