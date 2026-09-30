import { motion } from "framer-motion";
import { Target, Eye, Code2, Lightbulb, Rocket, Users } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const skills = ["React", "TypeScript", "Node.js", "Tailwind CSS", "Arduino", "ESP32", "Python", "Firebase", "Supabase", "MongoDB", "Figma", "Git"];

const values = [
  { icon: Lightbulb, title: "Innovation", desc: "We embrace new technologies and creative solutions." },
  { icon: Rocket, title: "Excellence", desc: "Quality is never an accident, it's intentional effort." },
  { icon: Users, title: "Collaboration", desc: "We work closely with clients to bring visions to life." },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen pt-24">
      <section className="section-padding gradient-bg">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              About <span className="gradient-text">TechDudes</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A student-led tech startup on a mission to make technology accessible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 items-center">
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    
  >
    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary bg-primary/5 mb-4">
      Our Story
    </span>

    <h2 className="text-3xl font-bold text-foreground mb-4">
      From a College Idea to a Tech Startup
    </h2>

    <p className="text-muted-foreground leading-relaxed mb-4">
      TechDudes started as a passion project by a student who wanted to help fellow students with their technical projects. What began as helping classmates with websites and IoT assignments grew into a full-fledged tech startup.
    </p>

    <p className="text-muted-foreground leading-relaxed">
      Today, we serve students and small businesses across the country, delivering professional-grade tech solutions at affordable prices. Our team combines youthful energy with technical expertise to create innovative solutions.
    </p>
  </motion.div>
</div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding gradient-bg">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Target size={24} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To empower students and small businesses with affordable, high-quality tech solutions that help them succeed in the digital world.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="glass-card p-8">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                <Eye size={24} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To become the go-to tech partner for students and startups, known for innovation, reliability, and making technology accessible to everyone.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <SectionHeading badge="Values" title="What Drives Us" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <v.icon size={28} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-muted-foreground text-sm">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="section-padding gradient-bg">
        <div className="container mx-auto px-4">
          <SectionHeading badge="Tech Stack" title="Technologies We Use" />
          <div className="flex flex-wrap justify-center gap-3">
            {skills.map((skill, i) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="px-5 py-2.5 rounded-full glass-card text-sm font-medium text-foreground hover:text-primary transition-colors cursor-default"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
