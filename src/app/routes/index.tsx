import { createFileRoute, redirect } from '@tanstack/react-router';

/** `/` sends signed-in users to the dashboard (and the guard sends everyone else to /login). */
export const Route = createFileRoute('/')({
	beforeLoad: () => {
		throw redirect({ to: '/dashboard' });
	}
});
