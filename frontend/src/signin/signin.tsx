import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import CustomButton from "../components/CustomButton"
import { API_BASE_URL } from "../config/api"

/** Passos do fluxo de login por email dentro do próprio ecrã de signin. */
type EmailStep = 'hidden' | 'email' | 'password'

export default function SignIn() {
	const fortyTwoLoginUrl = `${API_BASE_URL}/auth/42/login`
	const [searchParams] = useSearchParams()
	const oauthError = searchParams.get('oauthError')
	const navigate = useNavigate()

	const [emailStep, setEmailStep] = useState<EmailStep>('hidden')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	// Primeiro passo: o backend decide se o email existe e se já tem password.
	async function handleEmailContinue() {
		if (!email.includes('@')) {
			setError('Enter a valid email')
			return
		}

		setLoading(true)
		setError('')

		try {
			const response = await fetch(`${API_BASE_URL}/auth/email/start`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			})
			const data = await response.json()

			if (!response.ok) {
				setError(
					response.status === 404
						? 'This email is not registered'
						: data.message || 'Something went wrong',
				)
				return
			}

			if (data.status === 'setup' && data.userId) {
				// Primeiro login por email: OTP enviado, segue para definir a password.
				navigate(`/EmailSetup?userId=${encodeURIComponent(data.userId)}`)
				return
			}

			// Conta já tem password: pede-a no passo seguinte.
			setEmailStep('password')

		} catch {
			setError('Server error')
		} finally {
			setLoading(false)
		}
	}

	async function handleEmailLogin() {
		if (!password) {
			setError('Enter your password')
			return
		}

		setLoading(true)
		setError('')

		try {
			const response = await fetch(`${API_BASE_URL}/auth/email/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})
			const data = await response.json()

			if (!response.ok) {
				setError(data.message || 'Invalid password')
				return
			}

			// Mesmo contrato do resto do projeto: tokens em localStorage.
			localStorage.setItem('token', data.accessToken)
			localStorage.setItem('refreshToken', data.refreshToken)

			navigate(data.user?.characterCreated ? '/Game' : '/CharacterCreation')

		} catch {
			setError('Server error')
		} finally {
			setLoading(false)
		}
	}

	const inputClass = "w-full max-w-[280px] text-center py-2 text-xs font-pressStart focus:outline-none border-b-8 border-r-8 border-l-4 border-t-4 border-black"

	return (
			<div className="relative px-8 w-full max-w-[500px] space-y-16 pt-8 bg-neutral_contrast flex items-center justify-between flex-col text-center  border-b-8 border-r-8 border-l-4 border-t-4 border-black">

				<div>

					<Link className="text-3xl sm:text-4xl font-custom text-contrast" to="/">
						Deepthought
					</Link>
					<div className="text-white/70 text-sm pt-8 pb-4 text-center font-pressStart">
						Exclusively for 42 Network students
					</div>

					{oauthError === 'not_eligible' && (
						<div className="text-red-400 text-xs font-pressStart pb-4">
							this game is just for cadets, sorry :p
						</div>
					)}
					{oauthError === '42_unavailable' && (
						<div className="text-red-400 text-xs font-pressStart pb-4">
							42 login is unavailable, try again later
						</div>
					)}

					<CustomButton route={fortyTwoLoginUrl} name="Login with 42" />

					{emailStep === 'hidden' && (
						<button
							onClick={() => setEmailStep('email')}
							className="mt-6 text-xs font-pressStart text-contrast hover:text-secundary transition underline underline-offset-4"
						>
							login with email
						</button>
					)}

					{emailStep !== 'hidden' && (
						<div className="mt-6 flex flex-col items-center gap-4">

							<input
								value={email}
								onChange={(e) => {
									setEmail(e.target.value)
									setError('')
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && emailStep === 'email') handleEmailContinue()
								}}
								placeholder="email"
								className={inputClass}
								type="email"
								disabled={emailStep === 'password'}
								autoFocus
							/>

							{emailStep === 'password' && (
								<input
									value={password}
									onChange={(e) => {
										setPassword(e.target.value)
										setError('')
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter') handleEmailLogin()
									}}
									placeholder="password"
									className={inputClass}
									type="password"
									autoFocus
								/>
							)}

							{error && (
								<p className="text-red-400 text-xs font-pressStart">
									{error}
								</p>
							)}

							<button
								onClick={emailStep === 'email' ? handleEmailContinue : handleEmailLogin}
								disabled={loading}
								className="px-6 py-3 bg-black text-white font-pressStart text-xs disabled:opacity-50"
							>
								{loading ? '...' : emailStep === 'email' ? 'Continue' : 'Login'}
							</button>

						</div>
					)}

				</div>

				<div className=" flex flex-row text-center pb-4 justify-around w-full ">
					<Link className="text-xs font-pressStart text-contrast hover:text-secundary transition" to="/ToS">
						Terms of Service
					</Link>
					<Link className="text-xs font-pressStart text-contrast hover:text-secundary transition" to="/PrivacyPolicy">
						Privacy Policy
					</Link>
				</div>
				<div className="absolute right-4 bottom-4 text-xs text-white">
					v1.0
				</div>
			</div>
	)
}
