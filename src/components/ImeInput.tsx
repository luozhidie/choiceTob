"use client";

import { useEffect, useState, InputHTMLAttributes } from "react";

interface ImeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

// 解决 React 受控输入框在中文/日文等 IME 输入法下每按一次键就触发父组件刷新，
// 导致 IME 组合中断、打字困难/乱码的问题。
export default function ImeInput({ value, onChange, ...props }: ImeInputProps) {
  const [internalValue, setInternalValue] = useState(value);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <input
      {...props}
      value={internalValue}
      onChange={(e) => {
        setInternalValue(e.target.value);
        if (!composing) {
          onChange(e.target.value);
        }
      }}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={(e) => {
        setComposing(false);
        onChange(e.currentTarget.value);
      }}
    />
  );
}
