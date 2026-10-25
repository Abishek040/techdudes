import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CircuitBoard,
  Code2,
  Cpu,
  ExternalLink,
  GraduationCap,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Radio,
  Trophy,
  Wrench,
  X,
} from "lucide-react";

const Hero3D = lazy(() => import("@/components/Hero3D"));

const roles = [
  "Embedded Systems Engineer",
  "PCB Designer",
  "Firmware Developer",
  "Founder of TechDudes",
];

type Project = {
  number: string;
  title: string;
  category: string;
  description: string;
  highlights: string[];
  hardware: string[];
  technologies: string[];
  client?: boolean;
};

const projects: Project[] = [
  {
    number: "01",
    title: "Aquatic Waste Collecting Boat",
    category: "Robotics · Embedded AI · IoT",
    description:
      "An autonomous boat that searches for floating waste, navigates to it and collects it on a conveyor, while reporting its status to a remote dashboard.",
    highlights: [
      "Raspberry Pi 5 runs AI waste detection using YOLOv8 and OpenCV; an ESP32 drives motors and actuators.",
      "GPS, IMU and ultrasonic sensing support navigation; LoRa carries boat status and location to the dashboard.",
      "Camera detection, motor control, sensor interfacing, GPS positioning and conveyor operation were tested during prototyping.",
    ],
    hardware: [
      "Raspberry Pi 5",
      "ESP32",
      "LoRa RA-02",
      "GPS",
      "IMU",
      "USB camera",
      "Conveyor motor",
      "24V LiFePO4",
    ],
    technologies: ["YOLOv8", "OpenCV", "Python", "LoRa"],
  },
  {
    number: "02",
    title: "AI Smart Glass for Visually Impaired Users",
    category: "Assistive Technology · Embedded AI",
    description:
      "Wearable glasses that detect objects and nearby obstacles and give spoken audio feedback.",
    highlights: [
      "ESP32-CAM video feeds YOLO-based object detection, combined with ultrasonic sensing for obstacle avoidance.",
      "DFPlayer Mini plays audio feedback.",
      "Detection distance, lighting conditions and audio response were evaluated during testing.",
    ],
    hardware: [
      "ESP32-CAM",
      "Arduino Nano",
      "Ultrasonic sensor",
      "DFPlayer Mini",
    ],
    technologies: ["Embedded C", "Python", "YOLO", "OpenCV"],
  },
  {
    number: "03",
    title: "Smart LPG Cylinder Monitoring",
    category: "IoT · Sensor Monitoring",
    description:
      "A connected system that tracks LPG cylinder weight, displays status and sends low-gas alerts through Blynk.",
    highlights: [
      "A load cell and HX711 amplifier measure cylinder weight, read by an ESP32.",
      "Status is shown locally and in the Blynk app, with a low-gas alert.",
      "Built by TechDudes as a prototype with a handover report.",
    ],
    hardware: ["ESP32", "Load cell", "HX711"],
    technologies: ["Blynk", "Embedded C"],
    client: true,
  },
  {
    number: "04",
    title: "Driver Drowsiness Detection",
    category: "Computer Vision · Road Safety",
    description:
      "A driver-monitoring system that detects signs of drowsiness and warns the driver to help prevent accidents.",
    highlights: [
      "Computer vision detects drowsiness from the driver's face.",
      "An ESP32 handles the alert side of the system.",
      "Completed and delivered to a client through TechDudes.",
    ],
    hardware: ["ESP32", "Camera"],
    technologies: ["Python", "OpenCV", "Computer Vision"],
    client: true,
  },
  {
    number: "05",
    title: "Fingerprint Voting System",
    category: "Embedded Systems · Security",
    description:
      "A biometric voting prototype that verifies voters and allows each person to vote only once.",
    highlights: [
      "Embedded control logic for fingerprint capture, matching and vote lockout.",
      "Match/reject accuracy and duplicate-vote prevention were evaluated over repeated test cycles.",
    ],
    hardware: ["Fingerprint sensor", "Microcontroller"],
    technologies: ["Embedded C"],
  },
  {
    number: "06",
    title: "LiFi Data Transfer System",
    category: "Communication · Electronics",
    description:
      "Data transmission using visible light, with an encoding scheme and optical transmitter and receiver circuitry.",
    highlights: [
      "Designed the signal encoding and decoding scheme and embedded circuitry.",
      "Verified data integrity and reliability across distances and under ambient light interference.",
    ],
    hardware: [
      "Optical transmitter",
      "Optical receiver",
      "Embedded controller",
    ],
    technologies: ["Electronics", "Signal encoding"],
  },
];

