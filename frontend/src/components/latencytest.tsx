import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";

//导入Wails绑定
import { TestTCPLatency, FetchAddressList, LoadSettings } from "../../wailsjs/go/main/App";
import {Spinner} from "@heroui/spinner";

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

//地址接口
interface TCPAddress {
  host: string;
  port: number;
  display: string;
}

//延迟结果接口
interface LatencyResult {
  address: string;
  host: string;
  port: number;
  latency: number;
  timestamp: number;
  error?: string;
}

//延迟测试组件
interface LatencyTestProps {
  className?: string;
}

export const LatencyTest: React.FC<LatencyTestProps> = ({ className = "" }) => {
  const [addresses, setAddresses] = useState<TCPAddress[]>([]);
  const [results, setResults] = useState<LatencyResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortBy] = useState<"address" | "latency">("latency");
  const [filterText] = useState("");
  const [testCount, setTestCount] = useState(1); //测试次数

  const [addressListUrl, setAddressListUrl] = useState("https://www.example.com/address.json");

  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const settings = await LoadSettings();
      if (settings.addressUrl) {
        setAddressListUrl(settings.addressUrl);
      }
      if (settings.latencyTestCount && settings.latencyTestCount > 0) {
        setTestCount(settings.latencyTestCount);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    setLoadError(null);
    try {
      const jsonStr = await FetchAddressList(addressListUrl);
      console.log(jsonStr);
      const data = JSON.parse(jsonStr);
      console.log(data);

      if (data && data.addresses && Array.isArray(data.addresses)) {
        setAddresses(data.addresses);
      } else if (Array.isArray(data)) {
        //如果直接返回数组
        setAddresses(data);
      } else {
        console.error("data error:", data);
      }
    } catch (error) {
      setLoadError(String(error));
      console.error(error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  //获取后自动测试
  useEffect(() => {
    if (addressListUrl) {
      loadAddresses();
    }
  }, [addressListUrl]);

  useEffect(() => {
    if (!loadingAddresses && addresses.length > 0 && !testing && results.length === 0) {
      testAllAddresses();
    }
  }, [loadingAddresses, addresses]);

  //测试单个地址的延迟
  const testSingleAddress = async (address: TCPAddress): Promise<LatencyResult> => {
    const addrStr = `${address.host}:${address.port}`;

    try {
      const result = await TestTCPLatency(address.host, address.port, testCount);
      return {
        address: addrStr,
        host: address.host,
        port: address.port,
        latency: result,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        address: addrStr,
        host: address.host,
        port: address.port,
        latency: -1,
        timestamp: Date.now(),
        error: String(error)
      };
    }
  };

  //测试所有地址
  const testAllAddresses = async () => {
    setTesting(true);
    setResults([]);
    setProgress(0);

    const newResults: LatencyResult[] = [];

    for (let i = 0; i < addresses.length; i++) {
      setCurrentIndex(i + 1);
      const result = await testSingleAddress(addresses[i]);
      newResults.push(result);
      setResults([...newResults]);
      setProgress(Math.round(((i + 1) / addresses.length) * 100));
    }

    setTesting(false);
    setCurrentIndex(0);
  };

  //获取延迟颜色
  const getLatencyColor = (latency: number) => {
    if (latency === -1) return "danger";
    if (latency < 50) return "success";
    if (latency < 100) return "primary";
    if (latency < 200) return "warning";
    return "danger";
  };

  //获取延迟文本
  const getLatencyText = (latency: number) => {
    if (latency === -1) return "Time out/Failed";
    return `${latency} ms`;
  };

  //排序和过滤结果
  const getFilteredAndSortedResults = () => {
    let filtered = results;

    if (filterText) {
      filtered = results.filter(r =>
        r.address.toLowerCase().includes(filterText.toLowerCase()) ||
        r.host.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === "address") {
        return a.address.localeCompare(b.address);
      } else {
        if (a.latency === -1 && b.latency === -1) return 0;
        if (a.latency === -1) return 1;
        if (b.latency === -1) return -1;
        return a.latency - b.latency;
      }
    });
  };

  if (loadingAddresses) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex justify-center items-center py-8">
          <Spinner label="服务器延迟测试正在加载地址列表" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <p className="text-danger-500 mb-2">服务器延迟测试加载地址列表失败</p>
          <p className="text-xs text-default-400 mb-4">{loadError}</p>
          <Button color="primary" onPress={loadAddresses}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/*标题*/}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">服务器延迟测试</h2>
          <Button
            size="sm"
            variant="light"
            onPress={testAllAddresses}
            isLoading={testing}
            startContent={!testing && <RefreshIcon />}
          >
            {testing ? "测试中..." : "重新测试"}
          </Button>
          <div className="text-xs text-default-400 text-right">
            测试将循环{testCount}次并取平均值
          </div>
        </div>
      </div>

      <Divider />

      {/* 进度条 */}
      {testing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>({currentIndex}/{addresses.length})</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} color="primary" className="h-2" />
        </div>
      )}

      {/*地址列表和结果*/}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {getFilteredAndSortedResults().map((result) => (
          <div key={result.address} className="w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{result.address}{addresses.find(a => a.host === result.host)?.display || "Unknown"}</p>
              </div>
              <div className="flex items-center gap-3">
                <Chip
                  size="sm"
                  color={getLatencyColor(result.latency)}
                  variant="flat"
                  className="min-w-16 text-center"
                >
                  {getLatencyText(result.latency)}
                </Chip>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Divider />
    </div>
  );
};