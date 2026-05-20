import { Route, Routes } from "react-router-dom";
import App from "../App";
import EmailSignIn from "../signin/email_signin";
import SignIn from "../signin/signin";
import OTPEmail from "../signin/OTPemail";
import PhaserGame from "../game/PhaserGame";

export function AppRouter() {
	return (
		<Routes>
			<Route path="/" element=<App CustomComponent={SignIn}/>/>
			<Route path="/EmailSignIn" element=<App CustomComponent={EmailSignIn}/>/>
			<Route path="/OTPEmail" element=<App CustomComponent={OTPEmail}/>/>
			<Route path="/Game" element=<App CustomComponent={PhaserGame}/>/>
		</Routes>
	)
}