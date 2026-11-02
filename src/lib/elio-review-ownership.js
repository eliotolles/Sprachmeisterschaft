/** Shared Elio review forks must always remain private to their owner. */
export function keepOtherAccountElioReview(card, currentUserId) {
  return String(card?.id ?? '').startsWith('elio_shared_') &&
    card.user_id !== (currentUserId || 'usr_student');
}
