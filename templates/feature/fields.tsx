import { TextField } from '@/shared/ui/form';
import type { FormControl } from '@/shared/ui/form/types';

import type { __Entity__FormInput } from './schemas';

export function __Entity__Fields({ control }: { control: FormControl<__Entity__FormInput> }) {
	return (
		<>
			<TextField control={control} name="name" label="Name" />
		</>
	);
}
