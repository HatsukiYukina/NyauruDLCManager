import { useEffect, useState } from "react";
import { title } from "@/components/primitives";

//导入Wails绑定
import { IsUpdateMode } from "../../wailsjs/go/main/App";
import { LoadSettings } from "../../wailsjs/go/main/App"; //检测原生窗口
import {ThemeSwitch} from "@/components/theme-switch.tsx";
import {TitleBar} from "@/components/title-bar.tsx";
import {Settings} from "@/layouts/settings.tsx";
import { Update } from "@/layouts/update.tsx";
import {About} from "@/layouts/about.tsx";
import {Home} from "@/layouts/home.tsx";
import { FileManager } from "@/layouts/file";
import {Custom} from "@/layouts/custom.tsx";

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SettingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AboutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UpdateIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export const CatIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    fill="none"
    stroke="currentColor"
    strokeWidth="7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M114.67,70.19C112.71,44.22,94.44,26.3,64,26.3S15.25,45.33,13.45,71.31c-1.05,15.14,4.58,28.63,15.91,36.32c7.46,5.07,17.88,7.88,34.77,7.88c17.18,0,27.03-3.71,34.49-8.73C111.05,98.43,115.8,85.11,114.67,70.19z" stroke="currentColor" fill="none"/>
    <path d="M53.72,42.6C46.3,23.4,30.1,10.34,23.87,8.39c-2.35-0.74-5.3-0.81-6.63,1.35c-3.36,5.45-7.66,22.95,1.85,47.78" stroke="currentColor" fill="none"/>
    <path d="M79.9,29.22c8.08-12.41,19.38-20.75,24.07-22.24c2.32-0.74,5.02-0.62,6.34,1.55c3.32,5.45,6.13,22.24-0.42,45.75" stroke="currentColor" fill="none"/>
    <path d="M54.12,45.02c1.13,0.96,3.42,0.82,4.75-0.72c1.61-1.87,3.29-8.17,2.24-17.91c-4.67,0.17-9.09,0.84-13.21,1.97C51.23,33.82,52.03,43.24,54.12,45.02z" stroke="currentColor" fill="none"/>
    <path d="M96.09,66.37c-0.34,5.51-3.76,8.54-7.65,8.54s-7.04-3.88-7.04-8.66c0-4.78,3.28-8.71,7.65-8.47C94.12,58.07,96.37,61.87,96.09,66.37z" stroke="currentColor" fill="none"/>
    <path d="M73.88,45.02c-1.13,0.96-3.42,0.82-4.75-0.72c-1.61-1.87-3.29-8.17-2.24-17.91c4.67,0.17,9.09,0.84,13.21,1.97C76.77,33.82,75.97,43.24,73.88,45.02z" stroke="currentColor" fill="none"/>
    <path d="M46,65.81c0.78,5.61-1.58,9.03-5.49,9.82c-3.91,0.79-7.26-1.84-8.23-6.64c-0.98-4.81,0.9-9.32,5.34-9.97C42.77,58.27,45.36,61.22,46,65.81z" stroke="currentColor" fill="none"/>
    <path d="M55.67,77.75c-0.05-3.08,4.37-4.55,8.54-4.62c4.18-0.07,8.68,1.29,8.73,4.37c0.05,3.08-5.22,7.13-8.54,7.13C61.09,84.63,55.73,80.82,55.67,77.75z" stroke="currentColor" fill="none"/>
    <path d="M44.99,85.16c-2.57,1.67,0.47,5.54,2.25,6.85c1.78,1.31,4.98,2.92,9.67,2.44c5.54-0.56,7.13-4.69,7.13-4.69s1.97,4.6,8.82,4.79c6.95,0.19,9.1-3.57,10.04-4.69c0.94-1.13,1.88-4.04,0.28-5.16c-1.6-1.13-2.72,0.28-4.41,2.63c-1.69,2.35-5.16,3.66-8.54,2.06s-3.57-7.04-3.57-7.04l-4.79,0.28c0,0-0.75,4.69-2.91,6.19c-2.16,1.5-7.32,1.88-9.48-1.41C48.53,85.95,47.15,83.75,44.99,85.16z" stroke="currentColor" fill="none"/>
    <path d="M6.7,71.03c0.34,0.41,4.41,0.35,14.36,5.07 M2.9,82.86c0,0,6.42-2.24,17.46-0.28 M8.81,92.29c0,0,2.74-1.38,12.67-2.25" stroke="currentColor" fill="none" strokeLinecap="round"/>
    <path d="M120.87,67.51c0,0-3.41,0.33-13.94,6.34 M122.42,78.49c0,0-5.09-0.36-16.05,1.97 M120.45,89.05c0,0-4.83-1.71-14.78-2.25" stroke="currentColor" fill="none" strokeLinecap="round"/>
  </svg>
);

