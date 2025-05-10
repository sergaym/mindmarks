'use client';

import Hero from "@/components/hero";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col">
        <Hero />
      </main>
      <Footer />
    </>
  );
}
