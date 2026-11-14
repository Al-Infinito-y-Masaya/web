# Authentication

## Default flow (cookie session)

```
/login ── POST /auth/login ──► backend sets HTTP-only cookie
   │
   └─► session cache = user ─► redirect to ?redirect or /dashboard

/_app/* ── beforeLoad: ensureQueryData(GET /auth/me)
              ├─ user → render
              └─ 401 → null → redirect /login?redirect=…

any API 401 ──► events.sessionExpired ──► session = null, redirect /login
sign out ──► POST /auth/logout ──► queryClient.clear()
```

Files:

| File                               | Role                                                      |
| ---------------------------------- | --------------------------------------------------------- |
| `src/features/auth/api.ts`         | `login`, `logout`, `me` endpoints                         |
| `src/features/auth/session.ts`     | `sessionQuery`, `useCurrentUser`, `useLogin`, `useLogout` |
| `src/features/auth/login-form.tsx` | The form                                                  |
| `src/app/routes/_auth/*`           | Public pages (redirect away when signed in)               |
| `src/app/routes/_app/route.tsx`    | The guard + 401 listener                                  |
| `src/config/query-client.ts`       | Turns 401s into `sessionExpired`                          |

To match your backend, edit `api.ts` (paths, payload, user shape) and the `LoginRequest`/`User` schemas — or replace them with your own OpenAPI schema.

## CSRF (Django, Rails, Laravel…)

```ts
// src/shared/client/index.ts
const csrf = new CSRFManager({
	headerName: 'x-csrftoken',
	fetchToken: async () => {
		const res = await appFetch(`${env.apiUrl}/auth/csrf`);
		return res.headers.get('x-csrftoken')!;
	}
});
const middlewares = [errorMiddleware, CSRFMiddleware(csrf)];
```

## JWT in HTTP-only cookies with refresh

```ts
const jwt = new JWTManager({
	verifyAccess: async () => (await appFetch(`${env.apiUrl}/auth/verify`, { method: 'POST' })).ok,
	refreshAccess: async () => (await appFetch(`${env.apiUrl}/auth/refresh`, { method: 'POST' })).ok
});
const middlewares = [
	errorMiddleware, // first = sees the final response
	JWTMiddleware(jwt, csrf, {
		send: appFetch,
		onSessionExpired: () => eventBus.dispatch(events.sessionExpired)
	}),
	CSRFMiddleware(csrf)
];
```

On a 401 the middleware refreshes once (concurrent 401s share one refresh) and replays the request.

## Bearer tokens

Store the token after login (memory or `localStorage`) and add a middleware:

```ts
const authMiddleware: Middleware = {
	onRequest({ request }) {
		const token = tokenStore.get();
		if (token) request.headers.set('Authorization', `Bearer ${token}`);
		return request;
	}
};
```

Then set `credentials: 'same-origin'` in `appFetch` if you do not need cookies.

## Roles and permissions

Add `beforeLoad` to a nested layout:

```tsx
export const Route = createFileRoute('/_app/admin')({
	beforeLoad: ({ context }) => {
		if (!context.user.roles.includes('admin')) throw redirect({ to: '/dashboard' });
	}
});
```
