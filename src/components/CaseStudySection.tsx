import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface CaseStudySectionProps {
  title: string;
  subtitle: string;
  description: string;
  cases: { title: string; desc: string; emoji: string; color: string }[];
  onViewDetail: () => void;
}

export function CaseStudySection({
  title,
  subtitle,
  description,
  cases,
  onViewDetail,
}: CaseStudySectionProps) {
  return (
    <section className="py-16 lg:py-24 bg-muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <span className="text-accent font-semibold text-sm tracking-widest uppercase">
            {subtitle}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
            {title}
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: i * 0.1 }}
              onClick={onViewDetail}
              className="group cursor-pointer"
            >
              <div
                className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow overflow-hidden relative`}
              >
                <div className="text-6xl opacity-40">{c.emoji}</div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    查看详情
                  </span>
                </div>
              </div>
              <h4 className="font-semibold text-primary">{c.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <button
            onClick={onViewDetail}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            查看完整数据与深度分析
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
