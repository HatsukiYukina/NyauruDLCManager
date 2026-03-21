import React from "react";
import {SystemInfo} from "@/components/systeminfo.tsx";
import {IPv6Status} from "@/components/ipv6test.tsx";
import {STUNStatus} from "@/components/nattest.tsx";

interface HomePageProps {
  className?: string;
  greeting?: string;
}

export const Home: React.FC<HomePageProps> = ({
                                                className = "",
                                              }) => {
  return (
    <div className={`space-y-6 max-w-3xl mx-auto ${className}`}>

      <SystemInfo />
      <IPv6Status />
      <STUNStatus />

    </div>
  );
};