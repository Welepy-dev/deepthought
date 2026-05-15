import { Link } from "react-router"

export default function SignIn() {
	return (
		<>
			<div className="w-1/2 xl:w-2/5 h-96 bg-neutral_contrast flex items-center justify-between flex-col text-center pt-4 border-b-8 border-r-8 border-l-4 border-t-4 border-black">

				<div>

					<Link to={"Home"} className="text-contrast py-8  text-center font-custom text-4xl">
						Deepthought
					</Link>

					<div className="text-contrast pt-8 text-center font-pressStart">
						Exclusively for 42 Network students
					</div>

					<button className="text-neutral_contrast block mt-24 mx-auto font-pressStart text-[14px] 
						bg-contrast border-black border-t-4 border-l-4 border-b-8 border-r-8 hover:border-t-4 hover:border-l-4 hover:border-b-4 hover:border-r-4
						hover:translate-x-1 hover:translate-y-1
						transition-all duration-100 hover:bg-secundary
						py-4 px-10">
							Login with 42
					</button>

				</div>

				<div className="flex flex-col text-center xl:flex-row pb-4 justify-around w-full ">
					<Link className="font-pressStart text-contrast hover:text-secundary transition" to={"ToS"}>Terms of Service</Link>
					<Link className="font-pressStart text-contrast hover:text-secundary transition" to={"PrivacyPolicy"}>Privacy Policy</Link>
				</div>
			</div>
		</>
	)
}