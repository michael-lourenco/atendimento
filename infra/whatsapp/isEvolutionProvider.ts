export function isEvolutionProvider(): boolean {
  return (process.env.WHATSAPP_PROVIDER || 'meta').toLowerCase() === 'evolution';
}
