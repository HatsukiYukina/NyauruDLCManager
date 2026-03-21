import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

import { RadioGroup, Radio } from "@heroui/radio";

//导入 Wails绑定
import {
  LoadSettings,
  SaveSettings,
  RestartApp,
} from "../../wailsjs/go/main/App";

//Wails的模型类型
import { config } from "../../wailsjs/go/models";


//主题切换按钮组件
import { ThemeSwitch } from "@/components/theme-switch";
import {Input} from "@heroui/input";

//Wails生成Settings类型
type Settings = config.Settings;

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  //重启相关状态
  const [restartModalOpen, setRestartModalOpen] = useState(false);
  const [oldNativeWindow, setOldNativeWindow] = useState(false);

  //加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await LoadSettings();
      setSettings(data);
      setOldNativeWindow(data.nativeWindow);
    } catch (error) {
      setMessage(String(error));
    } finally {
      setLoading(false);
    }
  };

  //保存设置
  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await SaveSettings(settings);
      if (settings.nativeWindow !== oldNativeWindow) { //询问是否重启，因已修改原生窗口配置，需要重启
        //延迟一点显示重启确认框
        setTimeout(() => {
          setRestartModalOpen(true);
        }, 10); //ms
      }
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(String(error));
    } finally {
      setSaving(false);
    }
  };
  //重启应用
  const handleRestart = async () => {
    setRestartModalOpen(false);
    try {
      await RestartApp();
    } catch (error) {
      setMessage(String(error));
    }
  };

  //更新设置字段
  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (!settings) {
    return (
      <div className="text-center p-8">
        <p className="text-danger">加载设置失败</p>
        <Button color="primary" onPress={loadSettings} className="mt-4">
          重试
        </Button>
      </div>
    );
  }

  // @ts-ignore
  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/*外观设置*/}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-3">外观设置</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">主题模式</p>
              <p className="text-xs text-default-400">切换亮色/暗色主题</p>
            </div>
            <ThemeSwitch />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">原生窗口</p>
              <p className="text-xs text-default-400">启用相应平台的原生窗口管理器样式，需重启生效</p>
            </div>
            <Switch
              size="sm"
              isSelected={settings.nativeWindow}
              onValueChange={(v) => updateSetting("nativeWindow", v)}
            />
          </div>

        </div>
      </div>

      {/* 语言设置 */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-3">语言设置</h3>
        <div className="space-y-2">
          <Select
            label="界面语言"
            selectedKeys={[settings.language]}
            onChange={(e) => updateSetting("language", e.target.value)}
            size="sm"
            variant="bordered"
          >
            <SelectItem key="zh-CN">简体中文</SelectItem>
            <SelectItem key="en-US">English(un available yet)</SelectItem>
            <SelectItem key="zh-TW">繁體中文(un available yet)</SelectItem>
            <SelectItem key="ja-JP">日本語(un available yet)</SelectItem>
          </Select>
          <p className="text-xs text-default-400">
            选择界面显示语言
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-base font-semibold mb-3">其他设置</h3>
        <div className="space-y-4">
          {/* 检查更新开关 */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">检查更新</p>
              <p className="text-xs text-default-400">启动时自动检查新版本</p>
            </div>
            <Switch
              size="sm"
              isSelected={settings.checkUpdates}
              onValueChange={(v) => updateSetting("checkUpdates", v)}
            />
          </div>

          {/*更新URL*/}
          <div className="space-y-2">
            <div>
              <p className="font-medium">更新清单url</p>
              <p className="text-xs text-default-400">设置更新清单的下载地址</p>
            </div>
            <Input
              variant="bordered"
              placeholder="https://example.com/update.json"
              value={settings.updateUrl || ""}
              onValueChange={(v) => updateSetting("updateUrl", v)}
              size="sm"
            />
          </div>

          <div className="space-y-2">
            <div>
              <p className="font-medium">更新清单url</p>
              <p className="text-xs text-default-400">设置更新清单的下载地址</p>
            </div>
            <Input
              variant="bordered"
              placeholder="https://example.com/update.json"
              value={settings.updateUrl || ""}
              onValueChange={(v) => updateSetting("updateUrl", v)}
              size="sm"
            />
          </div>

          <div className="space-y-2">
            <div>
              <p className="font-medium">延迟检测url</p>
              <p className="text-xs text-default-400">设置延迟检测的地址清单拉取地址</p>
            </div>
            <Input
              variant="bordered"
              placeholder="https://example.com/address.json"
              value={settings.addressUrl || ""}
              onValueChange={(v) => updateSetting("addressUrl", v)}
              size="sm"
            />
          </div>

          <div className="space-y-2">
            <div>
              <p className="font-medium">延迟检测循环次数</p>
              <p className="text-xs text-default-400">选择循环次数，最终显示延迟将为平均值</p>
            </div>
            <RadioGroup
              value={String(settings.latencyTestCount || 1)}
              onValueChange={(value) => updateSetting("latencyTestCount", parseInt(value))}
              orientation="horizontal"
              className="gap-4"
            >
              <Radio value="1">1次</Radio>
              <Radio value="2">2次</Radio>
              <Radio value="3">3次</Radio>
              <Radio value="5">5次</Radio>
              <Radio value="10">10次</Radio>
            </RadioGroup>
          </div>
        </div>
      </div>



      {/* 消息提示 */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes("成功")
            ? "bg-success-50 text-success-700"
            : "bg-danger-50 text-danger-700"
        }`}>
          {message}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2 justify-end pt-4 border-default-200">
        <Button
          size="sm"
          color="primary"
          onPress={handleSave}
          isLoading={saving}
        >
          保存设置
        </Button>
      </div>
      <Modal
        isOpen={restartModalOpen}
        onClose={() => setRestartModalOpen(false)}
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                需要重启应用
              </ModalHeader>
              <ModalBody>
                <p>
                  部分设置已更改，需要重启应用才能生效
                </p>
                <p className="text-sm text-default-400">
                  是否立即重启？
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                >
                  稍后重启
                </Button>
                <Button
                  color="primary"
                  onPress={handleRestart}
                >
                  立即重启
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};
