import { motion } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
const ContactPage = () => {
  return (
    <div className="min-h-screen pt-24">
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold text-foreground mb-6">Send us a message</h2>
              <form 
  action="https://formspree.io/f/xpqoygav" 
  method="POST"
  className="space-y-5"
>
                {/* Name */}
<div>
  <label className="block text-sm font-medium text-foreground mb-2">Name</label>
  <input
    type="text"
    name="name"
    required
    className="w-full px-4 py-3 rounded-xl bg-muted border border-border"
    placeholder="Your name"
  />
</div>

{/* Email */}
<div>
  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
  <input
    type="email"
    name="email"
    required
    className="w-full px-4 py-3 rounded-xl bg-muted border border-border"
    placeholder="your@email.com"
  />
</div>

{/* Message */}
<div>
  <label className="block text-sm font-medium text-foreground mb-2">Message</label>
  <textarea
    name="message"
    required
    rows={5}
    className="w-full px-4 py-3 rounded-xl bg-muted border border-border resize-none"
    placeholder="Tell us about your project..."
  />
</div>
                <button type="submit" className="neon-btn w-full flex items-center justify-center gap-2">
                  <Send size={18} /> Send Message
                </button>
              </form>
            </motion.div>
            {/* Contact Info */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Contact Information</h2>
              
              <div className="glass-card flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                  <a href="mailto:info@techdudes.in" className="text-muted-foreground text-sm hover:text-primary transition-colors">info@techdudes.in</a>
                </div>
              </div>

              <div className="glass-card flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Phone</h3>
                  <a href="tel:+919626787646" className="text-muted-foreground text-sm hover:text-primary transition-colors">+91 96267 87646</a>
                </div>
              </div>

              <div className="glass-card flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Location</h3>
                  <p className="text-muted-foreground text-sm">Tamil Nadu, Rajapalayam</p>
                </div>
              </div>

              {/* WhatsApp */}
              <a
                href="https://wa.me/919626787646"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card flex items-center gap-4 border-green-500/20 hover:border-green-500/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">WhatsApp</h3>
                  <p className="text-muted-foreground text-sm group-hover:text-green-400 transition-colors">Chat with us instantly</p>
                </div>
              </a>
            </motion.div>
          </div>
        </div>
      </section>
       {/* Service Actions */}
<section className="section-padding gradient-bg">
  <div className="container mx-auto px-4">

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">

      {/* LEFT - SERVICES */}
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold mb-4">
          🚀 Get Started with Our Services
        </h2>

        <p className="text-muted-foreground mb-6">
          Choose a service and fill the form to get started instantly.
        </p>

        <a href="https://forms.gle/Sk94w6W2VkBMbcN19" target="_blank">
          <button className="neon-btn px-8 py-4 text-lg">
            🛠️ Request Service
          </button>
        </a>
      </div>

      {/* RIGHT - JOIN TEAM */}
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold mb-4">
          🚀 Become a Part of Our Team
        </h2>

        <p className="text-muted-foreground mb-6">
          Passionate about web development, IoT, or design?  
          Join TechDudes and build innovative projects with us.
        </p>

        <a href="https://forms.gle/F5U4TMX8DGXKLp9q9" target="_blank">
          <button className="neon-btn px-8 py-4 text-lg">
            🚀 Apply Now
          </button>
        </a>
      </div>
    </div>
  </div>
</section>
    </div>
  );
};

export default ContactPage;
