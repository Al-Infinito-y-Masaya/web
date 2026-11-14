import { X } from 'lucide-react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/shared/utils';

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
	return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
	return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

/** Side panel. No `aria-describedby` by default: the content describes itself. */
function SheetContent({
	className,
	children,
	side = 'right',
	...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: 'right' | 'left' }) {
	return (
		<SheetPrimitive.Portal>
			<SheetPrimitive.Overlay
				data-slot="sheet-overlay"
				className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
			/>
			<SheetPrimitive.Content
				data-slot="sheet-content"
				aria-describedby={undefined}
				className={cn(
					'fixed inset-y-0 z-50 flex h-full w-full flex-col bg-card text-card-foreground shadow-xl sm:max-w-[480px]',
					side === 'right'
						? 'right-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
						: 'left-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
					'data-[state=closed]:animate-out data-[state=closed]:duration-200',
					'data-[state=open]:animate-in data-[state=open]:duration-300',
					'motion-reduce:animate-none',
					className
				)}
				{...props}
			>
				{children}
				<SheetPrimitive.Close
					aria-label="Close"
					className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
				>
					<X className="size-4" />
				</SheetPrimitive.Close>
			</SheetPrimitive.Content>
		</SheetPrimitive.Portal>
	);
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
	return (
		<SheetPrimitive.Title
			data-slot="sheet-title"
			className={cn('text-xl leading-7 font-semibold', className)}
			{...props}
		/>
	);
}

export { Sheet, SheetClose, SheetContent, SheetTitle };
