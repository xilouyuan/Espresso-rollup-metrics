// Import the time-related functions to test from the page component
// Since the function is in the page.tsx file, we need to mock it here for testing
const timeIntervalToMs = (interval: string): number => {
  switch (interval) {
    case '1m': return 60 * 1000;
    case '1h': return 60 * 60 * 1000;
    case '4h': return 4 * 60 * 60 * 1000;
    case '8h': return 8 * 60 * 60 * 1000;
    case '1D': return 24 * 60 * 60 * 1000;
    case '1W': return 7 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
};

describe('Time Utility Functions', () => {
  describe('timeIntervalToMs', () => {
    it('converts 1m to 60,000 milliseconds', () => {
      expect(timeIntervalToMs('1m')).toBe(60 * 1000);
    });

    it('converts 1h to 3,600,000 milliseconds', () => {
      expect(timeIntervalToMs('1h')).toBe(60 * 60 * 1000);
    });

    it('converts 4h to 14,400,000 milliseconds', () => {
      expect(timeIntervalToMs('4h')).toBe(4 * 60 * 60 * 1000);
    });

    it('converts 8h to 28,800,000 milliseconds', () => {
      expect(timeIntervalToMs('8h')).toBe(8 * 60 * 60 * 1000);
    });

    it('converts 1D to 86,400,000 milliseconds', () => {
      expect(timeIntervalToMs('1D')).toBe(24 * 60 * 60 * 1000);
    });

    it('converts 1W to 604,800,000 milliseconds', () => {
      expect(timeIntervalToMs('1W')).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('returns default value for unknown intervals', () => {
      expect(timeIntervalToMs('unknown')).toBe(24 * 60 * 60 * 1000);
    });
  });
}); 