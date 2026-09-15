import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Wrench,
  Check,
  ArrowRight,
  ShoppingCart,
  Briefcase,
  Layout,
  Wifi,
  CircuitBoard,
  FileText,
  Bug,
  BookOpen,
  GraduationCap,
  CalendarDays,
  Award,
  ClipboardCheck,
  Laptop,
  Users,
} from "lucide-react";

import SectionHeading from "@/components/SectionHeading";

const webServices = [
  {
    icon: Briefcase,
    title: "Business Websites",
    desc: "Professional sites that build credibility and drive customers.",
  },
  {
    icon: ShoppingCart,
    title: "E-Commerce",
    desc: "Online stores with payment gateways and inventory management.",
  },
  {
    icon: Layout,
    title: "Portfolio Sites",
    desc: "Stunning personal portfolios to showcase your work.",
  },
];

const iotServices = [
  {
    icon: CircuitBoard,
    title: "Arduino Projects",
    desc: "Custom Arduino-based solutions for college and hobby projects.",
  },
  {
    icon: Wifi,
    title: "ESP32 Solutions",
    desc: "WiFi-enabled IoT devices with cloud connectivity.",
  },
  {
    icon: FileText,
    title: "Final Year Projects",
    desc: "Complete IoT projects with documentation and presentations.",
  },
];

const supportServices = [
  {
    icon: Wrench,
    title: "Maintenance",
    desc: "Regular updates, backups, and performance optimization.",
  },
  {
    icon: Bug,
    title: "Debugging",
    desc: "Quick identification and resolution of technical issues.",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    desc: "Technical docs, user guides, and project reports.",
  },
];

const internshipFeatures = [
  {
    icon: CalendarDays,
    title: "Flexible Duration",
    desc: "Choose your internship start and end dates before beginning.",
  },
  {
    icon: Laptop,
    title: "Online Learning",
    desc: "Access your internship modules and learning materials online.",
  },
  {
    icon: ClipboardCheck,
    title: "Final Assessment",
    desc: "Complete the learning modules and pass all quizzes.",
  },
  {
    icon: Award,
    title: "Internship Certificate",
    desc: "Receive a verified certificate after completing all requirements.",
  },
];

const internshipBenefits = [
  "Structured technical learning modules",
  "Learn at your own pace during the selected internship period",
  "Final assessment to evaluate your knowledge",
  "Verified internship certificate",
  "Certificate verification through a unique verification link",
  "Suitable for students and beginners",
];

