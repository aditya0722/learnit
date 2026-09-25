"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  Clock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    detail: "support@learnit.com",
    description: "We reply within 24 hours",
  },
  {
    icon: Phone,
    title: "Phone",
    detail: "+1 (555) 123-4567",
    description: "Mon–Fri, 8am–5pm",
  },
  {
    icon: MapPin,
    title: "Office",
    detail: "San Francisco, CA",
    description: "123 Learning Street",
  },
];

const faqs = [
  {
    question: "How do I get started?",
    answer:
      "Create a free account and start browsing. You can enroll in any free course immediately, or upgrade to Pro for full access.",
  },
  {
    question: "Are the courses self-paced?",
    answer:
      "Yes. All courses are 100% self-paced. Learn whenever and wherever works for you.",
  },
  {
    question: "Do I get a certificate?",
    answer:
      "Pro members earn a certificate of completion for every course they finish. Share it on LinkedIn or with employers.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "We offer a 30-day money-back guarantee on all Pro subscriptions. Contact our support team if you need help.",
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = (data: ContactFormData) => {
    console.log("Contact form:", data);
    setSubmitted(true);
    form.reset();
  };

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="bg-surface">
        <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-16 md:pt-24 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              Contact
            </p>
            <h1 className="text-4xl sm:text-[56px] font-bold text-navy tracking-tight leading-[1.05] mb-5">
              Get in touch
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md">
              Have a question, suggestion, or just want to say hello? We&apos;d
              love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* INFO CARDS */}
      <section className="py-12">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid sm:grid-cols-3 gap-3">
            {contactInfo.map((info, i) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <div className="p-5 rounded-lg border border-border bg-white shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <info.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {info.title}
                  </h3>
                  <p className="text-sm font-medium text-foreground mb-0.5">
                    {info.detail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {info.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM + FAQ */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                Message us
              </p>
              <h2 className="text-2xl font-bold text-navy tracking-tight mb-2">
                Send us a message
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Fill out the form below and we&apos;ll get back to you as soon
                as possible.
              </p>

              {submitted ? (
                <div className="p-8 rounded-lg border border-border bg-white shadow-sm text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-4">
                    <Send className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy mb-2">
                    Message sent
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Thank you for reaching out. We&apos;ll get back to you
                    within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubmitted(false)}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm">
                        Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        {...form.register("name")}
                        className={
                          form.formState.errors.name ? "border-destructive" : ""
                        }
                      />
                      {form.formState.errors.name && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        {...form.register("email")}
                        className={
                          form.formState.errors.email ? "border-destructive" : ""
                        }
                      />
                      {form.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-sm">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      placeholder="How can we help?"
                      {...form.register("subject")}
                      className={
                        form.formState.errors.subject ? "border-destructive" : ""
                      }
                    />
                    {form.formState.errors.subject && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.subject.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-sm">
                      Message
                    </Label>
                    <textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us more about your question..."
                      {...form.register("message")}
                      className={`flex w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                        form.formState.errors.message
                          ? "border-destructive"
                          : "border-input"
                      }`}
                    />
                    {form.formState.errors.message && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.message.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="h-10 px-5"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-1.5 h-4 w-4" />
                        Send message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>

            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                FAQ
              </p>
              <h2 className="text-2xl font-bold text-navy tracking-tight mb-2">
                Frequently asked questions
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Quick answers to common questions.
              </p>

              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div
                    key={faq.question}
                    className="p-4 rounded-lg border border-border bg-white shadow-sm"
                  >
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg border border-border bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Response time
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We typically respond within 24 hours during business days.
                </p>
              </div>

              <div className="mt-3 p-4 rounded-lg border border-border bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Global support
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our team spans multiple time zones to support learners
                  worldwide.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
