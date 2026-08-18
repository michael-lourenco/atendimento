const GROUP_OR_BROADCAST = /@(g\.us|broadcast|newsletter)$/i;
const DIRECT_CONTACT = /@(s\.whatsapp\.net|c\.us|lid)$/i;

export function isDirectContactJid(remoteJid: string | undefined | null): boolean {
  if (!remoteJid) {
    return false;
  }
  const jid = remoteJid.trim();
  if (!jid) {
    return false;
  }
  if (GROUP_OR_BROADCAST.test(jid)) {
    return false;
  }
  if (DIRECT_CONTACT.test(jid)) {
    return true;
  }
  return !jid.includes('@');
}
