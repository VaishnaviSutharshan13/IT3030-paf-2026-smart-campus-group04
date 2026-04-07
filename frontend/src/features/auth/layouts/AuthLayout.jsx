import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const typewriterLines = [
  "Manage your campus smarter...",
  "Track operations efficiently...",
  "All-in-one campus solution...",
];

const stats = [
  { label: "Students", value: "24/7" },
  { label: "Lecturers", value: "Real-time" },
  { label: "System uptime", value: "99.9%" },
];

function useTypewriter(lines) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentLine = lines[lineIndex];
    const delay = isDeleting ? 36 : 58;
    const pause = !isDeleting && charIndex === currentLine.length ? 1200 : 0;
    const timeout = window.setTimeout(() => {
      if (!isDeleting && charIndex < currentLine.length) {
        setCharIndex((index) => index + 1);
        return;
      }

      if (!isDeleting && charIndex === currentLine.length) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && charIndex > 0) {
        setCharIndex((index) => index - 1);
        return;
      }

      setIsDeleting(false);
      setLineIndex((index) => (index + 1) % lines.length);
    }, delay + pause);

    return () => window.clearTimeout(timeout);
  }, [charIndex, isDeleting, lineIndex, lines]);

  return lines[lineIndex].slice(0, charIndex);
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  const animatedLine = useTypewriter(typewriterLines);
  const statVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: (index) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.45 + index * 0.08, duration: 0.45, ease: "easeOut" },
      }),
    }),
    []
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-36 top-12 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-8 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative mx-auto grid min-h-[90vh] w-full max-w-7xl overflow-hidden rounded-[30px] border border-white/15 bg-white/8 shadow-[0_20px_80px_rgba(8,15,35,0.45)] backdrop-blur-sm lg:grid-cols-2"
      >
        <aside className="relative order-1 overflow-hidden min-h-[40vh] lg:min-h-full">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80"
            alt="Students in a modern smart campus workspace"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-teal-800/75 to-blue-900/75" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(255,255,255,0.2),transparent_42%)]" />

          <motion.div
            className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8 lg:p-10 text-white"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-100/95">Smart Campus Operations Hub</p>
            <h2 className="mt-3 max-w-xl text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
              One intelligence layer for your entire campus ecosystem.
            </h2>
            <p className="mt-4 h-7 text-sm font-medium text-emerald-50 sm:text-base">
              {animatedLine}
              <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-white/90 align-middle" />
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <motion.article
                  key={stat.label}
                  custom={index}
                  variants={statVariants}
                  initial="hidden"
                  animate="visible"
                  className="rounded-2xl border border-white/30 bg-white/16 p-4 backdrop-blur-md"
                >
                  <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-100">{stat.label}</p>
                  <p className="mt-1 text-lg font-semibold">{stat.value}</p>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </aside>

        <div className="order-2 flex items-center justify-center bg-[linear-gradient(170deg,rgba(248,255,252,0.88)_0%,rgba(237,255,248,0.78)_45%,rgba(229,247,255,0.76)_100%)] px-4 py-8 sm:px-8 lg:px-12">
          <motion.section
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
            className="w-full max-w-lg rounded-[28px] border border-white/65 bg-white/72 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8"
          >
            <header className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
              <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            </header>
            {children}
            {footer ? (
              <footer className="mt-6 flex items-center justify-center gap-2 border-t border-emerald-100/80 pt-4 text-sm text-slate-500">
                {footer}
              </footer>
            ) : null}
          </motion.section>
        </div>
      </motion.section>
    </div>
  );
}
