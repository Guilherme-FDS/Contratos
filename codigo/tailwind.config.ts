import type { Config } from "tailwindcss";

/**
 * Identidade Wegg (manual "Cores e Tipografia"):
 *   Deep Blue #003051 (40%) · Off-White #E8E4D8 (60%).
 * A escala `wegg` é derivada do Deep Blue; 900 é o oficial.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.ts"],
  theme: {
    extend: {
      colors: {
        wegg: {
          50: "#EEF3F7",
          100: "#D5E1EA",
          200: "#A9C0D2",
          300: "#7A9DB8",
          400: "#4B7899",
          500: "#27587C",
          600: "#134466",
          700: "#0A3A5C",
          800: "#053456",
          900: "#003051", // Deep Blue oficial
        },
        off: {
          DEFAULT: "#E8E4D8", // Off-White oficial
          50: "#F7F5F0",
          100: "#F1EEE6",
        },
      },
      fontFamily: {
        // Semplicita Pro é a fonte da marca (licença paga). Jost é a
        // alternativa livre mais próxima (geométrica, mesma família visual).
        sans: ["var(--fonte)", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
