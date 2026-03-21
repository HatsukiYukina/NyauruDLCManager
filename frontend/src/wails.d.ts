declare interface Window {
    runtime: { //虽然查不到用法但是别动！！！！！！！！！！！！！！！！！！
        //别动！！！！！！！！！！！！！！！！！！！！！！！！！
        //窗口控制要靠这些！！！！！！！！！！！！！！！！！！！！！！！！！！！！！

        // 窗口控制
        WindowReload: () => void;
        WindowSetTitle: (title: string) => void;
        WindowFullscreen: () => void;
        WindowUnfullscreen: () => void;
        WindowIsFullscreen: () => Promise<boolean>;
        WindowCenter: () => void;
        WindowToggleMaximise: () => void;
        WindowMaximise: () => void;
        WindowUnmaximise: () => void;
        WindowIsMaximised: () => Promise<boolean>;
        WindowMinimise: () => void;
        WindowUnminimise: () => void;
        WindowSetSize: (width: number, height: number) => void;
        WindowGetSize: () => Promise<{ w: number; h: number }>;
        WindowSetPosition: (x: number, y: number) => void;
        WindowGetPosition: () => Promise<{ x: number; y: number }>;

        // 应用控制
        Quit: () => void;
        Hide: () => void;
        Show: () => void;

        // 事件系统
        EventsOn: (eventName: string, callback: (...args: any[]) => void) => void;
        EventsOff: (eventName: string, additionalEventNames?: string[]) => void;
        EventsOnce: (eventName: string, callback: (...args: any[]) => void) => void;
        EventsEmit: (eventName: string, ...args: any[]) => void;

        // 其他运行时方法
        Log: (message: string) => void;
        LogDebug: (message: string) => void;
        LogInfo: (message: string) => void;
        LogWarning: (message: string) => void;
        LogError: (message: string) => void;

        // 环境信息
        Environment: () => Promise<{
            platform: string;
            arch: string;
        }>;
    };
}