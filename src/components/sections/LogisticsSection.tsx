
import React from 'react';
import { Plane, CloudSun, Shirt, Car, Waves, Info } from 'lucide-react';

const LogisticsSection = () => {
  const logisticsInfo = [
    {
      icon: Plane,
      title: 'Getting There',
      details: [
        'Fly into Phuket International Airport (HKT)',
        'COMO Point Yamu is 30-45 minutes from airport',
        'Taxi/Grab approximately 1,200-1,500 THB'
      ],
      color: 'from-sky-blue to-light-blue'
    },
    {
      icon: CloudSun,
      title: 'Weather & What to Expect',
      details: [
        'January is perfect weather in Phuket',
        'Temperature: 25-30°C (77-86°F)',
        'Minimal rainfall, gentle ocean breeze'
      ],
      color: 'from-pacific-cyan to-honolulu-blue'
    }
  ];

  return (
    <section id="logistics" className="py-12 md:py-20 px-4 bg-gradient-to-br from-pale-blue/30 to-soft-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-dancing text-5xl md:text-6xl font-bold italic text-ocean-gradient mb-4">
            Travel & Logistics
          </h2>
          <p className="font-poppins text-xl text-deep-blue/80 max-w-2xl mx-auto">
            Everything you need to know for your journey to paradise
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-sky-blue to-navy-blue rounded-full mx-auto mt-6"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {logisticsInfo.map((info, index) => (
            <div
              key={index}
              className="floating-card p-6 md:p-8 hover:scale-102 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br ${info.color} flex items-center justify-center shadow-lg`}>
                <info.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="font-poppins text-xl font-bold text-deep-blue mb-6 text-center wave-border">
                {info.title}
              </h3>
              
              <ul className="space-y-3">
                {info.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="flex items-start">
                    <div className="w-2 h-2 bg-sky-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="font-inter text-deep-blue/80 leading-relaxed">
                      {detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default LogisticsSection;
