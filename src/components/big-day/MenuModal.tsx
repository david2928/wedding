'use client'

import React from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface MenuModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  imagePath: string
}

const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  title,
  imagePath,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-auto p-0 !bg-transparent border-none shadow-none"
      >
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full">
          <Image
            src={imagePath}
            alt={title}
            width={800}
            height={1200}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MenuModal
