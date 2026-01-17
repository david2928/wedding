'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Mail, Phone, MessageCircle, Send, Waves } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Please fill in all required fields",
        description: "Name, email, and message are required.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit to Supabase
      const { data, error } = await supabase
        .from('contact_submissions')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject || null,
            message: formData.message
          }
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Message Sent Successfully! 🌊",
        description: "Thank you for reaching out. We'll get back to you soon!",
      });

      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error sending your message. Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="contact" className="py-12 md:py-20 px-4 bg-gradient-to-br from-soft-white to-pale-blue/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-dancing text-5xl md:text-6xl font-bold italic text-ocean-gradient mb-4">
            Get in Touch
          </h2>
          <p className="font-poppins text-xl text-deep-blue/80 max-w-2xl mx-auto">
            Have questions about our special day? We'd love to hear from you!
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-sky-blue to-navy-blue rounded-full mx-auto mt-6"></div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Contact Form */}
          <div className="floating-card p-8">
            <div className="flex items-center mb-6">
              <Waves className="w-8 h-8 text-sky-blue mr-3 animate-wave" />
              <h3 className="font-dancing text-3xl font-bold italic text-ocean-gradient">
                Send Us a Message
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name" className="font-poppins font-medium text-deep-blue">
                    Name *
                  </Label>
                  <Input
                    id="contact-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className=""
                    placeholder="Your name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="font-poppins font-medium text-deep-blue">
                    Email *
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className=""
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-subject" className="font-poppins font-medium text-deep-blue">
                  Subject
                </Label>
                <Input
                  id="contact-subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className=""
                  placeholder="What would you like to discuss?"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-message" className="font-poppins font-medium text-deep-blue">
                  Message *
                </Label>
                <Textarea
                  id="contact-message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className="min-h-32"
                  placeholder="Your message here..."
                  required
                />
              </div>
              
              <div className="text-center pt-4">
                <Button 
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-sky-blue to-ocean-blue hover:from-ocean-blue hover:to-navy-blue text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
            
            {/* Decorative message */}
            <div className="mt-8 pt-8 border-t border-pale-blue">
              <div className="flex items-center justify-center space-x-4">
                <div className="w-16 h-0.5 bg-sky-blue"></div>
                <Heart className="w-5 h-5 text-pacific-cyan animate-pulse" />
                <div className="w-16 h-0.5 bg-sky-blue"></div>
              </div>
              <p className="font-dancing text-lg italic text-ocean-gradient text-center mt-4">
                Can't wait to celebrate with you!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-pale-blue">
          <div className="floating-card p-6 max-w-2xl mx-auto">
            <p className="font-dancing text-2xl italic text-ocean-gradient mb-2">
              Chanika & David
            </p>
            <p className="font-inter text-deep-blue/80">
              January 31, 2026 • COMO Point Yamu, Phuket, Thailand
            </p>
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="w-12 h-0.5 bg-sky-blue"></div>
              <span className="font-dancing text-lg italic text-sky-blue">Where Dreams Come True</span>
              <div className="w-12 h-0.5 bg-sky-blue"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
