import Navigation from '@/components/sections/Navigation'
import HeroSection from '@/components/sections/HeroSection'
import WelcomeSection from '@/components/sections/WelcomeSection'
import EventSchedule from '@/components/sections/EventSchedule'
import LogisticsSection from '@/components/sections/LogisticsSection'
import AccommodationSection from '@/components/sections/AccommodationSection'
import ContactSection from '@/components/sections/ContactSection'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white via-pale-blue/20 to-pale-blue/10 relative">
      {/* Subtle ocean texture overlay */}
      <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-sky-blue/10 to-navy-blue/5 pointer-events-none" />
      <Navigation />
      <main>
        <HeroSection />
        <WelcomeSection />
        <EventSchedule />
        <LogisticsSection />
        <AccommodationSection />
        <ContactSection />
      </main>
    </div>
  )
}
