import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const projects = [
  {
    title: "Li-Fi Data Transfer System",
    category: "IoT",
    desc: "A wireless communication system using light signals for high-speed data transmission.",
    tags: ["Arduino", "Li-Fi", "Electronics"],
    github: "https://github.com/Abishek040/Lifi_Data_Transfer_System",
    image: "/projects/lifi.png",
  },
  {
    title: "Fingerprint Voting System",
    category: "IoT",
    desc: "Secure voting system using biometric authentication to prevent fraud.",
    tags: ["Arduino", "Biometric", "Security"],
    github: "https://github.com/Abishek040/Biometric-Fingerprint-Voting-System-Arduino-Based-Secure-Voting",
    image: "/projects/fingerprint.png",
  },
  {
    title: "Smart Glass for the Blind",
    category: "IoT",
    desc: "Assistive smart glasses using ultrasonic sensors to detect obstacles and provide alerts.",
    tags: ["Arduino", "Ultrasonic", "Assistive Tech"],
    github: "YOUR_GITHUB_LINK",
    image: "/projects/smartglass.png",
  },
  {
    title: "Quiz Website for Events",
    category: "Web Design",
    desc: "Interactive quiz platform for events with real-time scoring and engagement.",
    tags: ["React", "UI", "Events"],
    github: "YOUR_GITHUB_LINK",
    image: "/projects/quiz.png",
  },
  {
    title: "Contact Page",
    category: "Web Design",
    desc: "Smart contact page with social media links.",
    tags: ["HTML", "UI", "Contact"],
    github: "https://github.com/Abishek040/contact-info",
    image: "/projects/contact.png",
  },
  {
    title: "TechDudes Website",
    category: "Web Design",
    desc: "Modern startup website with 3D UI, animations, and responsive design.",
    tags: ["React", "Three.js", "Tailwind"],
    image: "/projects/website.png",
  },
];

const categories = ["All", "Web Design", "IoT"];

import { useState } from "react";

const ProjectsPage = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered = activeCategory === "All" ? projects : projects.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen pt-24">
      <section className="section-padding gradient-bg">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Our <span className="gradient-text">Projects</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">Explore our portfolio of web and IoT solutions.</p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto px-4">
          {/* Filter */}
          <div className="flex justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat ? "neon-btn" : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                layout
                className="glass-card group overflow-hidden"
              >
                <div className="h-44 rounded-xl mb-4 relative overflow-hidden group">
  <img
    src={p.image}
    alt={p.title}
    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
  />

  {/* Overlay */}
  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
    {p.github && (
      <a href={p.github} target="_blank">
        <span className="p-2 rounded-full bg-primary/20 text-primary hover:scale-110 transition">
          <Github size={18} />
        </span>
      </a>
    )}
  </div>
</div>
                <span className="text-xs font-medium text-primary">{p.category}</span>
                <h3 className="text-lg font-semibold text-foreground mt-1 mb-2">{p.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{p.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{t}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          <section className="mt-16 mx-auto">
              
  <div className="text-center mb-6">
    <h2 className="text-2xl font-bold">Other Projects</h2>
  </div>

  <div className="flex justify-center">
    <div className="flex flex-wrap justify-center gap-4 max-w-xl">
      {[
        "Event Registration Website",
        "Arduino Mini Projects",
        "ESP32 IoT Systems",
        "Ultrasonic Applications",
        "College Projects",
      ].map((proj, i) => (
        <span
          key={i}
          className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/20 transition"
        >
          {proj}
        </span>
      ))}
    </div>
  </div>
</section>
        </div>
      </section>
    </div>
  );
};

export default ProjectsPage;
