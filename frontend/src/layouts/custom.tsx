import React from "react";
import { Link } from "@heroui/link";
import {LatencyTest} from "@/components/latencytest.tsx";

interface CustomPageProps {
  className?: string;
  greeting?: string;
}

export const Custom: React.FC<CustomPageProps> = ({
                                                className = "",
                                              }) => {
  return (
    <div className={`space-y-6 max-w-3xl mx-auto ${className}`}>

      {/*项目介绍*/}
      <h2 className="text-xl font-semibold">关于本项目</h2>
      <p className="text-default-600">
        这里是胡言乱语
      </p>
      <h2 className="text-xl font-semibold">快速链接</h2>

      <div className="space-y-2">
        {/*链接*/}
        <div className="flex items-center gap-3 p-2 hover:bg-default-100 rounded-lg transition-colors">
          <span className="flex-1">皮肤站</span>
          <Link
            href="https://skin.nyauru.cn/"
            isExternal
            showAnchorIcon
            className="text-primary-500"
          >
          </Link>
        </div>

        {/*链接2*/}
        <div className="flex items-center gap-3 p-2 hover:bg-default-100 rounded-lg transition-colors">
          <span className="flex-1">官网</span>
          <Link
            href="https://www.nyauru.cn/"
            isExternal
            showAnchorIcon
            className="text-primary-500"
          >
          </Link>
        </div>
      </div>
      <LatencyTest />

    </div>
  );
};