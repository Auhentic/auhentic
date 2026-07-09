export function getVisitorId() {
    const match = document.cookie.match(/(?:^|; )visitor_id=([^;]+)/);
    if (match) return match[1];
    const id = crypto.randomUUID();
    document.cookie = `visitor_id=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    return id;
}