const skillGroups = [
  {
    icon: CircuitBoard,
    title: "PCB Design",
    skills: [
      "KiCad",
      "Schematic capture",
      "PCB layout & routing",
      "Multi-layer boards",
      "Component placement",
      "BOM preparation",
    ],
  },
  {
    icon: Cpu,
    title: "Embedded & Firmware",
    skills: [
      "Embedded C",
      "ESP32",
      "STM32",
      "Arduino",
      "8051",
      "ARM Cortex",
      "Register-level programming",
    ],
  },
  {
    icon: Wrench,
    title: "Testing & Debugging",
    skills: [
      "Hardware bring-up",
      "Root cause analysis",
      "Design verification",
      "Hardware validation",
      "Soldering",
      "Electronics assembly",
    ],
  },
  {
    icon: Radio,
    title: "Interfaces & Sensors",
    skills: [
      "UART",
      "SPI",
      "I2C",
      "GPIO",
      "LoRa",
      "RFID",
      "Fingerprint",
      "Camera modules",
    ],
  },
  {
    icon: Cpu,
    title: "VLSI & Digital Design",
    skills: [
      "Verilog HDL",
      "RTL design",
      "Cadence Virtuoso",
      "Digital logic",
      "CMOS fundamentals",
    ],
  },
  {
    icon: Code2,
    title: "Software & Tools",
    skills: [
      "C",
      "C++",
      "Python",
      "JavaScript",
      "HTML5 / CSS3",
      "Git & GitHub",
      "Linux",
      "MATLAB",
      "REST APIs",
      "VS Code",
    ],
  },
];

const experience = [
  {
    role: "Founder and Director",
    org: "TechDudes Engineering Projects",
    period: "2025 – Present",
    icon: Briefcase,
    points: [
      "Engineered hardware-firmware solutions for client projects, from requirements analysis and circuit design to firmware, prototyping and functional testing.",
      "Managed the product lifecycle from schematic design to deployment, with engineering documentation for each build.",
      "Debugged and validated embedded prototypes through iterative testing and root-cause analysis.",
      "Coordinated scoping and delivery across concurrent hardware and embedded projects for small-business clients in Tamil Nadu.",
    ],
  },
  {
    role: "Intern, AI & IoT Domain",
    org: "Learnlike",
    period: "2026",
    icon: Wrench,
    points: [
      "Worked on IoT device integration and embedded hardware-software architecture.",
      "Gained exposure to sensor interfacing, firmware behavior and connected-device testing.",
      "Supported AI-based automation tasks on embedded platforms, including functional testing of prototype hardware.",
    ],
  },
];

const certifications = [
  {
    title: "VLSI SoC Design using Verilog HDL",
    issuer: "Maven Silicon",
    year: "2026",
  },
  {
    title: "Fundamentals of Digital Design for VLSI Chip Design",
    issuer: "Coursera",
    year: "2026",
  },
  {
    title: "Embedded Systems Using C",
    issuer: "Coursera",
    year: "2026",
  },
  {
    title: "Intro to IoT and Embedded Systems",
    issuer: "Coursera",
    year: "2025",
  },
];

const hackathons = [
  {
    title: "Smart India Hackathon",
    detail: "National level",
    year: "2024–2025",
  },
  { title: "NIRAL Hackathon", detail: "", year: "2024" },
  { title: "MSME Hackathon", detail: "", year: "2024" },
];

const marquee = [
  "KiCad",
  "ESP32",
  "STM32",
  "Embedded C",
  "YOLOv8",
  "OpenCV",
  "LoRa",
  "Verilog HDL",
  "Raspberry Pi 5",
  "I2C · SPI · UART",
  "Python",
  "Blynk",
];

