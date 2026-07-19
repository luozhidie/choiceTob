"use client";

import { InputHTMLAttributes } from "react";

interface ImeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
}

// 完全非受控输入框：输入过程中不触发父组件任何状态更新，彻底杜绝
// 中文/日文输入法卡顿、移动端（微信浏览器）光标丢失、文字乱码等问题。
// - 仅在失焦（onBlur）或桌面 IME 组合结束（onCompositionEnd）时提交给父组件。
// - key 绑定外部 value：当父组件被回填（如“选方案自动带出标题”）时重建输入框以回填新值。
export default function ImeInput({ value, onChange, ...props }: ImeInputProps) {
  const initial = value ?? "";
  return (
    <input
      {...props}
      key={initial}
      defaultValue={initial}
      onChange={() => {
        /* 不更新父状态，交给浏览器原生处理，避免重渲染打断输入 */
      }}
      onBlur={(e) => onChange(e.currentTarget.value)}
      onCompositionEnd={(e) => onChange(e.currentTarget.value)}
    />
  );
}
