import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/old-goat-track-club/',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/data/*', // Copy everything in the data folder
          dest: 'src/data',  // Place it in dist/data
        },
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        about: 'src/about.html',
        schedule: 'src/schedule.html',
        contact: 'src/contact.html',
        results: 'src/results.html',
        records: 'src/records.html',
        meet: 'src/meet.html',
        news: 'src/news.html',
        roster: 'src/roster.html',
      }
    }
  }
})
