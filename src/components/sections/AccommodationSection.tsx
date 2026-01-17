'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Wifi, Car, Waves, MapPin, Phone, Info } from 'lucide-react';

const BookingTooltip = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      <div 
        className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white border-2 border-sky-blue/30 rounded-lg shadow-xl p-3 min-w-max">
          <div className="text-xs text-deep-blue space-y-1">
            <div className="font-semibold mb-1">How to book:</div>
            <div>📧 Email: sales.hblp@nhhotels.com</div>
            <div>🔑 Code: <span className="font-mono bg-sky-blue/20 px-1.5 py-0.5 rounded">DAVIDWED2026</span></div>
            <div>📅 Dates: Jan 31 - Feb 1, 2026</div>
          </div>
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
          <div className="absolute -top-[1px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-sky-blue/30"></div>
        </div>
      </div>
    </div>
  );
};

const AccommodationSection = () => {
  const hotels = [
    {
      name: 'COMO Point Yamu',
      category: 'Wedding Venue',
      description: 'Our stunning wedding venue offers contemporary design with breathtaking ocean views.',
      features: ['Ocean View Suites', 'Three Infinity Pools', 'COMO Shambhala Spa', 'Two Restaurants'],
      price: 'Special Rate Available',
      specialNote: 'Special wedding rate available until end of September',
      image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80',
      rating: 5,
      bookingLink: 'https://reservations.comohotels.com/?adult=1&arrive=2026-01-31&chain=10327&child=0&currency=THB&depart=2026-02-01&hotel=60269&level=hotel&locale=en-US&productcurrency=THB&promo=GRPNWEDCSDG&rooms=1',
      mapLink: 'https://maps.app.goo.gl/Mok16sEeTfCLiZxRA'
    },
    {
      name: 'NH Boat Lagoon Phuket Resort',
      description: '5-star luxury resort within Phuket Boat Lagoon marina, just 10 minutes from the venue.',
      features: ['Marina Views', 'Large Pool', 'Full Spa', 'Kids Club'],
      price: 'Special Wedding Rates',
      specialNote: 'Wedding group rates available until 31 October 2025. Quote code: DAVIDWED2026',
      rates: [
        { type: 'Marina Standard/Superior', price: '฿3,200 net/night', includes: 'Breakfast for 2 persons' },
        { type: 'Deluxe Room', price: '฿3,700 net/night', includes: 'Breakfast for 2 persons' }
      ],
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      contact: 'sales.hblp@nhhotels.com',
      mapLink: 'https://maps.app.goo.gl/Mok16sEeTfCLiZxRA'
    },
    {
      name: 'The Oceanic Sportel',
      description: 'Unique 5-star sports hotel with tennis courts and modern facilities, 20-30 minutes from venue.',
      features: ['Tennis Courts', 'Fitness Center', 'Swimming Pool', 'Sports Focus'],
      price: 'Wedding Group Rates',
      specialNote: 'Contact the hotel directly for special wedding group rates. Mention "David Geiermann" wedding group for discounted pricing.',
      rates: [
        { type: 'Deluxe Room', price: '฿2,100 net/night', includes: 'Room only, breakfast not included' },
        { type: 'Deluxe Room with Breakfast', price: '฿2,400 net/night', includes: 'Breakfast for 2 persons included' }
      ],
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
      contact: 'sev@theoceanicsportel.com',
      phone: '+66 83 453 6654',
      mapLink: 'https://maps.app.goo.gl/te4LEGwU23WdvECSA'
    },
    {
      name: 'Lalynn Resort & Villas',
      description: 'Newly opened 5-star villa-style resort with private pool access, 20-30 minutes from venue.',
      features: ['Villa Style Rooms', 'Private Pool Access', 'Spa Center', 'Shuttle Service'],
      price: 'From ฿5,500/night',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
      contact: '+66 76 386 000',
      mapLink: 'https://maps.app.goo.gl/WEU5WdHUgQKeQTtZ9'
    }
  ];

  return (
    <section id="accommodation" className="py-12 md:py-20 px-4 bg-gradient-to-br from-soft-white to-pale-blue/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-dancing text-5xl md:text-6xl font-bold italic text-ocean-gradient mb-4">
            Where Dreams Rest
          </h2>
          <p className="font-poppins text-xl text-deep-blue/80 max-w-3xl mx-auto">
            We've curated a selection of beautiful accommodations near our wedding venue,
            each offering their own slice of <span className="font-dancing text-xl italic text-pacific-cyan">paradise</span> 🏝️
          </p>
          <div className="flex items-center justify-center mt-6 space-x-3">
            <div className="w-2 h-2 bg-sky-blue rounded-full animate-sparkle"></div>
            <div className="w-28 h-1 bg-gradient-to-r from-sky-blue to-navy-blue rounded-full"></div>
            <div className="w-2 h-2 bg-navy-blue rounded-full animate-sparkle" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {hotels.map((hotel, index) => (
            <div
              key={index}
              className="floating-card overflow-hidden hover:scale-102 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
                {hotel.category && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-deep-blue">
                      {hotel.category}
                    </span>
                  </div>
                )}
                {hotel.rating && (
                  <div className="absolute top-4 right-4 flex items-center bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                    {[...Array(hotel.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-pacific-cyan fill-current" />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6 md:p-8">
                <h3 className="font-poppins text-2xl font-bold text-deep-blue mb-2 wave-border">
                  {hotel.name}
                </h3>
                
                <p className="font-inter text-deep-blue/80 mb-6 leading-relaxed">
                  {hotel.description}
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {hotel.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <div className="w-2 h-2 bg-sky-blue rounded-full mr-2"></div>
                      <span className="font-inter text-sm text-deep-blue/70">{feature}</span>
                    </div>
                  ))}
                </div>

                {hotel.rates && (
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-poppins text-lg font-semibold text-deep-blue">Room Rates</h4>
                      <BookingTooltip>
                        <Info className="w-4 h-4 text-sky-blue cursor-help" />
                      </BookingTooltip>
                    </div>
                    {hotel.rates.map((rate, rateIndex) => (
                      <div key={rateIndex} className="flex justify-between items-center p-3 bg-sky-blue/5 rounded-lg border border-sky-blue/20">
                        <div>
                          <p className="font-inter text-sm font-medium text-deep-blue">{rate.type}</p>
                          <p className="font-inter text-xs text-deep-blue/60">{rate.includes}</p>
                        </div>
                        <p className="font-poppins font-bold text-navy-blue">{rate.price}</p>
                      </div>
                    ))}
                    <p className="font-inter text-xs text-deep-blue/60 italic">
                      Valid until 31 October 2025
                    </p>
                  </div>
                )}
                
                <div className="pt-6 border-t border-pale-blue">
                  {hotel.specialNote && (
                    <div className="mb-4 p-3 bg-pacific-cyan/10 rounded-lg border border-pacific-cyan/20">
                      <p className="font-inter text-sm text-pacific-cyan font-medium">
                        {hotel.specialNote}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-poppins text-lg font-semibold text-navy-blue">
                        {hotel.price}
                      </p>
                      {hotel.contact && (
                        <div className="space-y-1 mt-1">
                          {hotel.contact.includes('@') ? (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 text-sky-blue mr-1 flex-shrink-0" />
                              <button
                                onClick={() => window.open(`mailto:${hotel.contact}?subject=Wedding Group Booking - David Geiermann Wedding Group`, '_blank')}
                                className="font-inter text-sm text-sky-blue hover:text-ocean-blue underline transition-colors duration-200 break-all"
                              >
                                {hotel.contact}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 text-sky-blue mr-1 flex-shrink-0" />
                              <span className="font-inter text-sm text-deep-blue/70">{hotel.contact}</span>
                            </div>
                          )}
                          {hotel.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 text-sky-blue mr-1 flex-shrink-0" />
                              <span className="font-inter text-sm text-deep-blue/70">{hotel.phone}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                      {hotel.bookingLink ? (
                        <Button 
                          onClick={() => window.open(hotel.bookingLink, '_blank')}
                          className="bg-gradient-to-r from-sky-blue to-ocean-blue hover:from-ocean-blue hover:to-navy-blue text-white font-medium px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          Book Now
                        </Button>
                      ) : hotel.contact && hotel.contact.includes('@') ? (
                        <Button 
                          onClick={() => {
                            const subject = hotel.name === 'The Oceanic Sportel' 
                              ? 'Wedding Group Booking - David Geiermann Wedding Group'
                              : 'Wedding Group Booking - DAVIDWED2026';
                            const body = hotel.name === 'The Oceanic Sportel'
                              ? 'Hello,%0A%0AI would like to book a room under the David Geiermann wedding group for January 31 - February 1, 2026.%0A%0APlease provide booking details and payment options.%0A%0AThank you!'
                              : 'Hello,%0A%0AI would like to book a room under the wedding group rate DAVIDWED2026 for January 31 - February 1, 2026.%0A%0APlease provide booking details and payment options.%0A%0AThank you!';
                            window.open(`mailto:${hotel.contact}?subject=${subject}&body=${body}`, '_blank');
                          }}
                          className="bg-gradient-to-r from-sky-blue to-ocean-blue hover:from-ocean-blue hover:to-navy-blue text-white font-medium px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          Book by Email
                        </Button>
                      ) : null}
                      
                      {hotel.mapLink && (
                        <Button 
                          onClick={() => window.open(hotel.mapLink, '_blank')}
                          className="bg-white border-2 border-sky-blue text-sky-blue hover:bg-sky-blue hover:text-white font-medium px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          View Map
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default AccommodationSection;
