import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

const SectionHeading = ({ badge, title, subtitle }: SectionHeadingProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="text-center mb-16"
  >
    {badge && (
      <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary bg-primary/5 mb-4">
        {badge}
      </span>
    )}
    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{title}</h2>
    {subtitle && (
      <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
    )}
  </motion.div>
);

export default SectionHeading;
