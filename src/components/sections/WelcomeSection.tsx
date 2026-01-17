
import React from 'react';
import { Heart, Waves } from 'lucide-react';

const WelcomeSection = () => {
  return (
    <section id="welcome" className="py-12 md:py-20 px-4 bg-gradient-to-br from-powder-blue/10 to-soft-white relative overflow-hidden">
      {/* Floating romance elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Heart className="absolute top-16 left-12 w-3 h-3 text-pacific-cyan/30 animate-float opacity-60" style={{ animationDelay: '1s' }} />
        <Heart className="absolute top-32 right-20 w-2 h-2 text-sky-blue/40 animate-float opacity-50" style={{ animationDelay: '3s' }} />
        <Heart className="absolute bottom-24 left-16 w-4 h-4 text-powder-blue/50 animate-float opacity-40" style={{ animationDelay: '5s' }} />
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="floating-card p-6 md:p-12 animate-fade-in-up">
          <div className="flex items-center justify-center mb-8">
            <Waves className="w-8 h-8 text-sky-blue animate-wave mr-3" />
            <h2 className="font-dancing text-4xl md:text-5xl font-bold italic text-ocean-gradient">
              Welcome to Our Story
            </h2>
            <Waves className="w-8 h-8 text-sky-blue animate-wave ml-3" style={{ animationDelay: '0.5s' }} />
          </div>
          
          <div className="w-24 h-1 bg-gradient-to-r from-sky-blue to-navy-blue rounded-full mx-auto mb-8"></div>
          
          <div className="space-y-6 text-lg text-deep-blue/80 leading-relaxed">
            <p className="font-poppins">
              Dear Family and Friends,
            </p>
            
            <p className="font-inter">
              We are absolutely delighted to invite you to celebrate the most magical day of our lives! 
              After years of love, laughter, and countless adventures together – including a very special moment 
              at the happiest place on earth – we've decided to tie the knot where dreams truly come true. 🌊
            </p>
            
            <p className="font-inter">
              Join us as we exchange vows against the stunning backdrop of the Andaman Sea at COMO Point Yamu,
              where azure waters meet golden sunsets. This isn't just a wedding – it's the beginning of our
              <span className="font-dancing text-xl italic text-pacific-cyan">fairytale</span>, and we want you to be part of our
              <span className="font-dancing text-xl italic text-sky-blue">"happily ever after."</span>
            </p>
            
            <div className="flex items-center justify-center space-x-4 pt-4">
              <div className="w-12 h-0.5 bg-sky-blue"></div>
              <Heart className="w-5 h-5 text-pacific-cyan" />
              <div className="w-12 h-0.5 bg-sky-blue"></div>
            </div>
            
            <p className="font-dancing text-2xl italic text-sky-blue pt-4">
              With all our love,
              <br />
              Chanika & David
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
