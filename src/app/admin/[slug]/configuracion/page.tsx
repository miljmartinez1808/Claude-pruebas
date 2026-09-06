'use client'

import { useEffect, useState, use, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Restaurant, BusinessHours, DaySchedule } from '@/types'
import { Save, Store, Clock, CreditCard, Link2, ImagePlus, Loader2, X } from 'lucide-react'

// ─── Sub-components defined OUTSIDE to avoid remount on every keystroke ────────

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <Icon size={18} className="text-yellow-500" />
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
    />
  )
}

// ─── Image upload field ────────────────────────────────────────────────────────

interface ImageUploadFieldProps {
  label: string
  url: string
  onChange: (url: string) => void
  restaurantId: string
  pathKey: string
  aspectClass?: string
  rounded?: boolean
}

function ImageUploadField({
  label, url, onChange, restaurantId, pathKey, aspectClass = 'h-28', rounded = false,
}: ImageUploadFieldProps) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `restaurants/${restaurantId}/${pathKey}.${ext}`
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      onChange(data.publicUrl)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const roundedClass = rounded ? 'rounded-full' : 'rounded-xl'

  return (
    <Field label={label}>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />
      {url ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className={`${aspectClass} ${roundedClass} object-cover border border-gray-200`} />
          <div className={`absolute inset-0 flex items-center justify-center gap-2 bg-black/40 ${roundedClass} opacity-0 hover:opacity-100 transition-opacity`}>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow">
              {uploading ? 'Subiendo...' : 'Cambiar'}
            </button>
            <button type="button" onClick={() => onChange('')}
              className="bg-red-500 text-white text-xs font-semibold p-1.5 rounded-lg shadow">
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className={`w-full ${aspectClass} border-2 border-dashed border-gray-200 ${roundedClass} flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors`}>
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
          <span className="text-xs">{uploading ? 'Subiendo...' : 'Toca para subir imagen'}</span>
        </button>
      )}
    </Field>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  { label: 'Amarillo', value: '#FBBF24' },
  { label: 'Rojo',     value: '#EF4444' },
  { label: 'Verde',    value: '#22C55E' },
  { label: 'Azul',     value: '#3B82F6' },
  { label: 'Naranja',  value: '#F97316' },
  { label: 'Violeta',  value: '#8B5CF6' },
  { label: 'Rosa',     value: '#EC4899' },
  { label: 'Negro',    value: '#111827' },
]

const DAYS: { key: keyof BusinessHours; label: string; short: string }[] = [
  { key: 'mon', label: 'Lunes',     short: 'L' },
  { key: 'tue', label: 'Martes',    short: 'M' },
  { key: 'wed', label: 'Miércoles', short: 'X' },
  { key: 'thu', label: 'Jueves',    short: 'J' },
  { key: 'fri', label: 'Viernes',   short: 'V' },
  { key: 'sat', label: 'Sábado',    short: 'S' },
  { key: 'sun', label: 'Domingo',   short: 'D' },
]

const DEFAULT_SCHEDULE: DaySchedule = { open: '08:00', close: '22:00', closed: false }

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  mon: { ...DEFAULT_SCHEDULE },
  tue: { ...DEFAULT_SCHEDULE },
  wed: { ...DEFAULT_SCHEDULE },
  thu: { ...DEFAULT_SCHEDULE },
  fri: { ...DEFAULT_SCHEDULE },
  sat: { ...DEFAULT_SCHEDULE },
  sun: { open: '08:00', close: '22:00', closed: true },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>
}

