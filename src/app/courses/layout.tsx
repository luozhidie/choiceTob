import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "线上课程 & 工具商城 | 骆芷蝶智选",
  description: "专业色彩形象课程 + 色彩工具、书籍资料、专业工具一站式购齐，提升穿搭品味与选品能力。",
  openGraph: {
    title: "线上课程 & 工具商城 | 骆芷蝶智选",
    description: "色彩课程、搭配工具、专业资料一站式购齐",
    url: "https://colour-choice.art/courses",
  },
};
export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
