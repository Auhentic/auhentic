const hits = new Map();

setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits.entries()) {
        const fresh = timestamps.filter((t) => now - t < 15 * 60 * 1000);
        if (fresh.length === 0) hits.delete(key);
        else hits.set(key, fresh);
    }
}, 10 * 60 * 1000);

export function checkRateLimit(key, limit, windowMs) {
    const now = Date.now();
    const timestamps = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (timestamps.length >= limit) {
        const retryAfterSeconds = Math.ceil((windowMs - (now - timestamps[0])) / 1000);
        return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    timestamps.push(now);
    hits.set(key, timestamps);
    return { allowed: true, remaining: limit - timestamps.length, retryAfterSeconds: 0 };
}

export function getClientIp(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.headers.get('x-real-ip') || 'unknown';
}