export default function ConfiguracionPage({ params }: Props) {
  const { slug } = use(params)
  const supabase = createClient()

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#FBBF24')
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [nequiNumber, setNequiNumber] = useState('')
  const [nequiQrUrl, setNequiQrUrl] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['efectivo'])
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS)

  useEffect(() => {
    supabase.from('restaurants').select('*').eq('slug', slug).single().then(({ data }) => {
      if (!data) return
      setRestaurant(data)
      setName(data.name || '')
      setDescription(data.description || '')
      setAddress(data.address || '')
      setPhone(data.phone || '')
      setWhatsapp(data.whatsapp_number || '')
      setIsOpen(data.is_open)
      setPrimaryColor(data.primary_color || '#FBBF24')
      setLogoUrl(data.logo_url || '')
      setBannerUrl(data.banner_url || '')
      setNequiNumber(data.nequi_number || '')
      setNequiQrUrl(data.nequi_qr_url || '')
      setBankAccount(data.bank_account || '')
      setPaymentMethods(data.payment_methods || ['efectivo'])
      // Load business_hours, fall back to building from hours_open/hours_close
      if (data.business_hours) {
        setBusinessHours(data.business_hours)
      } else if (data.hours_open && data.hours_close) {
        // Migrate: apply existing hours to all days except Sunday
        const migrated: BusinessHours = {
          mon: { open: data.hours_open, close: data.hours_close, closed: false },
          tue: { open: data.hours_open, close: data.hours_close, closed: false },
          wed: { open: data.hours_open, close: data.hours_close, closed: false },
          thu: { open: data.hours_open, close: data.hours_close, closed: false },
          fri: { open: data.hours_open, close: data.hours_close, closed: false },
          sat: { open: data.hours_open, close: data.hours_close, closed: false },
          sun: { open: data.hours_open, close: data.hours_close, closed: true },
        }
        setBusinessHours(migrated)
      }
    })
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateDay = (key: keyof BusinessHours, field: keyof DaySchedule, value: string | boolean) => {
    setBusinessHours((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  const togglePayment = (method: string) => {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    )
  }

  const handleSave = async () => {
    if (!restaurant) return
    setSaving(true)
    await supabase.from('restaurants').update({
      name: name.trim(),
      description: description.trim() || null,
      address: address.trim() || null,
      phone: phone.trim() || null,
      whatsapp_number: whatsapp.trim(),
      is_open: isOpen,
      primary_color: primaryColor,
      logo_url: logoUrl.trim() || null,
      banner_url: bannerUrl.trim() || null,
      nequi_number: nequiNumber.trim() || null,
      nequi_qr_url: nequiQrUrl.trim() || null,
      bank_account: bankAccount.trim() || null,
      payment_methods: paymentMethods,
      business_hours: businessHours,
    }).eq('id', restaurant.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const menuUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-white text-sm font-semibold disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
        </button>
      </div>

      {/* Enlace del menú */}
      <Section icon={Link2} title="Tu enlace de menú">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
          <span className="text-sm text-blue-500 truncate flex-1">{menuUrl}</span>
          <button
            onClick={() => navigator.clipboard.writeText(menuUrl)}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium whitespace-nowrap"
          >
            Copiar
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Comparte este enlace con tus clientes o ponlo en tu QR</p>
      </Section>

      {/* Información del negocio */}
      <Section icon={Store} title="Información del negocio">
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-sm text-gray-800">Estado del negocio</p>
            <p className="text-xs text-gray-500">Activa para permitir pedidos (independiente del horario)</p>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative w-12 h-6 rounded-full transition-colors ${isOpen ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isOpen ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>

        <Field label="Nombre del negocio *">
          <Input value={name} onChange={setName} placeholder="Max Sabor Fast Food" />
        </Field>
        <Field label="Descripción">
          <Input value={description} onChange={setDescription} placeholder="Las mejores salchipapas de la ciudad" />
        </Field>
        <Field label="Dirección">
          <Input value={address} onChange={setAddress} placeholder="Calle 58C # 23A - 57" />
        </Field>
        <Field label="Teléfono">
          <Input value={phone} onChange={setPhone} type="tel" placeholder="3001234567" />
        </Field>
        <Field label="WhatsApp (número donde llegan los pedidos) *">
          <Input value={whatsapp} onChange={setWhatsapp} type="tel" placeholder="3001234567" />
        </Field>
      </Section>

      {/* Horario por día */}
      <Section icon={Clock} title="Horario de atención">
        <p className="text-xs text-gray-400 mb-3">Configura el horario para cada día. Los días marcados como cerrado no recibirán pedidos ese día.</p>
        <div className="flex flex-col gap-2">
          {DAYS.map(({ key, label }) => {
            const day = businessHours[key]
            return (
              <div key={key} className={`rounded-lg border p-3 transition-colors ${day.closed ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium text-sm ${day.closed ? 'text-gray-400' : 'text-gray-800'}`}>{label}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={day.closed}
                      onChange={(e) => updateDay(key, 'closed', e.target.checked)}
                      className="accent-red-400 w-4 h-4"
                    />
                    <span className={day.closed ? 'text-red-400 font-semibold' : 'text-gray-400'}>Cerrado</span>
                  </label>
                </div>
                {!day.closed && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Apertura</p>
                      <input
                        type="time"
                        value={day.open}
                        onChange={(e) => updateDay(key, 'open', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Cierre</p>
                      <input
                        type="time"
                        value={day.close}
                        onChange={(e) => updateDay(key, 'close', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      {/* Apariencia */}
      <Section icon={Store} title="Apariencia">
        <ImageUploadField
          label="Banner (imagen de fondo)"
          url={bannerUrl}
          onChange={setBannerUrl}
          restaurantId={restaurant.id}
          pathKey="banner"
          aspectClass="h-28 w-full"
          rounded={false}
        />
        <div className="flex items-end gap-4 mb-3">
          <div className="flex-shrink-0">
            <ImageUploadField
              label="Logo del negocio"
              url={logoUrl}
              onChange={setLogoUrl}
              restaurantId={restaurant.id}
              pathKey="logo"
              aspectClass="h-20 w-20"
              rounded={true}
            />
          </div>
          {logoUrl && (
            <p className="text-xs text-gray-400 mb-1">Toca la imagen para cambiarla</p>
          )}
        </div>
        <Field label="Color principal">
          <div className="flex flex-wrap gap-2 mt-1">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setPrimaryColor(c.value)}
                title={c.label}
                className={`w-8 h-8 rounded-full border-2 transition-all ${primaryColor === c.value ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                style={{ background: c.value }}
              />
            ))}
          </div>
        </Field>
      </Section>

      {/* Formas de pago */}
      <Section icon={CreditCard} title="Formas de pago">
        <Field label="Métodos habilitados">
          <div className="flex gap-3">
            {['efectivo', 'transferencia'].map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer text-sm capitalize text-gray-700">
                <input
                  type="checkbox"
                  checked={paymentMethods.includes(m)}
                  onChange={() => togglePayment(m)}
                  className="accent-yellow-400 w-4 h-4"
                />
                {m}
              </label>
            ))}
          </div>
        </Field>
        {paymentMethods.includes('transferencia') && (
          <>
            <Field label="Número Nequi / Daviplata">
              <Input value={nequiNumber} onChange={setNequiNumber} placeholder="3001234567" />
            </Field>
            <ImageUploadField
              label="QR de Nequi / Daviplata"
              url={nequiQrUrl}
              onChange={setNequiQrUrl}
              restaurantId={restaurant.id}
              pathKey="nequi-qr"
              aspectClass="h-48 w-48"
              rounded={false}
            />
            <Field label="Datos bancarios (opcional)">
              <Input value={bankAccount} onChange={setBankAccount} placeholder="Bancolombia 123-456789-00" />
            </Field>
          </>
        )}
      </Section>

      <div className="pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-yellow-400 text-white font-bold disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
