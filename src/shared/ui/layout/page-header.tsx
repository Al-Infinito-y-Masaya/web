import { Link, type LinkOptions } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';

export type Crumb = { label: string; link?: LinkOptions };

/** Page heading: breadcrumbs, title, description, badges and actions on the right. */
export function PageHeader({
	title,
	crumbs,
	badges,
	actions,
	description
}: {
	title: ReactNode;
	crumbs?: Crumb[];
	badges?: ReactNode;
	actions?: ReactNode;
	description?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-end gap-x-6 gap-y-4">
			<div className="flex min-w-0 flex-1 flex-col gap-1.5">
				{crumbs && crumbs.length > 0 && (
					<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
						{crumbs.map((crumb, i) => (
							<Fragment key={crumb.label}>
								{i > 0 && (
									<ChevronRight
										aria-hidden
										className="size-3.5 text-muted-foreground"
									/>
								)}
								{crumb.link ? (
									<Link
										{...crumb.link}
										className="font-medium text-primary hover:underline"
									>
										{crumb.label}
									</Link>
								) : (
									<span aria-current="page" className="text-muted-foreground">
										{crumb.label}
									</span>
								)}
							</Fragment>
						))}
					</nav>
				)}
				<h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
					{title}
				</h1>
				{description && <p className="text-sm text-muted-foreground">{description}</p>}
				{badges && <div className="flex flex-wrap items-center gap-2">{badges}</div>}
			</div>
			{actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
		</div>
	);
}