function SectionHeading({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-cyan-300">
          {label}
        </p>
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h2>
      </div>

      {children && (
        <p className="max-w-lg text-sm leading-7 text-slate-300/75 sm:text-base">
          {children}
        </p>
      )}
    </div>
  );
}

function CountUp({
  to,
  decimals = 0,
  reduced,
}: {
  to: number;
  decimals?: number;
  reduced: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(reduced ? to : 0);

  useEffect(() => {
    if (!inView || reduced) return;

    const controls = animate(0, to, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setValue(v),
    });

    return () => controls.stop();
  }, [inView, to, reduced]);

  return <span ref={ref}>{value.toFixed(decimals)}</span>;
}

function TiltCard({
  children,
  className = "",
  onClick,
  reduced,
  label,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  reduced: boolean;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const rotateY = useSpring(
    useTransform(px, [-0.5, 0.5], [-8, 8]),
    { stiffness: 180, damping: 18 }
  );

  const rotateX = useSpring(
    useTransform(py, [-0.5, 0.5], [8, -8]),
    { stiffness: 180, damping: 18 }
  );

  const glowX = useTransform(px, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(py, [-0.5, 0.5], ["0%", "100%"]);

  const glow = useTransform(
    [glowX, glowY],
    ([x, y]) =>
      `radial-gradient(320px circle at ${x} ${y}, rgba(34,211,238,0.14), transparent 65%)`
  );

  const move = (event: React.PointerEvent) => {
    if (reduced || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const leave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      onClick={onClick}
      onKeyDown={(event) => {
        if (
          onClick &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      style={
        reduced
          ? undefined
          : { rotateX, rotateY, transformPerspective: 900 }
      }
      className={`relative ${className}`}
    >
      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: glow }}
        />
      )}

      <div className="relative">{children}</div>
    </motion.div>
  );
}

function Tag({
  children,
  tone = "cyan",
}: {
  children: ReactNode;
  tone?: "cyan" | "plain";
}) {
  return (
    <span
      className={
        tone === "cyan"
          ? "rounded-full border border-cyan-300/25 bg-cyan-300/[0.06] px-3 py-1.5 text-xs text-cyan-100/90"
          : "rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-200/85"
      }
    >
      {children}
    </span>
  );
}

function HeroFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex h-44 w-44 items-center justify-center rounded-full border border-cyan-300/40 bg-gradient-to-br from-cyan-300/15 to-indigo-500/20 shadow-[0_0_55px_rgba(34,211,238,0.12)]">
        <Cpu
          className="h-20 w-20 text-cyan-300"
          strokeWidth={1.2}
        />
      </div>
    </div>
  );
}

