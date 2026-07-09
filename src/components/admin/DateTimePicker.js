'use client';
import { useMemo } from 'react';

// Native <input type="datetime-local"> renders an OS-level spinner whose
// touch targets can get misaligned on some Android/Chrome versions —
// that's the "click 5, get 11 / click PM, get AM" bug. Swapping it for
// plain <select> dropdowns removes that native widget entirely, so every
// tap always lands on the value it shows, on every device.
//
// value / onChange work with a plain ISO string (or '' for empty), same
// contract as the datetime-local input it replaces — drop-in swap.
export default function DateTimePicker({ value, onChange, className = '' }) {
    const parsed = useMemo(() => {
        if (!value) return null;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }, [value]);

    const dateStr = parsed
        ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
        : '';

    let hour12 = 12;
    let minute = 0;
    let ampm = 'AM';
    if (parsed) {
        const h24 = parsed.getHours();
        ampm = h24 >= 12 ? 'PM' : 'AM';
        hour12 = h24 % 12;
        if (hour12 === 0) hour12 = 12;
        minute = parsed.getMinutes();
    }

    function emit({ nextDateStr = dateStr, nextHour12 = hour12, nextMinute = minute, nextAmpm = ampm }) {
        if (!nextDateStr) {
            onChange('');
            return;
        }
        const [y, mo, da] = nextDateStr.split('-').map(Number);
        let h24 = nextAmpm === 'PM' ? (nextHour12 % 12) + 12 : nextHour12 % 12;
        const d = new Date(y, mo - 1, da, h24, nextMinute, 0, 0);
        onChange(d.toISOString());
    }

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
        <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
            <input
                type="date"
                value={dateStr}
                onChange={(e) => emit({ nextDateStr: e.target.value })}
                className="glass-input rounded-3xl w-13"
            />
            <div className="flex gap-2">
                <select
                    value={hour12}
                    onChange={(e) => emit({ nextHour12: Number(e.target.value) })}
                    disabled={!dateStr}
                    className="glass-inputs rounded-3xl disabled:opacity-40"
                >
                    {hours.map((h) => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                    ))}
                </select>
                <select
                    value={minute}
                    onChange={(e) => emit({ nextMinute: Number(e.target.value) })}
                    disabled={!dateStr}
                    className="glass-inputs rounded-3xl disabled:opacity-40"
                >
                    {minutes.map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                </select>
                <select
                    value={ampm}
                    onChange={(e) => emit({ nextAmpm: e.target.value })}
                    disabled={!dateStr}
                    className="glass-inputs rounded-3xl disabled:opacity-40"
                >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>
        </div>
    );
}
