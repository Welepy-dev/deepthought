/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			fontFamily: {
				custom: ['Karmatic_arcade', "sans-serif"],
				pressStart: ['PressStart', "sans-serif"],
			},
			colors: {
				white: "#FFFFFF",
				black: "#000000",
				contrast: "#00BABC",
				neutral_contrast: "#1A1A2E",
				secundary: "#E8FF00",
				background: "#111125"
			},
		},
	},
	plugins: [],
}