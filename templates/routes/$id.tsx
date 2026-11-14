import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';

import { __Entity__FormSheet } from '@/features/__route__/form-sheet';
import { __entity__Service } from '@/features/__route__/service';
import { AppException } from '@/shared/models/app-error/app-error';
import { PageHeader } from '@/shared/ui/layout/page-header';
import { DataGrid, DataItem, SectionCard } from '@/shared/ui/layout/section-card';
import { Button } from '@/shared/ui/primitives/button';

export const Route = createFileRoute('/_app/__route__/$id')({
	loader: async ({ context, params }) => {
		try {
			await context.queryClient.ensureQueryData(__entity__Service.options.detail(params.id));
		} catch (error) {
			if (error instanceof AppException && error.error.kind === 'notFound') throw notFound();
			throw error;
		}
	},
	component: __Entity__Page
});

function __Entity__Page() {
	const { id } = Route.useParams();
	const { data } = useSuspenseQuery(__entity__Service.options.detail(id));
	const [editing, setEditing] = useState(false);

	return (
		<>
			<PageHeader
				title={data.name}
				crumbs={[{ label: '__Title__', link: { to: '/__route__' } }, { label: data.name }]}
				actions={
					<Button onClick={() => setEditing(true)}>
						<Pencil /> Edit
					</Button>
				}
			/>
			<SectionCard title="Details">
				<DataGrid>
					<DataItem label="Name">{data.name}</DataItem>
				</DataGrid>
			</SectionCard>
			<__Entity__FormSheet row={data} open={editing} onOpenChange={setEditing} />
		</>
	);
}
