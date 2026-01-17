
import React from 'react';
import { Clock, Waves, Sun, Star, Heart, Camera } from 'lucide-react';

const EventSchedule = () => {
  const events = [
    {
      time: '3:00 PM',
      title: 'Guest Arrival',
      description: 'Please arrive by 3:00 PM for welcome cocktails',
      icon: Waves,
      color: 'from-light-cyan to-pacific-cyan'
    }
  ];

  return (
    <section
      id="schedule"
      className="py-12 md:py-20 px-4"
      style={{
        background: 'linear-gradient(135deg, #CAF0F8 0%, #90E0EF 30%, #DBEAFE 70%, #F0F9FF 100%)'
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-dancing text-5xl md:text-6xl font-bold text-deep-blue mb-4">
            Our Wedding Day
          </h2>
          <p className="font-poppins text-xl text-navy-blue">
            January 31, 2026 • COMO Point Yamu, Phuket
          </p>
          <div className="flex items-center justify-center mt-6 space-x-4">
            <Waves className="w-5 h-5 text-pacific-cyan animate-wave" />
            <div className="w-24 h-1 bg-gradient-to-r from-pacific-cyan to-federal-blue rounded-full"></div>
            <Waves className="w-5 h-5 text-federal-blue animate-wave" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        <div className="flex justify-center max-w-2xl mx-auto">
          {events.map((event, index) => (
            <div
              key={index}
              className="floating-card p-6 md:p-8 text-center hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br ${event.color} flex items-center justify-center shadow-lg`}>
                <event.icon className="w-8 h-8 text-white" />
              </div>
              
              <div className="flex items-center justify-center mb-4">
                <Clock className="w-4 h-4 text-pacific-cyan mr-2" />
                <span className="font-poppins text-lg font-semibold text-navy-blue">
                  {event.time}
                </span>
              </div>
              
              <h3 className="font-poppins text-xl font-bold text-deep-blue mb-3 wave-border">
                {event.title}
              </h3>
              
              <p className="font-inter text-navy-blue/80 leading-relaxed">
                {event.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="floating-card p-6 max-w-2xl mx-auto">
            <Star className="w-8 h-8 text-pacific-cyan mx-auto mb-3" />
            <p className="font-inter text-navy-blue/80 italic">
              Detailed schedule with reception, dinner, and celebration timings will be shared closer to the wedding date
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default EventSchedule;
