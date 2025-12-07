import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <img 
      src="/for-in-share-logo.svg" 
      alt="ForInShare Logo" 
      className={cn("object-contain", className)}
      {...props}
    />
  );
}
