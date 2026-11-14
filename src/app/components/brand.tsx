import { Link } from '@tanstack/react-router';

import { appConfig } from '@/config/app';

/** Logo + app name. Replace /public/favicon.svg and `appConfig.name` with your own. */
export function Brand() {
	return (
		<Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
			<img src="/favicon.svg" alt="" className="size-6" />
			{appConfig.name}
		</Link>
	);
}
