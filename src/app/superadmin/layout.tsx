// Top-level layout for /superadmin routes.
// Auth is handled in superadmin/(protected)/layout.tsx so the login page
// at /superadmin/login is NOT caught in the auth guard.
export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
