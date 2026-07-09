export function isOfferActive(offer) {
    if (!offer?.isOnOffer) return false;
    if (!offer.expiresAt) return true;
    return new Date(offer.expiresAt).getTime() > Date.now();
}