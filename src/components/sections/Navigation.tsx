'use client'

import React, { useState, useEffect } from 'react';
import { Menu, X, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      const headerOffset = 80; // Account for fixed header
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Welcome', href: '#welcome' },
    { name: 'Schedule', href: '#schedule' },
    { name: 'RSVP', href: '#rsvp' },
    { name: 'Logistics', href: '#logistics' },
    { name: 'Hotels', href: '#accommodation' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'backdrop-blur-md shadow-lg border-b border-pale-blue/30'
          : ''
      }`}
      style={{ 
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(253, 251, 247, 0.1)',
        backgroundImage: 'none',
        transition: 'background-color 0.3s ease-in-out'
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Waves className={`w-6 h-6 ${isScrolled ? 'text-sky-blue' : 'text-white'} animate-wave`} />
            <span className={`font-dancing text-xl font-semibold italic ${isScrolled ? 'text-deep-blue' : 'text-white'}`}>
              C & D
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className={`font-medium transition-colors hover:text-sky-blue ${
                  isScrolled ? 'text-deep-blue' : 'text-white'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className={`w-5 h-5 ${isScrolled ? 'text-deep-blue' : 'text-white'}`} />
            ) : (
              <Menu className={`w-5 h-5 ${isScrolled ? 'text-deep-blue' : 'text-white'}`} />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 backdrop-blur-md border-b border-pale-blue/30 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backgroundImage: 'none' }}>
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    scrollToSection(item.href);
                    setIsOpen(false);
                  }}
                  className="block font-medium text-deep-blue hover:text-sky-blue transition-colors w-full text-left"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
