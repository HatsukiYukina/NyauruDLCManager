import React, { useEffect, useState, useRef } from "react";
import { Button } from "@heroui/button";

//导入Wails运行时事件
import { EventsOn, EventsOff } from "../../wailsjs/runtime";

//导入Wails绑定
import {
  PerformUpdate,
  GetUpdateURL
} from "../../wailsjs/go/main/App";
import {Chip} from "@heroui/chip";

interface UpdatePageProps {
  className?: string;
}

export const Update: React.FC<UpdatePageProps> = ({ }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [updateUrl, setUpdateUrl] = useState<string>("");

  const [updateStatus, setUpdateStatus] = useState<"idle" | "success" | "error">("idle");
  const [countdown, setCountdown] = useState<number | null>(null);

  //日志容器引用用于自动滚动
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUpdateUrl();
  }, []);

  const loadUpdateUrl = async () => {
    try {
      const url = await GetUpdateURL();
      setUpdateUrl(url);
    } catch (error) {
      console.error( error);
    }
  };

  //监听自动更新事件
  useEffect(() => {
    const handleAutoUpdate = () => {
      handleUpdate();
    };

    window.addEventListener('auto-update', handleAutoUpdate);

    return () => {
      window.removeEventListener('auto-update', handleAutoUpdate);
    };
  }, []);

  //监听后端日志事件
  useEffect(() => {
    //注册事件监听
    EventsOn("update-log", (data: string) => {
      setLogs(prev => [...prev, data]);
    });

    //组件卸载时移除监听
    return () => {
      EventsOff("update-log");
    };
  }, []);

  //自动滚动到底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    //监听更新结果
    EventsOn("update-result", (result: { success: boolean; message: string }) => {
      if (result.success) {
        setStatus("success");
        //更新状态变量
        setUpdateStatus("success");
        setIsUpdating(false);
      } else {
        setStatus("error");
        //更新状态变量
        setUpdateStatus("error");
        setIsUpdating(false);
      }
    });

    return () => {
      EventsOff("update-result");
    };
  }, []);

  //监听日志中的退出提示
  useEffect(() => {
    if (updateStatus === "success") {
      const lastLogs = logs.slice(-3).join(' ');
      if (lastLogs.includes("检测到更新成功")) {
        setCountdown(5);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(timer);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  }, [logs, updateStatus]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setStatus("idle");
    //重置状态变量
    setUpdateStatus("idle");
    setCountdown(null);
    setLogs([]);

    try {
      await PerformUpdate();
      //更新结果会通过事件返回，不在这里等待
    } catch (error) {
      setIsUpdating(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setStatus("idle");
    setUpdateStatus("idle");
    setCountdown(null);
  };

  return (
    <div className={`space-y-4 max-w-2xl mx-auto`}>
      {/*按钮组*/}
      <div className="flex gap-2 justify-start pt-4 border-default-200">
        <Button
          size="sm"
          color="primary"
          onPress={handleUpdate}
          isLoading={isUpdating}
        >
          {isUpdating ? "更新中..." : "更新"}
        </Button>
        <Button
          size="sm"
          color="default"
          variant="flat"
          onPress={clearLogs}
          isDisabled={isUpdating}
        >
          清空日志
        </Button>
        <div className="flex items-center gap-2 mb-2">
          {updateStatus === "idle" && !isUpdating && (
            <Chip size="sm" variant="flat">等待中</Chip>
          )}
          {updateStatus === "success" && (
            <Chip size="sm" color="success" variant="flat">更新成功</Chip>
          )}
          {updateStatus === "error" && (
            <Chip size="sm" color="danger" variant="flat">更新失败</Chip>
          )}
          {isUpdating && (
            <Chip size="sm" color="primary" variant="flat">更新中...</Chip>
          )}
          {countdown !== null && (
            <Chip size="sm" color="warning" variant="flat">
              将在 {countdown} 秒后退出
            </Chip>
          )}
        </div>
      </div>

      {/*日志区域*/}
      <div
        ref={logContainerRef}
        className="rounded-lg p-3 h-60 overflow-y-auto text-sm whitespace-pre-wrap"
      >
        {logs.length === 0 ? (
          <p className="text-default-400 text-center py-4"></p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1 hover:bg-default-100 p-1 rounded">
              {log}
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-default-400">注意: 更新过程中请勿切换标签页或关闭软件</p>
      <p className="text-xs text-default-400">更新清单url:{updateUrl}</p>
    </div>
  );
};