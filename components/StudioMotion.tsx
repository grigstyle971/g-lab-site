"use client";

import { useEffect } from "react";

export default function StudioMotion() {
  useEffect(() => {
    if (document.querySelector(".studio-page")) return;
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointerFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    root.classList.add("motion-ready");

    const observer = reduced ? null : new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer?.unobserve(entry.target); }
    }), { threshold: 0.1, rootMargin: "0px 0px -7%" });

    let revealIndex = 0;
    const prepareReveal = (item: HTMLElement) => {
      if (item.dataset.motionBound) return;
      item.dataset.motionBound = "true";
      item.style.setProperty("--reveal-delay", String((revealIndex++ % 4) * 55));
      if (reduced) item.classList.add("is-visible");
      else observer?.observe(item);
    };
    const prepareReveals = (node: ParentNode) => {
      if (node instanceof HTMLElement && node.matches("[data-reveal]")) prepareReveal(node);
      node.querySelectorAll?.<HTMLElement>("[data-reveal]").forEach(prepareReveal);
    };
    prepareReveals(document);
    const changes = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) prepareReveals(node);
    })));
    changes.observe(document.body, { childList: true, subtree: true });

    const parallax = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      root.style.setProperty("--page-progress", String(window.scrollY / maxScroll));
      if (parallax.length) {
        parallax.forEach((item) => {
          const rect = item.getBoundingClientRect();
          const viewportProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
          item.style.setProperty("--parallax-y", String((viewportProgress - .5) * -18));
        });
      }
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onPointerMove = (event: PointerEvent) => {
      if (!reduced) {
        root.style.setProperty("--pointer-x", String(event.clientX / window.innerWidth));
        root.style.setProperty("--pointer-y", String(event.clientY / window.innerHeight));
      }
    };
    if (pointerFine) window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      observer?.disconnect();
      changes.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      if (pointerFine) window.removeEventListener("pointermove", onPointerMove);
      root.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