const ServicesPage = () => {
  return (
    <div className="min-h-screen pt-24">

      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="section-padding gradient-bg">
        <div className="container mx-auto px-4 text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Our{" "}
              <span className="gradient-text">
                Services
              </span>
            </h1>

            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tech solutions, project support, and practical
              learning opportunities tailored for students and businesses.
            </p>
          </motion.div>

        </div>
      </section>


      {/* =========================================================
          WEB DESIGN
      ========================================================== */}
      <section className="section-padding">

        <div className="container mx-auto px-4">

          <SectionHeading
            badge="Web Design"
            title="Beautiful Websites That Convert"
            subtitle="From landing pages to full-scale web applications."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {webServices.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card group"
              >

                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <s.icon size={24} />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {s.title}
                </h3>

                <p className="text-muted-foreground text-sm">
                  {s.desc}
                </p>

              </motion.div>
            ))}

          </div>

        </div>

      </section>


      {/* =========================================================
          IoT
      ========================================================== */}
      <section className="section-padding gradient-bg">

        <div className="container mx-auto px-4">

          <SectionHeading
            badge="IoT Projects"
            title="Smart IoT Solutions"
            subtitle="Hardware meets software for innovative college projects."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {iotServices.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card group"
              >

                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <s.icon size={24} />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {s.title}
                </h3>

                <p className="text-muted-foreground text-sm">
                  {s.desc}
                </p>

              </motion.div>
            ))}

          </div>

        </div>

      </section>


      {/* =========================================================
          TECH SUPPORT
      ========================================================== */}
      <section className="section-padding">

        <div className="container mx-auto px-4">

          <SectionHeading
            badge="Tech Support"
            title="Reliable Technical Support"
            subtitle="We keep your projects running smoothly."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {supportServices.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card group"
              >

                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <s.icon size={24} />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {s.title}
                </h3>

                <p className="text-muted-foreground text-sm">
                  {s.desc}
                </p>

              </motion.div>
            ))}

          </div>

        </div>

      </section>


      {/* =========================================================
          ONLINE INTERNSHIP & TRAINING
      ========================================================== */}
      <section className="section-padding gradient-bg relative overflow-hidden">

        {/* Decorative background glow */}
        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />

          <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

        </div>

        <div className="container mx-auto px-4 relative z-10">

          <SectionHeading
            badge="Internship & Training"
            title="Build Skills Through Practical Learning"
            subtitle="Structured online internship programs designed to help students develop real technical knowledge and strengthen their career profile."
          />

          {/* Main internship card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >

            <div className="glass-card relative overflow-hidden border border-primary/20">

              {/* Decorative glows */}
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 p-8 md:p-12">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">

                  <div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 mb-4">

                      <GraduationCap
                        size={17}
                        className="text-primary"
                      />

                      <span className="text-sm font-medium text-primary">
                        Online Internship Programs
                      </span>

                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                      Learn. Build.{" "}
                      <span className="gradient-text">
                        Grow.
                      </span>
                    </h2>

                    <p className="text-muted-foreground max-w-2xl mt-4 leading-relaxed">
                      Our internship programs provide students with structured
                      technical learning, assessments, and an opportunity to
                      demonstrate their knowledge through a verified internship
                      certificate.
                    </p>

                  </div>


                  {/* Featured course badge */}
                  <div className="shrink-0">

                    <div className="rounded-2xl border border-primary/20 bg-background/40 backdrop-blur-sm px-6 py-5 text-center">

                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Featured Internship
                      </p>

                      <p className="text-lg font-bold text-foreground">
                        IoT & Embedded Systems
                      </p>

                      <p className="text-sm text-primary font-medium mt-1">
                        15 Days • Online
                      </p>

                    </div>

                  </div>

                </div>


                {/* Internship features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

                  {internshipFeatures.map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-xl border border-border/50 bg-background/30 p-5"
                    >

                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <item.icon size={21} />
                      </div>

                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        {item.title}
                      </h3>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>

                    </motion.div>
                  ))}

                </div>


                {/* Course details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  {/* Left - benefits */}
                  <div>

                    <h3 className="text-xl font-semibold text-foreground mb-5">
                      What You Get
                    </h3>

                    <div className="space-y-3">

                      {internshipBenefits.map((benefit) => (
                        <div
                          key={benefit}
                          className="flex items-start gap-3"
                        >

                          <div className="mt-0.5 shrink-0">

                            <Check
                              size={18}
                              className="text-cyan-400"
                            />

                          </div>

                          <p className="text-sm text-muted-foreground">
                            {benefit}
                          </p>

                        </div>
                      ))}

                    </div>

                  </div>


                  {/* Right - course information */}
                  <div className="rounded-2xl border border-primary/20 bg-background/30 p-6 md:p-7">

                    <div className="flex items-center gap-3 mb-6">

                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <CircuitBoard size={24} />
                      </div>

                      <div>

                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Current Program
                        </p>

                        <h3 className="text-xl font-bold text-foreground">
                          IoT & Embedded Systems
                        </h3>

                      </div>

                    </div>


                    <div className="space-y-4">

                      <div className="flex items-center justify-between pb-3 border-b border-border/40">

                        <span className="text-sm text-muted-foreground">
                          Duration
                        </span>

                        <span className="text-sm font-semibold text-foreground">
                          15 Days
                        </span>

                      </div>


                      <div className="flex items-center justify-between pb-3 border-b border-border/40">

                        <span className="text-sm text-muted-foreground">
                          Mode
                        </span>

                        <span className="text-sm font-semibold text-foreground">
                          Online
                        </span>

                      </div>


                      <div className="flex items-center justify-between pb-3 border-b border-border/40">

                        <span className="text-sm text-muted-foreground">
                          Learning
                        </span>

                        <span className="text-sm font-semibold text-foreground">
                          Structured Modules and Quizzes
                        </span>

                      </div>


                      <div className="flex items-center justify-between pb-3 border-b border-border/40">

                        <span className="text-sm text-muted-foreground">
                          Assessment
                        </span>

                        <span className="text-sm font-semibold text-foreground">
                          Final Assessment 
                        </span>

                      </div>


                      <div className="flex items-center justify-between">

                        <span className="text-sm text-muted-foreground">
                          Certificate
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400">

                          <Award size={16} />

                          Verified

                        </span>

                      </div>

                    </div>


                    {/* CTA */}
                    <div className="mt-7 flex flex-col sm:flex-row gap-3">

                      <Link
                        to="/internship"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
                      >
                        Explore Internships
                        <ArrowRight size={17} />
                      </Link>

                      <Link
                        to="/internship/register"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/40 px-5 py-3.5 text-sm font-semibold text-foreground transition hover:bg-primary/10"
                      >
                        Register Now
                      </Link>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </motion.div>


          {/* Bottom information */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row items-center justify-center gap-2 mt-7 text-center"
          >

            <Users
              size={16}
              className="text-primary"
            />

            <p className="text-sm text-muted-foreground">
              Designed for students, beginners, and aspiring technology
              professionals.
            </p>

          </motion.div>

        </div>

      </section>


      {/* =========================================================
          FINAL CTA
      ========================================================== */}
      <section className="section-padding">

        <div className="container mx-auto px-4">

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card text-center py-16 px-8"
          >

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to{" "}
              <span className="gradient-text">
                Get Started
              </span>
              ?
            </h2>

            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Whether you need a website, an IoT project, technical support,
              or want to develop your skills through an internship, TechDudes
              is here to help.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-4 text-base font-semibold text-black transition hover:bg-cyan-300"
              >
                Contact Us
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/internship"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 px-6 py-4 text-base font-semibold text-foreground transition hover:bg-primary/10"
              >
                Explore Internships
                <GraduationCap size={18} />
              </Link>

            </div>

          </motion.div>

        </div>

      </section>

    </div>
  );
};

export default ServicesPage;