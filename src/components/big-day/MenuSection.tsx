'use client'

import React, { useState } from 'react'
import { Wine, UtensilsCrossed, GlassWater } from 'lucide-react'
import MenuCard from './MenuCard'
import MenuModal from './MenuModal'

interface MenuConfig {
  id: string
  title: string
  subtitle?: string
  imagePath: string
  unlockHour: number
  unlockMinute: number
  icon: typeof Wine
}

const menus: MenuConfig[] = [
  {
    id: 'cocktails',
    title: 'Cocktails',
    subtitle: 'Cocktail Hour (4:30 - 6:30 PM)',
    imagePath: '/menu/cocktail.png',
    unlockHour: 16, // 4:30 PM
    unlockMinute: 30,
    icon: Wine,
  },
  {
    id: 'food',
    title: 'Food Menu',
    subtitle: 'Dinner (from 6:30 PM)',
    imagePath: '/menu/food-menu.png',
    unlockHour: 18, // 6:30 PM
    unlockMinute: 30,
    icon: UtensilsCrossed,
  },
  {
    id: 'drinks',
    title: 'Drinks',
    subtitle: 'Dinner (from 6:30 PM)',
    imagePath: '/menu/drink-menu.png',
    unlockHour: 18, // 6:30 PM
    unlockMinute: 30,
    icon: GlassWater,
  },
]

const MenuSection: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<MenuConfig | null>(null)

  return (
    <div className="w-full mt-8">
      {/* Section heading */}
      <div className="text-center mb-6">
        <h2 className="font-dancing text-3xl md:text-4xl italic text-ocean-blue">
          Today's Menus
        </h2>
        <p className="text-deep-blue/70 mt-2 text-sm">
          Menus unlock at their scheduled times
        </p>
      </div>

      {/* Menu cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {menus.map((menu) => (
          <MenuCard
            key={menu.id}
            title={menu.title}
            subtitle={menu.subtitle}
            imagePath={menu.imagePath}
            unlockHour={menu.unlockHour}
            unlockMinute={menu.unlockMinute}
            icon={menu.icon}
            onClick={() => setOpenMenu(menu)}
          />
        ))}
      </div>

      {/* Menu modal */}
      {openMenu && (
        <MenuModal
          isOpen={!!openMenu}
          onClose={() => setOpenMenu(null)}
          title={openMenu.title}
          imagePath={openMenu.imagePath}
        />
      )}
    </div>
  )
}

export default MenuSection
