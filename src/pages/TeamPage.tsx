
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import SectionHeading from "@/components/SectionHeading";

const team = [
  {
    name: "Abishek",
    role: "Founder & Director",
    desc: "Leads TechDudes with a vision to simplify technology. Specializes in full-stack development, IoT systems, and building scalable digital solutions.",
    portfolio: true,
  },
  {
    name: "Hari Prasath",
    role: "Chief Executive Officer (CEO)",
    desc: "Oversees company strategy and growth. Focuses on leadership, business expansion, and building strong client relationships.",
  },
  {
    name: "Esakki Mathavan",
    role: "Social Media Manager",
    desc: "Manages brand presence across social platforms. Creates engaging content and strategies to grow audience reach and engagement.",
  },
  {
    name: "Sakthi Ganesh",
    role: "Business Development Associate",
    desc: "Identifies new business opportunities and builds partnerships. Works closely with clients to understand and deliver tailored solutions.",
  },
  {
    name: "Aro Jeswanth A Doss",
    role: "Business Development Associate",
    desc: "Drives client acquisition and supports business growth initiatives. Ensures smooth communication between clients and the technical team.",
  },
  {
    name: "Hari Subramanian",
    role: "Human Resources (HR)",
    desc: "Manages recruitment, team coordination, and employee well-being. Helps build a strong and collaborative team culture.",
  },
];

const TeamPage = () => {
  return (
    <div className="min-h-screen pt-24">
      {/* Header */}
      <section className="section-padding gradient-bg text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Meet Our <span className="gradient-text">Team</span>
          </h1>

          <p className="text-muted-foreground max-w-2xl mx-auto">
            The people behind TechDudes who turn ideas into reality.
          </p>
        </motion.div>
      </section>

      {/* Team Members */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge="Our Team"
            title="The Minds Behind TechDudes"
          />

          <div className="flex flex-wrap justify-center gap-8">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300 w-full sm:w-[45%] md:w-[30%] lg:w-[22%]"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {member.portfolio ? (
                    <Link
                      to="/abishek"
                      aria-label="View Abishek's portfolio"
                      className="inline-flex items-center gap-1 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                    >
                      {member.name}
                    </Link>
                  ) : (
                    member.name
                  )}
                </h3>

                <p className="text-primary text-sm mb-2">
                  {member.role}
                </p>

                <p className="text-muted-foreground text-sm">
                  {member.desc}
                </p>

                {member.portfolio && (
                  <Link
                    to="/abishek"
                    className="inline-block mt-4 text-sm font-medium text-primary hover:underline"
                  >
                    View Portfolio →
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TeamPage;
