import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { Brand } from '@/app/components/brand';
import { sessionQuery } from '@/features/auth/session';
import { ModeToggle } from '@/shared/ui/theme/mode-toggle';

/**
 * Pathless layout for public auth pages (login, sign-up, password reset…).
 * Signed-in users are sent to the app instead.
 */
export const Route = createFileRoute('/_auth')({
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.ensureQueryData(sessionQuery).catch(() => null);
		if (user) throw redirect({ to: '/dashboard' });
	},
	component: AuthLayout
});

function AuthLayout() {
	return (
		<div className="flex min-h-dvh flex-col">
			<header className="flex h-14 items-center justify-between px-4 md:px-6">
				<Brand />
				<ModeToggle />
			</header>
			<main className="flex flex-1 items-center justify-center px-4 pb-16">
				<div className="w-full max-w-sm">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
