import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "智能预算分析",
    description: "AI 自动分析校园消费模式，生成个性化预算建议与省钱策略。",
  },
  {
    title: "实时财务洞察",
    description: "可视化仪表盘追踪支出、奖学金与兼职收入，一目了然。",
  },
  {
    title: "安全合规",
    description: "基于 Supabase 的企业级认证与数据加密，保护你的财务隐私。",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="container mx-auto flex flex-col items-center gap-8 px-4 py-24 text-center">
        <div className="flex max-w-3xl flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            校园财务，AI 帮你搞定
          </h1>
          <p className="text-lg text-muted-foreground">
            CampusFin AI 是面向大学生的智能财务管理平台，帮你规划预算、追踪支出、做出更明智的财务决策。
          </p>
        </div>
        <div className="flex gap-4">
          <Button size="lg" render={<Link href="/signup" />}>
            免费注册
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/login" />}>
            登录
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
