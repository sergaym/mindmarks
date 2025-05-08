"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";

interface ParticlesProps {
  className?: string;
  quantity?: number;
  ease?: number;
  color?: string;
  refresh?: boolean;
  mouseInteraction?: boolean;
}

const Particles = ({
  className = "",
  quantity = 50,
  ease = 50,
  color = "#fff",
  refresh = false,
  mouseInteraction = true,
}: ParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const { resolvedTheme } = useTheme();
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const mouseActive = useRef(false);

  // Particle properties
  const particles = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      originalVx: number;
      originalVy: number;
      size: number;
      color: string;
    }>
  >([]);

  // Initialize particles
  const initParticles = useCallback(() => {
    particles.current = [];
    const canvas = canvasRef.current;
    if (!canvas) return;

    for (let i = 0; i < quantity; i++) {
      const vx = Math.random() * 1 - 0.5;
      const vy = Math.random() * 1 - 0.5;
      
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: vx,
        vy: vy,
        originalVx: vx,
        originalVy: vy,
        size: Math.random() * 3 + 1,
        color: color,
      });
    }
  }, [quantity, color]);

  // Handle mouse events
  useEffect(() => {
    if (!mouseInteraction) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
    };
    
    const handleMouseEnter = () => {
      mouseActive.current = true;
    };
    
    const handleMouseLeave = () => {
      mouseActive.current = false;
      setMousePosition(null);
      
      // Reset particles to original velocity
      particles.current.forEach(particle => {
        particle.vx = particle.originalVx;
        particle.vy = particle.originalVy;
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseInteraction]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setContext(ctx);

    // resize canvas
    const resize = () => {
      if (canvas && context) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        initParticles();
      }
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [context, initParticles]);

  // Initialize particles
  useEffect(() => {
    initParticles();
  }, [quantity, initParticles, windowSize, resolvedTheme, refresh]);

  // Animate particles
  useEffect(() => {
    if (!context) return;
    let animationFrameId: number;

    const render = () => {
      context.clearRect(0, 0, windowSize.width, windowSize.height);

      // Update and draw particles
      particles.current.forEach((particle) => {
        // Apply mouse influence if mouse is active
        if (mouseInteraction && mousePosition && mouseActive.current) {
          const dx = mousePosition.x - particle.x;
          const dy = mousePosition.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only influence particles within a certain radius
          if (distance < 150) {
            const angle = Math.atan2(dy, dx);
            const force = (150 - distance) / 150; // Stronger when closer
            
            // Set velocity toward mouse position
            particle.vx = (Math.cos(angle) * force * 2) + (particle.originalVx * (1 - force));
            particle.vy = (Math.sin(angle) * force * 2) + (particle.originalVy * (1 - force));
          } else {
            // Gradually return to original velocity
            particle.vx = particle.vx * 0.95 + particle.originalVx * 0.05;
            particle.vy = particle.vy * 0.95 + particle.originalVy * 0.05;
          }
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Boundary check
        if (particle.x < 0 || particle.x > windowSize.width) {
          particle.vx = -particle.vx;
          particle.originalVx = -particle.originalVx;
        }
        if (particle.y < 0 || particle.y > windowSize.height) {
          particle.vy = -particle.vy;
          particle.originalVy = -particle.originalVy;
        }

        // Draw particle
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fillStyle = particle.color;
        context.globalAlpha = 0.1;
        context.fill();
      });

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [context, windowSize, ease, mousePosition, mouseInteraction]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
};

export default Particles; 