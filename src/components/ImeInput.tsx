"use client";

import { useState, useEffect, useRef, InputHTMLAttributes } from "react";

interface ImeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
}

// 非受控输入框：DOM 自身持有文本，避免父组件重渲染打断输入法合成。
// - 仅在「非输入法组合中」或「组合结束 / 失焦」时把值回传给父组件。
// - 桌面直接打字、手机中文拼音均可用，不留光标/乱码问题。
export default function ImeInput({ value, onChange, ...props }: ImeInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [composing, setComposing] = useState(false);

  // 外部回填（如选方案带出标题、初始化）时同步到 DOM，但不打断正在进行的输入
  useEffect(() => {
    const el = ref.current;
    if (el && !composing && el.value !== (value ?? "")) {
      el.value = value ?? "";
    }
  }, [value, composing]);

  return (
    <input
      {...props}
      ref={ref}
      defaultValue={value ?? ""}
      onChange={(e) => {
        if (!composing) onChange(e.target.value);
      }}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={(e) => {
        setComposing(false);
        onChange((e.target as HTMLInputElement).value);
      }}
      onBlur={(e) => onChange(e.target.value)}
    />
  );
}
