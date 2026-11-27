import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./app/theme-provider";

export const metadata: Metadata = { title: "MétricaSur — Tu negocio, más simple", description: "La plataforma de gestión que se adapta a tu negocio. Organizá clientes, tareas y operaciones desde un solo lugar." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body>
        <template
          id="theme-init"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=null;try{saved=localStorage.getItem('metricasur_theme')}catch(e){}var root=document.documentElement;if(saved==='light'||saved==='dark'){root.setAttribute('data-theme',saved)}else if(saved==='system'){root.setAttribute('data-theme',window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}else{root.setAttribute('data-theme','dark')}}catch(e){}})();`,
          }}
        ></template>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
