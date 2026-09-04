import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Globe, Cpu, Wrench, Zap, DollarSign, Headphones, ArrowRight, Quote, Star } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { Spotlight } from "@/components/ui/spotlight";
import { Card } from "@/components/ui/card";

const services = [
  { icon: Globe, title: "Web Design", desc: "Modern, responsive websites for businesses and portfolios.", color: "primary" },
  { icon: Cpu, title: "IoT Projects", desc: "Arduino, ESP32, and smart systems for college projects.", color: "secondary" },
  { icon: Wrench, title: "Tech Support", desc: "Debugging, maintenance, and technical documentation.", color: "primary" },
];

const whyUs = [
  { icon: Zap, title: "Fast Delivery", desc: "Quick turnaround without compromising quality." },
  { icon: DollarSign, title: "Affordable Pricing", desc: "Student-friendly rates for every budget." },
  { icon: Headphones, title: "Expert Support", desc: "Dedicated help from experienced developers." },
];

const projects = [
  {
    title: "Li-Fi Data Transfer System",
    category: "IoT",
    desc: "Wireless communication system using light signals for data transmission.",
    image: "/projects/lifi.png",
  },
  {
    title: "Fingerprint Voting System",
    category: "IoT",
    desc: "Secure biometric voting system to prevent fraud and duplication.",
    image: "/projects/fingerprint.png",
  },
  {
    title: "Smart Glass for the Blind",
    category: "IoT",
    desc: "Assistive smart glasses using ultrasonic sensors for obstacle detection.",
    image: "/projects/smartglass.png",
  },
  {
    title: "Quiz Website for Events",
    category: "Web Design",
    desc: "Interactive quiz platform for events with real-time results.",
    image: "/projects/quiz.png",
  },
];

const testimonials = [
  { name: "Rahul Sharma", role: "B.Tech Student", text: "TechDudes helped me build my final year IoT project in just 2 weeks. Amazing quality!", rating: 5 },
  { name: "Priya Patel", role: "Small Business Owner", text: "Our new website brought in 3x more customers. Professional and affordable!", rating: 5 },
  { name: "Amit Kumar", role: "Startup Founder", text: "Best tech partner for early-stage startups. Fast, reliable, and innovative.", rating: 5 },
];

const HeroBackground = () => (
  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-glow-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: "1s" }} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
    {/* Grid */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  </div>
);

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero with animated background */}
      <section className="relative min-h-screen flex items-start justify-center pt-32 overflow-hidden px-4">
        <HeroBackground />
        <Card className="relative z-10 w-full max-w-7xl mx-auto min-h-[600px] bg-card/50 border-glass-border overflow-hidden">
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="hsl(var(--primary) / 0.5)" />
          <div className="flex min-h-[600px] items-center justify-center">
  <div className="w-full max-w-4xl p-8 md:p-16 text-center relative z-10">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-foreground">
        Innovating{" "}
        <span className="gradient-text">Web & IoT</span>
        <br />
        Solutions for the Future
      </h1>

      <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
        We build modern websites and smart IoT projects for students and businesses.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
  to="/contact"
  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-4 text-base font-semibold text-black transition hover:bg-cyan-300"
>
  <span>Get Started</span>
  <ArrowRight size={18} />
</Link>

        <Link to="/projects" className="neon-btn-outline text-base">
          View Projects
        </Link>
      </div>
    </motion.div>
  </div>
</div>
        </Card>
      </section>

      {/* Services */}
      <section className="section-padding gradient-bg">
        <div className="container mx-auto px-4">
          <SectionHeading badge="What We Do" title="Our Services" subtitle="From stunning websites to smart IoT systems, we've got you covered." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${s.color === "primary" ? "bg-primary/20 text-primary" : "bg-secondary/10 text-secondary"}`}>
                  <s.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <SectionHeading badge="Why Us" title="Why Choose TechDudes" subtitle="We deliver quality, speed, and affordability." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whyUs.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center p-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
                  <item.icon size={28} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="section-padding gradient-bg">
        <div className="container mx-auto px-4">
          <SectionHeading badge="Portfolio" title="Featured Projects" subtitle="A showcase of our recent work." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card group"
              >
                <div className="h-40 rounded-xl mb-4 overflow-hidden group">
  <img
    src={p.image}
    alt={p.title}
    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
  />
</div>
                <span className="text-xs font-medium text-primary">{p.category}</span>
                <h3 className="text-lg font-semibold text-foreground mt-1 mb-2">{p.title}</h3>
                <p className="text-muted-foreground text-sm">{p.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/projects" className="neon-btn-outline">
              View All Projects <ArrowRight className="inline ml-2" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <SectionHeading badge="Reviews" title="What Our Clients Say" subtitle="Trusted by students and businesses alike." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card"
              >
                <Quote size={24} className="text-primary/30 mb-4" />
                <p className="text-foreground/80 text-sm mb-4 leading-relaxed">{t.text}</p>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="fill-primary text-primary" />
                  ))}
                </div>
                <p className="font-semibold text-foreground text-sm">{t.name}</p>
                <p className="text-muted-foreground text-xs">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card text-center py-16 px-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Build Something <span className="gradient-text">Amazing</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Let's turn your ideas into reality. Get in touch with us today.
            </p>
            <Link
  to="/contact"
  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-4 text-base font-semibold text-black transition hover:bg-cyan-300"
>
  <span>Start Your Project</span>
  <ArrowRight size={18} />
</Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