export default function Portfolio() {
  const reduced = !!useReducedMotion();
  const [roleIndex, setRoleIndex] = useState(0);
  const [active, setActive] = useState<Project | null>(null);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
  });

  useEffect(() => {
    if (reduced) return;

    const id = window.setInterval(() => {
      setRoleIndex((index) => (index + 1) % roles.length);
    }, 2600);

    return () => window.clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    if (!active) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };

    window.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  const stats = [
    { label: "Projects", value: projects.length, decimals: 0 },
    {
      label: "Certifications",
      value: certifications.length,
      decimals: 0,
    },
    { label: "Hackathons", value: hackathons.length, decimals: 0 },
    { label: "CGPA (B.E. ECE)", value: 6.97, decimals: 2 },
  ];

  return (
    <div id="top" className="relative isolate flex w-full flex-col bg-[#0b0b12] text-white">
      {/* Scroll progress bar */}
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-cyan-300 via-cyan-400 to-indigo-400"
      />

      {/* Sticky Header (placed at root level so sticky works with window scroll) */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b12]/65 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link
            to="/"
            className="group inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/85 transition hover:border-cyan-300/50 hover:bg-white/[0.08] hover:text-cyan-300"
          >
            <ArrowLeft
              size={17}
              className="transition-transform group-hover:-translate-x-1"
            />
            Back to TechDudes
          </Link>

          <nav
            className="hidden items-center gap-7 text-sm text-slate-300/80 md:flex"
            aria-label="Sections"
          >
            {[
              ["Work", "#projects"],
              ["Experience", "#experience"],
              ["Skills", "#skills"],
              ["Credentials", "#credentials"],
            ].map(([name, href]) => (
              <a
                key={href}
                href={href}
                className="transition hover:text-cyan-300"
              >
                {name}
              </a>
            ))}
          </nav>

          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-[#061015] transition hover:bg-cyan-300"
          >
            Contact me <ArrowRight size={16} />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full overflow-x-clip">
        {/* Hero */}
        <section className="relative isolate">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -left-40 top-16 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]" />
            <div className="absolute right-[-100px] top-40 h-96 w-96 rounded-full bg-cyan-400/10 blur-[120px]" />
          </div>

          <div className="mx-auto grid w-full max-w-7xl items-start gap-8 px-5 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-12 lg:pt-8 lg:pb-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            >
              <div className="mb-7 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  {!reduced && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70" />
                  )}
                  <span className="relative h-2 w-2 rounded-full bg-cyan-300" />
                </span>

                <span className="text-xs font-medium text-cyan-200">
                  Open to EMS, product engineering and embedded/test roles
                </span>
              </div>

              <h1 className="max-w-3xl text-5xl font-bold leading-[1.04] tracking-[-0.055em] sm:text-6xl xl:text-[76px]">
                Hi, I&apos;m Abishek A.

                <span className="mt-3 block min-h-[1.3em] overflow-hidden text-3xl leading-tight sm:text-4xl xl:text-[44px] bg-gradient-to-r from-cyan-300 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={roleIndex}
                      className="block"
                      initial={
                        reduced
                          ? false
                          : { y: "100%", opacity: 0 }
                      }
                      animate={{ y: 0, opacity: 1 }}
                      exit={
                        reduced
                          ? undefined
                          : { y: "-100%", opacity: 0 }
                      }
                      transition={{
                        duration: 0.45,
                        ease: "easeOut",
                      }}
                    >
                      {roles[roleIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </h1>

              <p
                id="about"
                className="mt-7 max-w-xl scroll-mt-24 text-base leading-8 text-slate-300/80 sm:text-lg"
              >
                Electronics and Communication Engineering student and
                founder of TechDudes. I design PCBs in KiCad, write
                embedded C firmware for ESP32, STM32, Arduino and 8051,
                and test hardware-firmware systems from schematic to
                working prototype.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300/70">
                <span className="inline-flex items-center gap-2">
                  <MapPin size={15} className="text-cyan-300" />
                  Rajapalayam, Tamil Nadu, India
                </span>

                <span className="inline-flex items-center gap-2">
                  <GraduationCap
                    size={15}
                    className="text-cyan-300"
                  />
                  Ramco Institute of Technology, 2023–2027
                </span>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="#projects"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3.5 text-sm font-semibold text-[#061015] shadow-[0_0_30px_rgba(34,211,238,0.15)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
                >
                  See my work <ArrowDown size={17} />
                </a>

                <a
                  href="https://github.com/Abishek040"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white/90 transition hover:border-cyan-300/50 hover:bg-white/[0.07]"
                >
                  <Github size={18} />
                  GitHub
                  <ExternalLink size={14} />
                </a>
              </div>
            </motion.div>

            {/* 3D PCB */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.1 }}
              className="relative mx-auto h-[360px] w-full min-w-0 max-w-[640px] overflow-visible sm:h-[420px] lg:h-[480px]"
              role="img"
              aria-label="3D illustration of a circuit board with glowing traces and orbiting nodes"
            >
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-400/10 via-indigo-500/10 to-transparent blur-2xl" />

              <Suspense fallback={<HeroFallback />}>
                <Hero3D
                  reducedMotion={reduced}
                  fallback={<HeroFallback />}
                />
              </Suspense>
            </motion.div>
          </div>

          {/* Statistics */}
          <div className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 lg:px-12">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#0f0f19]/80 px-6 py-6 backdrop-blur-sm"
                >
                  <dt className="text-xs text-slate-300/60">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-3xl font-bold tracking-tight text-white">
                    <CountUp
                      to={stat.value}
                      decimals={stat.decimals}
                      reduced={reduced}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Animated skills marquee */}
          <div
            className="overflow-hidden border-y border-white/10 bg-white/[0.02] py-4"
            aria-hidden
          >
            <motion.div
              className="flex w-max gap-10 whitespace-nowrap text-sm text-slate-300/60"
              animate={reduced ? undefined : { x: ["0%", "-50%"] }}
              transition={{
                duration: 32,
                ease: "linear",
                repeat: Infinity,
              }}
            >
              {[...marquee, ...marquee].map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-10"
                >
                  {item}
                  <span className="h-1 w-1 rounded-full bg-cyan-300/50" />
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Projects */}
        <section
          id="projects"
          className="scroll-mt-16 px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              label="SELECTED WORK"
              title="Projects I've built"
            >
              Prototypes across embedded AI, IoT, security and
              communication. Select a project for its hardware and
              testing details.
            </SectionHeading>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project, index) => (
                <motion.div
                  key={project.number}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.5,
                    delay: (index % 3) * 0.08,
                  }}
                >
                  <TiltCard
                    reduced={reduced}
                    onClick={() => setActive(project)}
                    label={`Open details for ${project.title}`}
                    className="group h-full cursor-pointer rounded-2xl border border-white/10 bg-[#11111b]/55 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-cyan-300/35 hover:bg-[#171724]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 sm:p-7"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <span className="text-sm font-medium text-cyan-300/90">
                        Project {project.number}
                      </span>

                      {project.client && (
                        <span className="rounded-full border border-indigo-300/30 bg-indigo-400/10 px-2.5 py-1 text-[11px] text-indigo-200">
                          TechDudes client build
                        </span>
                      )}
                    </div>

                    <p className="mb-3 text-xs font-medium leading-5 text-indigo-300">
                      {project.category}
                    </p>

                    <h3 className="text-xl font-semibold leading-snug">
                      {project.title}
                    </h3>

                    <p className="mt-4 min-h-[112px] text-sm leading-7 text-slate-300/75">
                      {project.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {project.technologies.map((technology) => (
                        <Tag key={technology} tone="plain">
                          {technology}
                        </Tag>
                      ))}
                    </div>

                    <span className="mt-6 inline-flex items-center gap-2 text-sm text-cyan-300 transition group-hover:gap-3">
                      View details <ArrowRight size={16} />
                    </span>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Experience */}
        <section
          id="experience"
          className="scroll-mt-16 border-t border-white/10 px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
        >
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              label="EXPERIENCE"
              title="Where I've worked"
            />

            <div className="relative ml-3 border-l border-white/15 pl-8 sm:ml-5 sm:pl-12">
              {experience.map((job, index) => {
                const Icon = job.icon;

                return (
                  <motion.article
                    key={job.org}
                    initial={{
                      opacity: 0,
                      x: reduced ? 0 : -24,
                    }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.55 }}
                    className={
                      index < experience.length - 1 ? "pb-14" : ""
                    }
                  >
                    <span className="absolute -left-[19px] flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/40 bg-[#0b0b12] text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.18)]">
                      <Icon size={17} />
                    </span>

                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-xl font-semibold">
                        {job.role}
                      </h3>
                      <span className="text-sm text-cyan-300/90">
                        {job.period}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-indigo-300">
                      {job.org}
                    </p>

                    <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300/80">
                      {job.points.map((point) => (
                        <li key={point} className="flex gap-3">
                          <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-cyan-300" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Skills */}
        <section
          id="skills"
          className="scroll-mt-16 border-y border-white/10 bg-[#0b0b12]/25 px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              label="MY TOOLKIT"
              title="Skills & technologies"
            >
              The tools I use to design boards, write firmware, and test
              and debug hardware.
            </SectionHeading>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {skillGroups.map((group, index) => {
                const Icon = group.icon;

                return (
                  <motion.div
                    key={group.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: (index % 3) * 0.08,
                    }}
                  >
                    <TiltCard
                      reduced={reduced}
                      className="h-full rounded-2xl border border-white/10 bg-[#11111b]/65 p-6 backdrop-blur-sm"
                    >
                      <Icon
                        className="mb-5 h-7 w-7 text-cyan-300"
                        strokeWidth={1.6}
                      />

                      <h3 className="mb-5 text-lg font-semibold">
                        {group.title}
                      </h3>

                      <div className="flex flex-wrap gap-2">
                        {group.skills.map((skill, skillIndex) => (
                          <motion.span
                            key={skill}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{
                              delay: 0.15 + skillIndex * 0.04,
                            }}
                            className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs text-slate-200/85"
                          >
                            {skill}
                          </motion.span>
                        ))}
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Credentials */}
        <section
          id="credentials"
          className="scroll-mt-16 px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              label="CREDENTIALS"
              title="Education, learning & competitions"
            />

            <div className="grid gap-5 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-white/10 bg-[#11111b]/60 p-7 backdrop-blur-sm"
              >
                <GraduationCap
                  className="mb-5 h-7 w-7 text-cyan-300"
                  strokeWidth={1.6}
                />

                <h3 className="text-lg font-semibold">Education</h3>

                <div className="mt-5 space-y-5 text-sm leading-7 text-slate-300/80">
                  <div>
                    <p className="font-medium text-white">
                      B.E. Electronics and Communication Engineering
                    </p>
                    <p>Ramco Institute of Technology, Rajapalayam</p>
                    <p className="text-slate-400">
                      2023 – 2027 · CGPA 6.97/10
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-white">
                      Higher Secondary Education
                    </p>
                    <p>PACM Higher Secondary School</p>
                    <p className="text-slate-400">2023 · 76.6%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 }}
                className="rounded-2xl border border-white/10 bg-[#11111b]/60 p-7 backdrop-blur-sm"
              >
                <Award
                  className="mb-5 h-7 w-7 text-cyan-300"
                  strokeWidth={1.6}
                />

                <h3 className="text-lg font-semibold">
                  Certifications
                </h3>

                <ul className="mt-5 space-y-4 text-sm leading-6">
                  {certifications.map((certification) => (
                    <li
                      key={certification.title}
                      className="flex justify-between gap-4"
                    >
                      <span>
                        <span className="block text-white">
                          {certification.title}
                        </span>
                        <span className="text-slate-400">
                          {certification.issuer}
                        </span>
                      </span>

                      <span className="shrink-0 text-cyan-300/90">
                        {certification.year}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.16 }}
                className="flex flex-col gap-5"
              >
                <div className="rounded-2xl border border-white/10 bg-[#11111b]/60 p-7 backdrop-blur-sm">
                  <Trophy
                    className="mb-5 h-7 w-7 text-cyan-300"
                    strokeWidth={1.6}
                  />

                  <h3 className="text-lg font-semibold">
                    Hackathons
                  </h3>

                  <ul className="mt-5 space-y-4 text-sm leading-6">
                    {hackathons.map((hackathon) => (
                      <li
                        key={hackathon.title}
                        className="flex justify-between gap-4"
                      >
                        <span>
                          <span className="block text-white">
                            {hackathon.title}
                          </span>

                          {hackathon.detail && (
                            <span className="text-slate-400">
                              {hackathon.detail}
                            </span>
                          )}
                        </span>

                        <span className="shrink-0 text-cyan-300/90">
                          {hackathon.year}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#11111b]/60 p-7 backdrop-blur-sm">
                  <BookOpen
                    className="mb-4 h-6 w-6 text-indigo-300"
                    strokeWidth={1.6}
                  />

                  <h3 className="text-lg font-semibold">
                    Published author
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-slate-300/80">
                    Author of the novel{" "}
                    <em>The Last Coordinates</em>.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How I work */}
        <section className="border-t border-white/10 px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Curious by nature.
              <span className="block text-slate-300/60">
                Builder by choice.
              </span>
            </h2>

            <div className="space-y-5 text-sm leading-8 text-slate-200/70 sm:text-base">
              <p>
                I work where electronics, firmware and software meet:
                choosing components, drawing the schematic, laying out
                the board, writing the firmware, then testing until the
                prototype behaves. I keep learning across embedded
                systems, VLSI and product engineering.
              </p>

              <p>
                Through TechDudes I deliver hardware, firmware, PCB
                design and embedded projects for small-business clients,
                with documentation for each build.
              </p>

              <a
                href="https://techdudes.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-medium text-cyan-300 transition hover:text-cyan-200"
              >
                Visit TechDudes <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section
          id="contact"
          className="scroll-mt-16 px-5 pb-6 sm:px-8 lg:px-12 lg:pb-12"
        >
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-cyan-300/25 bg-gradient-to-br from-cyan-400/[0.10] via-indigo-500/[0.10] to-[#11111b]/55 p-8 backdrop-blur-sm sm:p-12 lg:p-16">
            <motion.div
              aria-hidden
              animate={
                reduced
                  ? undefined
                  : {
                      scale: [1, 1.15, 1],
                      opacity: [0.7, 1, 0.7],
                    }
              }
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-300/[0.10] blur-3xl"
            />

            <div className="relative max-w-3xl">
              <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                Have a hardware idea or a role in mind?
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-200/75 sm:text-base">
                I&apos;m open to EMS, product engineering and
                embedded/test engineering roles, and to hardware,
                firmware and PCB projects through TechDudes.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="mailto:abishek2005vk18@gmail.com"
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3.5 text-sm font-semibold text-[#061015] transition hover:bg-cyan-300"
                >
                  <Mail size={17} /> Email me
                </a>

                <a
                  href="https://www.linkedin.com/in/abishek-a-5703382a0"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:bg-white/[0.07]"
                >
                  <Linkedin size={17} /> LinkedIn
                </a>

                <a
                  href="https://github.com/Abishek040"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:bg-white/[0.07]"
                >
                  <Github size={17} /> GitHub
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Back to Top */}
        <section className="relative z-10 flex justify-center bg-[#0b0b12] px-5 py-6 sm:px-8">
          <a
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              window.scrollTo({
                top: 0,
                behavior: reduced ? "auto" : "smooth",
              });
            }}
            className="group inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-transparent px-5 py-3 text-sm font-medium text-cyan-100 transition hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-cyan-300/[0.10] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            <ArrowLeft
              size={16}
              className="rotate-90 transition-transform group-hover:-translate-y-0.5"
            />
            Back to Top
          </a>
        </section>
      </main>

      {/* Project details dialog */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={active.title}
              onClick={(event) => event.stopPropagation()}
              initial={{
                y: reduced ? 0 : 60,
                opacity: 0,
                scale: reduced ? 1 : 0.97,
              }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{
                y: reduced ? 0 : 40,
                opacity: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 28,
              }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/15 bg-[#0f0f1a] p-7 shadow-2xl sm:rounded-3xl sm:p-9"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-indigo-300">
                    {active.category}
                  </p>

                  <h3 className="mt-2 text-2xl font-semibold leading-snug sm:text-3xl">
                    {active.title}
                  </h3>
                </div>

                <button
                  onClick={() => setActive(null)}
                  aria-label="Close project details"
                  className="rounded-full border border-white/15 p-2 text-slate-300 transition hover:border-cyan-300/50 hover:text-cyan-300"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-300/85">
                {active.description}
              </p>

              <h4 className="mt-7 text-sm font-semibold text-white">
                What I built
              </h4>

              <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-300/80">
                {active.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3">
                    <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-cyan-300" />
                    {highlight}
                  </li>
                ))}
              </ul>

              <h4 className="mt-7 text-sm font-semibold text-white">
                Hardware
              </h4>

              <div className="mt-3 flex flex-wrap gap-2">
                {active.hardware.map((hardware) => (
                  <Tag key={hardware}>{hardware}</Tag>
                ))}
              </div>

              <h4 className="mt-6 text-sm font-semibold text-white">
                Software & methods
              </h4>

              <div className="mt-3 flex flex-wrap gap-2">
                {active.technologies.map((technology) => (
                  <Tag key={technology} tone="plain">
                    {technology}
                  </Tag>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}