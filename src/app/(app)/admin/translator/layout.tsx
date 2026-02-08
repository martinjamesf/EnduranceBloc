import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Translator Admin | EnduranceBloc',
  description: 'Monitor translation pipeline and review failures',
}

export default function AdminTranslatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
