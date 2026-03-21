import React from "react";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";

const GithubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const WebIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

interface AboutPageProps {
  className?: string;
}

export const About: React.FC<AboutPageProps> = ({ className = "" }) => {
  // 应用信息
  const appInfo = {
    name: "NyauruDLCManager",
    version: "0.1.0a",
    managerVersion: "1.2.4-Go.Ver",
    description: "整合包内容管理与更新工具",
    author: "烟花",
    website: "https://www.nyauru.cn",
    github: "https://github.com/HatsukiYukina/NyauruDLCManager",
    email: "2272353474@qq.com",
    copyright: `© 2024-${new Date().getFullYear()} 烟花. All rights reserved.`,
    license: "MIT License",
    credits: [
      "Wails - Go桌面应用框架",
      "HeroUI - React组件库",
      "NapCat - 提供灵感的小猫"
    ]
  };

  return (
    <div className={`space-y-6 max-w-3xl mx-auto ${className}`}>
      <div className="flex flex-col items-left text-left">
        <h1 className="text-3xl font-bold">{appInfo.name}</h1>
        <p className="text-default-500 mt-2">{appInfo.description}</p>
        <Chip color="primary" variant="flat" className="mt-2">
          版本 {appInfo.version}
        </Chip>
      </div>

      {/*关于信息*/}
          <h2 className="text-xl font-semibold">关于本应用</h2>
          <p className="text-default-600">
            反正就是一个整合包内容管理工具，顺便带个好看点的更新器，懒得写介绍，就这样 散会
          </p>
          <Divider />
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-default-500">许可证</span>
              <span className="font-medium">{appInfo.license}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-500">版本</span>
              <span className="font-medium">{appInfo.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-500">更新器协议版本</span>
              <span className="font-medium">{appInfo.managerVersion}</span>
            </div>
          </div>



      {/**/}
      <h2 className="text-xl font-semibold">联系方式</h2>
          <div className="flex items-center gap-3 p-2 hover:bg-default-100 rounded-lg transition-colors">
            <WebIcon />
            <span className="flex-1">服务器网站</span>
            <Link href={appInfo.website} isExternal showAnchorIcon className="text-primary-500">
              {appInfo.website}
            </Link>
          </div>

          <div className="flex items-center gap-3 p-2 hover:bg-default-100 rounded-lg transition-colors">
            <GithubIcon />
            <span className="flex-1">GitHub</span>
            <Link href={appInfo.github} isExternal showAnchorIcon className="text-primary-500">
              {appInfo.github}
            </Link>
          </div>

          <div className="flex items-center gap-3 p-2 hover:bg-default-100 rounded-lg transition-colors">
            <MailIcon />
            <span className="flex-1">电子邮箱</span>
            {/*<Link href={`mailto:${appInfo.email}`} isExternal className="text-primary-500">*/}
            {/*是的宝贝们我就是要启动原神！原神，起洞！*/}
            {/*不想启动原神就换注释掉的那一行*/}
            {appInfo.email}
            <Link href="https://ys.mihoyo.com/cloud/#/"isExternal className="text-primary-500">
            </Link>
          </div>

      {/**/}
          <h2 className="text-xl font-semibold">致谢</h2>
          <ul className="space-y-2">
            {appInfo.credits.map((credit, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span className="text-default-600">{credit}</span>
              </li>
            ))}
          </ul>

      {/* 版权信息 */}
      <div className="text-center text-sm text-default-400 pt-4 border-t border-default-200">
        <p className="mt-1">
          {appInfo.copyright}
        </p>
      </div>
    </div>
  );
};