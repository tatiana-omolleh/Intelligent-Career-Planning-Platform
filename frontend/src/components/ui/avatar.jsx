"use client";

import * as React from "react";
import * as ReactAvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "./utils";

function Avatar({
 className,
 ...props
}) {
 return (
  <ReactAvatarPrimitive.Root // [FIX] Changed from AvatarPrimitive
   data-slot="avatar"
   className={cn(
    "relative flex size-10 shrink-0 overflow-hidden rounded-full",
    className,
   )}
   {...props}
  />
 );
}

function AvatarImage({
 className,
 ...props
}) {
 return (
  <ReactAvatarPrimitive.Image // [FIX] Changed from AvatarPrimitive
   data-slot="avatar-image"
   className={cn("aspect-square size-full", className)}
   {...props}
  />
 );
}

function AvatarFallback({
 className,
 ...props
}) {
 return (
  <ReactAvatarPrimitive.Fallback // [FIX] Changed from AvatarPrimitive
   data-slot="avatar-fallback"
   className={cn(
    "bg-muted flex size-full items-center justify-center rounded-full",
    className,
   )}
   {...props}
  />
 );
}

export { Avatar, AvatarImage, AvatarFallback };