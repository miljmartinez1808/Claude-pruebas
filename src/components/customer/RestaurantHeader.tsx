'use client'

import { MapPin, Clock } from 'lucide-react'
import { Restaurant } from '@/types'
import { isRestaurantOpen } from '@/lib/utils'
import Image from 'next/image'

interface Props {
  restaurant: Restaurant
}

export default function RestaurantHeader({ restaurant }: Props) {
  const open = isRestaurantOpen(restaurant.hours_open, restaurant.hours_close, restaurant.is_open)

  return (
    <div className="relative">
      {/* Banner */}
      <div className="relative h-44 w-full bg-gray-800 overflow-hidden">
        {restaurant.banner_url ? (
          <Image
            src={restaurant.banner_url}
            alt={restaurant.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(135deg, ${restaurant.primary_color}88, ${restaurant.primary_color}22)` }}
          />
        )}
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              open
                ? 'bg-white text-green-600'
                : 'bg-white text-red-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${open ? 'bg-green-500' : 'bg-red-500'}`} />
            {open ? 'Abierto' : 'Cerrado'}
          </span>
        </div>
      </div>

      {/* Logo circle */}
      <div className="absolute -bottom-8 left-4">
        <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
          {restaurant.logo_url ? (
            <Image
              src={restaurant.logo_url}
              alt={`Logo ${restaurant.name}`}
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: restaurant.primary_color }}
            >
              {restaurant.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="pt-12 px-4 pb-3 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
        {restaurant.description && (
          <p className="text-gray-500 text-sm mt-0.5">{restaurant.description}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
          {restaurant.address && (
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {restaurant.address}
            </span>
          )}
          {restaurant.hours_open && restaurant.hours_close && (
            <span className="flex items-center gap-1">
              <Clock size={14} /> {restaurant.hours_open} - {restaurant.hours_close}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
