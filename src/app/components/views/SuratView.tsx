import { SuratMenyuratModule } from "../SuratMenyurat/SuratMenyuratModule"

export type SuratSubTab = "ringkasan" | "masuk" | "keluar"

export function SuratView({ theme, subTab = "ringkasan" }: { theme: "light" | "dark"; subTab?: SuratSubTab }) {
  return <SuratMenyuratModule theme={theme} subTab={subTab} />
}
