import type EmailSignIn from "../signin/email_signin";

createBrowserRouter([
	{
		path: "/",
		Component: Root,
		children: [
			{ index: true, Component: Home },
			{ path: "emailSignIn", Component: EmailSignIn },
			{
			path: "auth",
			Component: AuthLayout,
			children: [
				{ path: "login", Component: Login },
				{ path: "register", Component: Register },
			],
			},
			{
			path: "concerts",
			children: [
				{ index: true, Component: ConcertsHome },
				{ path: ":city", Component: ConcertsCity },
				{ path: "trending", Component: ConcertsTrending },
			],
			},
		],
	},
]);
