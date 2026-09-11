'use client';

import { Calendar, Check, Home, MapPin, Store } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { appointmentReasons, slotsForDate } from '@/config/appointments';
import { devices } from '@/config/services';
import { createClient } from '@/lib/supabase/client';
import {
  fetchTakenAppointmentSlots,
  insertAppointmentPublic,
  type AppointmentIntakeValues,
} from '@/lib/supabase/queries';
import { cn, todayISO, whatsappLink } from '@/lib/utils';
import type { Appointment } from '@/types/database';

function formatDateLabel(dateISO: string): string {
  const label = new Date(`${dateISO}T12:00:00`).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Arma el mensaje de WhatsApp de la cita — mismo estilo que
 * `buildOrderMessage` en `cart-drawer.tsx` (negritas, separadores, emoji).
 * El cliente lo manda él mismo: nada se envía automático.
 */
function buildAppointmentMessage(appt: Appointment): string {
  return (
    `🐸 *SURF CAFE PC STORE*\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `📅 *Nueva cita agendada*\n\n` +
    `👤 ${appt.customer_name}\n` +
    `📱 ${appt.customer_phone}\n` +
    `🗓️ ${formatDateLabel(appt.date)} — ${appt.time_slot}\n` +
    `💻 ${appt.device_type}\n` +
    `🔧 ${appt.service_type}\n` +
    (appt.notes ? `📝 ${appt.notes}\n` : '') +
    `📍 ${appt.home_pickup ? `Recolección a domicilio: ${appt.address}` : 'Lo llevo a la tienda'}\n\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `_¿Me confirman que la cita queda en pie? ¡Gracias!_`
  );
}

const inputClass =
  'clip-hud-sm w-full border border-surface-grey bg-surface-metal/70 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-surf-green';

export function AppointmentForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deviceType, setDeviceType] = useState(devices[0].label);
  const [reason, setReason] = useState(appointmentReasons[0]);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [homePickup, setHomePickup] = useState(false);
  const [address, setAddress] = useState('');

  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!date) {
      setTakenSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setTimeSlot('');
    fetchTakenAppointmentSlots(createClient(), date).then((slots) => {
      if (!cancelled) {
        setTakenSlots(slots);
        setLoadingSlots(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const availableSlots = useMemo(() => {
    if (!date) return [];
    const now = new Date();
    const isToday = date === todayISO();
    return slotsForDate(date).filter((slot) => {
      if (takenSlots.includes(slot)) return false;
      if (!isToday) return true;
      const [h, m] = slot.split(':').map(Number);
      const slotTime = new Date();
      slotTime.setHours(h, m, 0, 0);
      return slotTime > now;
    });
  }, [date, takenSlots]);

  const isSunday = date !== '' && slotsForDate(date).length === 0;

  function resetForm() {
    setName('');
    setPhone('');
    setEmail('');
    setDeviceType(devices[0].label);
    setReason(appointmentReasons[0]);
    setNotes('');
    setDate('');
    setTimeSlot('');
    setHomePickup(false);
    setAddress('');
    setCreated(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !date || !timeSlot) return;
    if (homePickup && !address.trim()) {
      setError('Escribe la dirección para la recolección.');
      return;
    }

    setError(null);
    setSaving(true);

    const values: AppointmentIntakeValues = {
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim() || null,
      device_type: deviceType,
      service_type: reason,
      date,
      time_slot: timeSlot,
      home_pickup: homePickup,
      address: homePickup ? address.trim() : null,
      notes: notes.trim() || null,
    };

    try {
      const appt = await insertAppointmentPublic(createClient(), values);
      setCreated(appt);
    } catch (err) {
      const message = err && typeof err === 'object' ? (err as { message?: string }).message : '';
      if (message?.includes('duplicate key') || message?.includes('unique')) {
        setError('Ese horario se acaba de ocupar. Elige otro.');
        fetchTakenAppointmentSlots(createClient(), date).then(setTakenSlots);
        setTimeSlot('');
      } else {
        setError('No se pudo agendar. Intenta de nuevo o escríbenos por WhatsApp.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <div className="hud-panel p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-surf-green/40 bg-surf-green/10">
          <Check className="h-7 w-7 text-surf-green" />
        </div>
        <h2 className="font-display text-xl font-bold uppercase">Tu cita quedó registrada</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {formatDateLabel(created.date)} a las {created.time_slot}. Para terminar, manda el
          mensaje que ya te dejamos armado — así lo confirmamos directo contigo.
        </p>

        <a
          href={whatsappLink(buildAppointmentMessage(created))}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-neon mt-6 inline-flex px-6 py-3"
        >
          Confirmar por WhatsApp
        </a>

        <button
          type="button"
          onClick={resetForm}
          className="mt-4 block w-full font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-surf-green"
        >
          Agendar otra cita
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="hud-panel space-y-6 p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="hud-label mb-2 block">Nombre</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Ana López"
          />
        </label>
        <label className="block">
          <span className="hud-label mb-2 block">Teléfono</span>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="3141234567"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="hud-label mb-2 block">Correo (opcional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="ana@correo.com"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="hud-label mb-2 block">Tipo de equipo</span>
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className={inputClass}
          >
            {devices.map((d) => (
              <option key={d.id} value={d.label}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="hud-label mb-2 block">Motivo</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputClass}
          >
            {appointmentReasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="hud-label mb-2 block">Cuéntanos qué le pasa (opcional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={cn(inputClass, 'resize-y')}
          placeholder="No prende, hace ruido, va lento…"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="hud-label mb-2 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Fecha
          </span>
          <input
            type="date"
            required
            min={todayISO()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="hud-label mb-2 block">Hora</span>
          <select
            required
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            disabled={!date || isSunday || availableSlots.length === 0}
            className={cn(inputClass, 'disabled:opacity-40')}
          >
            <option value="" disabled>
              {!date
                ? 'Elige una fecha primero'
                : isSunday
                  ? 'Cerrado los domingos'
                  : loadingSlots
                    ? 'Buscando horarios…'
                    : availableSlots.length === 0
                      ? 'No quedan horarios ese día'
                      : 'Selecciona un horario'}
            </option>
            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="hud-label mb-2 block">¿Cómo prefieres?</span>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setHomePickup(false)}
            className={cn(
              'clip-hud-sm flex items-center gap-2 border px-4 py-3 text-sm transition-colors',
              !homePickup
                ? 'border-surf-green bg-surf-green/10 text-surf-green'
                : 'border-surface-grey text-foreground/60 hover:border-surf-green/40'
            )}
          >
            <Store className="h-4 w-4" />
            Lo llevo a la tienda
          </button>
          <button
            type="button"
            onClick={() => setHomePickup(true)}
            className={cn(
              'clip-hud-sm flex items-center gap-2 border px-4 py-3 text-sm transition-colors',
              homePickup
                ? 'border-surf-green bg-surf-green/10 text-surf-green'
                : 'border-surface-grey text-foreground/60 hover:border-surf-green/40'
            )}
          >
            <Home className="h-4 w-4" />
            Que pasen por él
          </button>
        </div>

        {homePickup && (
          <label className="mt-3 block">
            <span className="hud-label mb-2 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Dirección
            </span>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
              placeholder="Calle, número, colonia…"
            />
          </label>
        )}
      </div>

      {error && (
        <p role="alert" className="border-l-2 border-destructive bg-destructive/10 p-4 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className={cn('btn-neon w-full py-3.5', saving && 'pointer-events-none opacity-60')}
      >
        {saving ? 'Agendando…' : 'Agendar cita'}
      </button>
    </form>
  );
}
