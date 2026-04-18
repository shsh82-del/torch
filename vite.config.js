import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// הגדרות קריטיות לתיקון שגיאת ה-403 והתמיכה ב-import.meta ב-Vercel
export default defineConfig({
  plugins: [react()],
  build: {
    // הגדרת יעד מודרני (ESNext) כדי לאפשר קריאה תקינה של משתני סביבה
    target: 'esnext'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  }
})
