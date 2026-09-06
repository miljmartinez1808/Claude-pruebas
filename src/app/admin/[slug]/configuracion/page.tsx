'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Restaurant } from '@/types'
import { Save, Store, Clock, CreditCard, Bell, Link2 } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

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

export default function ConfiguracionPage({ params }: Props) {
  const { slug } = use(params)
  const supabase = createClient()

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [hoursOpen, setHoursOpen] = useState('')
  const [hoursClose, setHoursClose] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#FBBF24')
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [nequiNumber, setNequiNumber] = useState('')
  const [nequiQrUrl, setNequiQrUrl] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['efectivo'])

  useEffect(() => {
    supabase.from('restaurants').select('*').eq('slug', slug).single().then(({ data }) => {
      if (!data) return
      setRestaurant(data)
      setName(data.name || '')
      setDescription(data.description || '')
      setAddress(data.address || '')
      setPhone(data.phone || '')
      setWhatsapp(data.whatsapp_number || '')
      setHoursOpen(data.hours_open || '')
      setHoursClose(data.hours_close || '')
      setIsOpen(data.is_open)
      setPrimaryColor(data.primary_color || '#FBBF24')
      setLogoUrl(data.logo_url || '')
      setBannerUrl(data.banner_url || '')
      setNequiNumber(data.nequi_number || '')
      setNequiQrUrl(data.nequi_qr_url || '')
      setBankAccount(data.bank_account || '')
      setPaymentMethods(data.payment_methods || ['efectivo'])
    })
  }, [slug])

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
      hours_open: hoursOpen || null,
      hours_close: hoursClose || null,
      is_open: isOpen,
      primary_color: primaryColor,
      logo_url: logoUrl.trim() || null,
      banner_url: bannerUrl.trim() || null,
      nequi_number: nequiNumber.trim() || null,
      nequi_qr_url: nequiQrUrl.trim() || null,
      bank_account: bankAccount.trim() || null,
      payment_methods: paymentMethods,
    }).eq('id', restaurant.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const menuUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <Icon size={18} className="text-yellow-500" />
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  )

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )

  const Input = ({ value, onChange, placeholder, type = 'text' }: {
    value: string; onChange: (v: string) => void; placeholder?: string; type?: string
  }) => (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
    />
  )

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

      {/* Link del menú */}
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

      {/* Estado */}
      <Section icon={Store} title="Información del negocio">
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-sm text-gray-800">Estado del negocio</p>
            <p className="text-xs text-gray-500">Tus clientes verán si estás abierto o cerrado</p>
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

      {/* Horario */}
      <Section icon={Clock} title="Horario de atención">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hora apertura">
            <Input value={hoursOpen} onChange={setHoursOpen} type="time" />
          </Field>
          <Field label="Hora cierre">
            <Input value={hoursClose} onChange={setHoursClose} type="time" />
          </Field>
        </div>
      </Section>

      {/* Apariencia */}
      <Section icon={Store} title="Apariencia">
        <Field label="URL del banner (imagen de fondo)">
          <Input value={bannerUrl} onChange={setBannerUrl} placeholder="https://..." />
        </Field>
        <Field label="URL del logo">
          <Input value={logoUrl} onChange={setLogoUrl} placeholder="https://..." />
        </Field>
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

      {/* Pagos */}
      <Section icon={CreditCard} title="Formas de pago">
        <Field label="Métodos habilitados">
          <div className="flex gap-3">
            {['efectivo', 'transferencia'].map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer text-sm capitalize">
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
            <Field label="Número Nequi">
              <Input value={nequiNumber} onChange={setNequiNumber} placeholder="3001234567" />
            </Field>
            <Field label="URL del QR de Nequi (opcional)">
              <Input value={nequiQrUrl} onChange={setNequiQrUrl} placeholder="https://..." />
            </Field>
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
