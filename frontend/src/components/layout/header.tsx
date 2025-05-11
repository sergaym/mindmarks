'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ThemeSwitcher } from '../ui/kibo-ui/theme-switcher';
import { Button } from '../ui/button';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { 
  Navbar, 
  NavBody, 
  NavItems, 
  MobileNav, 
  MobileNavHeader, 
  MobileNavMenu, 
  MobileNavToggle
} from '../ui/resizable-navbar';
import { useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActiveLink = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { href: '/about', label: 'About', name: 'About', link: '/about' },
    { href: '/pricing', label: 'Pricing', name: 'Pricing', link: '/pricing' },
  ];
  
  return (
    <header className="w-full sticky top-0 z-50">
      <Navbar className="top-0 backdrop-blur-md bg-background/90 relative">
        <NavBody>
          <div className="z-50 flex items-center">
            <Link href="/" className="flex items-center gap-2 mr-8 relative z-50">
              <span className="font-bold text-xl">Mindmarks</span>
            </Link>
          </div>
          
          <NavItems items={navItems} />
          
          <div className="z-50 flex items-center gap-4">
            <ThemeSwitcher />
            <Button size="sm" className="rounded-lg hidden md:flex relative z-50" asChild>
              <Link href="/login">
                Start Reading <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </NavBody>
        
        <MobileNav>
          <MobileNavHeader>
            <Link href="/" className="flex items-center gap-2 relative z-50">
              <div className="relative w-8 h-8 overflow-hidden rounded">
                <Image 
                  src="/logo.svg" 
                  alt="Mindmarks Logo" 
                  width={32} 
                  height={32}
                  className="dark:invert"
                />
              </div>
              <span className="font-bold text-xl">Mindmarks</span>
            </Link>
            
            <div className="flex items-center gap-4 relative z-50">
              <ThemeSwitcher />
              <MobileNavToggle 
                isOpen={isMenuOpen} 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
              />
            </div>
          </MobileNavHeader>
          
          <MobileNavMenu isOpen={isMenuOpen}>
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className={cn(
                  "text-sm font-medium py-2 transition-colors hover:text-foreground w-full relative z-50",
                  isActiveLink(item.href) 
                    ? "text-foreground" 
                    : "text-muted-foreground"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 w-full">
              <Button className="w-full rounded-lg relative z-50" asChild>
                <Link href="/login">
                  Start Reading <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </header>
  );
} 