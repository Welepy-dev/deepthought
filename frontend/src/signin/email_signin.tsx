import emailIcon from '../assets/closed_email.png'
import CustomButton from '../components/CustomButton'

export default function EmailSignIn() {

	return (
			<div className="flex flex-col items-center w-[500px]  h-96 bg-neutral_contrast border-b-8 border-r-8 border-l-4 border-t-4 border-black">
				<div className='flex flex-col items-center'>
					<img src={ emailIcon } alt="Email icon" className='w-24 h-auto'/>
					<p className="font-pressStart text-contrast">
						Email signin
					</p>
				</div>
				<input placeholder='johndoe@mail.com' className="text-center px-16 py-2 text-sm font-pressStart focus:outline-none border-b-8 mt-4 border-r-8 border-l-4 border-t-4 border-black" type="poggers" />
				<p className='font-pressStart text-center px-6 text-contrast text-xs mt-4'>A code will be sent to your email.</p>
				<CustomButton route='/OTPEmail' name='Send OTP code'></CustomButton>
			</div>
	)
}