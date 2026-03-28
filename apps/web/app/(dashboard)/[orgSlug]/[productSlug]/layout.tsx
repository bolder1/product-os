export default function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string; productSlug: string }>
}) {
  return <>{children}</>
}