export default function IndexPage() {
  //左侧栏状态
  const [selectedMenu, setSelectedMenu] = useState('home'); // 'home', 'files', 'settings'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [useNativeWindow, setUseNativeWindow] = useState(false); //自实现窗口开关

  //检测是否为更新模式
  useEffect(() => {
    const checkUpdateMode = async () => {
      try {
        const mode = await IsUpdateMode();
        if (mode) {
          setSelectedMenu('update');
          //延迟一点时间确保页面加载完成再自动执行更新
          setTimeout(() => {
            //触发更新页面的自动更新
            window.dispatchEvent(new CustomEvent('auto-update'));
          }, 250);
        }
      } catch (error) {
        console.error(error);
      }
    };

    checkUpdateMode();
  }, []);

  //加载设置（目前为了关闭自实现窗口）
  useEffect(() => {
    const loadNativeWindowSetting = async () => {
      try {
        const settings = await LoadSettings();
        setUseNativeWindow(settings.nativeWindow);
      } catch (error) {
        console.error(error);
      }
    };
    loadNativeWindowSetting();
  }, []);

  //返回时间，给用户打招呼
  const getGreeting = () => {
    const hours = new Date().getHours();

    if (hours >= 0 && hours < 4) return { text: "午夜好" };
    if (hours >= 4 && hours < 5) return { text: "凌晨好"};
    if (hours >= 5 && hours < 10) return { text: "早上好"};
    if (hours >= 10 && hours < 12) return { text: "中午好"};
    if (hours >= 12 && hours < 17) return { text: "下午好"};
    if (hours >= 17 && hours < 19) return { text: "傍晚好"};
    return { text: "晚上好"};
  };
  const greeting = getGreeting();

  return (
    //flex布局容器
    <div className="flex h-screen overflow-hidden">
      {!useNativeWindow && <TitleBar title="" />}

      {/*左侧栏 */}
      <div className={`${isSidebarCollapsed ? 'w-16' : 'w-48'} border-r border-gray-200 dark:border-gray-800 flex flex-col ${useNativeWindow ? 'pt-0' : 'pt-10'} transition-all duration-300`}>  {/*折叠按钮*/}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-3 m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600"
        >
          <MenuIcon />
        </button>

        {/*菜单项*/}
        <div className="flex-1 space-y-1 p-2">
          {/*首页*/}
          <button
            onClick={() => setSelectedMenu('home')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              selectedMenu === 'home'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <HomeIcon />
            {!isSidebarCollapsed && <span className="text-sm">首页</span>}
          </button>

          {/*管理*/}
          <button
            onClick={() => setSelectedMenu('files')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              selectedMenu === 'files'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FileIcon />
            {!isSidebarCollapsed && <span className="text-sm">管理</span>}
          </button>

          {/*设置*/}
          <button
            onClick={() => setSelectedMenu('settings')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              selectedMenu === 'settings'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <SettingIcon />
            {!isSidebarCollapsed && <span className="text-sm">设置</span>}
          </button>

          {/*更新*/}
          <button
            onClick={() => setSelectedMenu('update')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              selectedMenu === 'update'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <UpdateIcon />
            {!isSidebarCollapsed && <span className="text-sm">更新</span>}
          </button>

          {/*关于*/}
          <button
            onClick={() => setSelectedMenu('about')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              selectedMenu === 'about'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <AboutIcon />
            {!isSidebarCollapsed && <span className="text-sm">关于</span>}
          </button>

          {/*定制*/}
          <button
            onClick={() => setSelectedMenu('cat')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              selectedMenu === 'cat'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <CatIcon />
            {!isSidebarCollapsed && <span className="text-sm">定制</span>}
          </button>
        </div>
      </div>

      <section className="flex-1 overflow-auto">
        <div className={`flex flex-col gap-4 ${useNativeWindow ? 'py-8' : 'py-8 md:py-10'}`}>
          {/*首页*/}
          {selectedMenu === 'home' && (
            <div className="px-8 py-4 max-w-3xl">
              <span className={title()}>{greeting.text}</span><ThemeSwitch/>
                <Home />
            </div>
          )}

          {/*管理页面*/}
          {selectedMenu === 'files' && (
            <div className="items-center justify-center h-full min-h-[500px] px-4">
              <FileManager />
            </div>
          )}

          {/*设置页面*/}
          {selectedMenu === 'settings' && (
            <div className="items-center justify-center h-full min-h-[500px] px-4">
              <Settings></Settings>
            </div>
          )}

          {/*更新页面*/}
          {selectedMenu === 'update' && (
            <div className="px-8 py-4 max-w-3xl">
              <Update />
            </div>
          )}

          {/*关于页面*/}
          {selectedMenu === 'about' && (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] px-8">
              <About />
            </div>
          )}

          {/*定制*/}
          {selectedMenu === 'cat' && (
            <div className="px-8 py-4 max-w-3xl">
              <span className={title()}>{greeting.text}</span><ThemeSwitch/>
              <Custom />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}