import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import emailIcon from '../assets/open_email.png'
import { API_BASE_URL } from '../config/api'

/**
 * Onboarding do primeiro login por email.
 * O backend já enviou um código OTP para o email registado; aqui o utilizador
 * prova posse do email e define a password que passa a usar nos próximos logins.
 */
export default function EmailSetup() {

	const [otp, setOtp] = useState('')
	const [password, setPassword] = useState('')
	const [confirm, setConfirm] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	// userId vem de /auth/email/start quando a conta ainda não tem password.
	const userId = searchParams.get('userId')

	async function handleSetPassword() {

		if (!userId) {
			setError('User not found in setup link')
			return
		}

		if (otp.length !== 6) {
			setError('Invalid OTP code')
			return
		}

		if (password.length < 8) {
			setError('Password must be at least 8 characters')
			return
		}

		if (password !== confirm) {
			setError('Passwords do not match')
			return
		}

		setLoading(true)

		try {

			const response = await fetch(`${API_BASE_URL}/auth/email/set-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userId,
					code: otp,
					password,
				}),
			})
			const data = await response.json()

			if (!response.ok) {
				setError(data.message || 'Invalid OTP')
				return
			}

			if (!data.success || !data.accessToken || !data.refreshToken) {
				setError('Invalid server response')
				return
			}

			// O resto do projeto já usa localStorage.token/refreshToken para proteger /Game.
			localStorage.setItem('token', data.accessToken)
			localStorage.setItem('refreshToken', data.refreshToken)

			navigate(data.user?.characterCreated ? '/Game' : '/CharacterCreation')

		} catch {
			setError('Server error')
		} finally {
			setLoading(false)
		}
	}

	const inputClass = "text-center py-2 text-sm font-pressStart focus:outline-none mt-4 border-b-8 border-r-8 border-l-4 border-t-4 border-black"

	return (
		<div className="flex flex-col items-center w-full max-w-[500px] min-h-96 pb-8 bg-neutral_contrast border-b-8 border-r-8 border-l-4 border-t-4 border-black">

			<div className='flex flex-col items-center'>
				<img src={emailIcon} alt="Email icon" className='w-24 h-auto' />
			</div>

			<p className='px-8 font-pressStart text-contrast text-xs text-center'>
				First login with email: enter the code we sent you and set your password.
			</p>

			<input
				value={otp}
				onChange={(e) => {
					setOtp(e.target.value)
					setError('')
				}}
				placeholder="* * * * * *"
				className={inputClass}
				type="text"
				maxLength={6}
			/>

			<input
				value={password}
				onChange={(e) => {
					setPassword(e.target.value)
					setError('')
				}}
				placeholder="new password"
				className={inputClass}
				type="password"
			/>

			<input
				value={confirm}
				onChange={(e) => {
					setConfirm(e.target.value)
					setError('')
				}}
				placeholder="confirm password"
				className={inputClass}
				type="password"
			/>

			{
				error &&
				<p className='text-red-500 text-xs font-pressStart pt-4'>
					{error}
				</p>
			}

			<button
				onClick={handleSetPassword}
				disabled={loading}
				className="mt-6 px-6 py-3 bg-black text-white font-pressStart text-xs disabled:opacity-50"
			>
				{loading ? '...' : 'Set password'}
			</button>

		</div>
	)
}
